import { cache } from 'react';
import { MongoClient, Db } from 'mongodb';
import {
  DrawRecord,
  LotteryType,
  LotteryStats,
  NumberStat,
  SuggestionRecord,
  EvenOddStat,
  HighLowStat,
  TrendDataPoint,
} from './types';
import {
  SEED_DRAWS_MEGA645,
  SEED_DRAWS_POWER655,
  SEED_SUGGESTION_LOGS,
  calculateNumberStats,
  calculateEvenOdd,
  calculateHighLow,
  calculateTrendData,
} from './seed-data';

// Global in-memory fallback store so the application runs seamlessly
// even before MONGODB_URI is provided by the user
let memoryDrawsMega: DrawRecord[] = [...SEED_DRAWS_MEGA645];
let memoryDrawsPower: DrawRecord[] = [...SEED_DRAWS_POWER655];
let memorySuggestions: SuggestionRecord[] = [...SEED_SUGGESTION_LOGS];

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;
let lastFailedTime = 0;
const RETRY_COOLDOWN_MS = 60000; // 60s cooldown on connection failures

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  // Fast-fail if recent connection attempt failed
  if (Date.now() - lastFailedTime < RETRY_COOLDOWN_MS) {
    return null;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      cachedClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      await cachedClient.connect();
      cachedDb = cachedClient.db('lotovn_ai');
      return cachedDb;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to local seed data:', err);
      lastFailedTime = Date.now();
      if (cachedClient) {
        try {
          await cachedClient.close();
        } catch (_) {}
        cachedClient = null;
      }
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

// ----------------------------------------------------
// DRAWS REPOSITORY
// ----------------------------------------------------
export const getDraws = cache(async (lotteryType: LotteryType, limit = 50): Promise<DrawRecord[]> => {
  const db = await getMongoDb();
  if (db) {
    try {
      const col = db.collection<DrawRecord>('draws');
      const docs = await col
        .find({ lotteryType })
        .sort({ drawDate: -1 })
        .limit(limit)
        .toArray();
      if (docs && docs.length > 0) {
        return docs.map((doc) => ({
          id: doc.id,
          lotteryType: doc.lotteryType,
          drawDate: doc.drawDate,
          numbers: doc.numbers,
          bonusNumber: doc.bonusNumber,
          jackpotValue: doc.jackpotValue,
          hasWinner: doc.hasWinner,
          createdAt: doc.createdAt,
        }));
      }
    } catch (error) {
      console.warn('MongoDB fetch error, using fallback:', error);
    }
  }

  // Fallback to in-memory seed data
  const list = lotteryType === 'mega645' ? memoryDrawsMega : memoryDrawsPower;
  return [...list]
    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
    .slice(0, limit);
});

export async function addDraw(draw: Omit<DrawRecord, 'createdAt'>): Promise<DrawRecord> {
  const newRecord: DrawRecord = {
    ...draw,
    createdAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection<DrawRecord>('draws').insertOne(newRecord);
    } catch (error) {
      console.warn('Failed inserting draw into MongoDB:', error);
    }
  }

  if (newRecord.lotteryType === 'mega645') {
    memoryDrawsMega.unshift(newRecord);
  } else {
    memoryDrawsPower.unshift(newRecord);
  }

  // Automatically evaluate pending suggestions against this new draw
  await evaluatePendingSuggestions(newRecord);

  return newRecord;
}

// ----------------------------------------------------
// STATISTICS
// ----------------------------------------------------
export const getLotteryStats = cache(async (lotteryType: LotteryType, timeRangeDraws = 30): Promise<LotteryStats> => {
  const draws = await getDraws(lotteryType, timeRangeDraws);
  const numberStats = calculateNumberStats(draws, lotteryType);
  const evenOdd = calculateEvenOdd(draws);
  const highLow = calculateHighLow(draws, lotteryType);
  const trend = calculateTrendData(draws);

  // Summary indicators
  const hotNumbers = numberStats.filter((s) => s.status === 'hot').sort((a, b) => b.count - a.count);
  const coldNumbers = numberStats.filter((s) => s.status === 'cold').sort((a, b) => a.count - b.count);
  const overdueNumbers = [...numberStats].sort((a, b) => b.drought - a.drought).slice(0, 10);

  return {
    lotteryType,
    totalDrawsAnalyzed: draws.length,
    numberStats,
    evenOdd,
    highLow,
    trend,
    hotNumbers: hotNumbers.slice(0, 6),
    coldNumbers: coldNumbers.slice(0, 6),
    overdueNumbers,
    latestDraw: draws[0] || null,
  };
});

// ----------------------------------------------------
// SUGGESTIONS REPOSITORY & ACCURACY TRACKING
// ----------------------------------------------------
export const getSuggestionLogs = cache(async (lotteryType?: LotteryType): Promise<SuggestionRecord[]> => {
  const db = await getMongoDb();
  if (db) {
    try {
      const filter = lotteryType ? { lotteryType } : {};
      const docs = await db
        .collection<SuggestionRecord>('suggestions')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();
      if (docs && docs.length > 0) {
        return docs;
      }
    } catch (error) {
      console.warn('MongoDB suggestion query error:', error);
    }
  }

  const list = lotteryType
    ? memorySuggestions.filter((s) => s.lotteryType === lotteryType)
    : memorySuggestions;
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

export async function saveSuggestionLog(suggestion: SuggestionRecord): Promise<SuggestionRecord> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection<SuggestionRecord>('suggestions').insertOne(suggestion);
    } catch (error) {
      console.warn('Failed inserting suggestion to MongoDB:', error);
    }
  }

  memorySuggestions.unshift(suggestion);
  return suggestion;
}

export async function evaluatePendingSuggestions(newDraw: DrawRecord) {
  const winSet = new Set(newDraw.numbers);

  // Evaluate in-memory
  memorySuggestions.forEach((sug) => {
    if (sug.lotteryType === newDraw.lotteryType && sug.status === 'pending_draw') {
      const matched: number[] = [];
      sug.suggestedNumbers.forEach((item) => {
        if (winSet.has(item.number)) {
          matched.push(item.number);
        }
      });
      sug.matchedNumbers = matched;
      sug.matchCount = matched.length;
      sug.targetDrawId = newDraw.id;
      sug.status = 'evaluated';
    }
  });

  // Evaluate in MongoDB if connected
  const db = await getMongoDb();
  if (db) {
    try {
      const col = db.collection<SuggestionRecord>('suggestions');
      const pending = await col
        .find({ lotteryType: newDraw.lotteryType, status: 'pending_draw' })
        .toArray();
      for (const doc of pending) {
        const matched: number[] = [];
        doc.suggestedNumbers.forEach((item) => {
          if (winSet.has(item.number)) {
            matched.push(item.number);
          }
        });
        await col.updateOne(
          { _id: doc._id },
          {
            $set: {
              matchedNumbers: matched,
              matchCount: matched.length,
              targetDrawId: newDraw.id,
              status: 'evaluated',
            },
          }
        );
      }
    } catch (err) {
      console.warn('Failed evaluating MongoDB pending suggestions:', err);
    }
  }
}
