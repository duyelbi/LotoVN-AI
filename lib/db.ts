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
  CronLogRecord,
} from './types';
import {
  calculateNumberStats,
  calculateEvenOdd,
  calculateHighLow,
  calculateTrendData,
} from './seed-data';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;
let lastFailedTime = 0;
const RETRY_COOLDOWN_MS = 60000;

async function ensureIndexes(db: Db): Promise<void> {
  try {
    await Promise.all([
      db.collection('draws').createIndex({ lotteryType: 1, drawDate: -1 }),
      db.collection('suggestions').createIndex({ lotteryType: 1, createdAt: -1 }),
      db.collection('cron_logs').createIndex({ runAt: -1 }),
    ]);
  } catch (err) {
    console.warn('Failed ensuring MongoDB indexes:', err);
  }
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    throw new Error('Chưa cấu hình MONGODB_URI.');
  }

  if (cachedDb) {
    return cachedDb;
  }

  if (Date.now() - lastFailedTime < RETRY_COOLDOWN_MS) {
    throw new Error('Kết nối MongoDB đang trong thời gian chờ (cooldown) do lỗi trước đó.');
  }

  if (connectPromise) {
    return (await connectPromise)!;
  }

  connectPromise = (async () => {
    try {
      cachedClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await cachedClient.connect();
      cachedDb = cachedClient.db('lotovn_ai');
      await ensureIndexes(cachedDb);
      return cachedDb;
    } catch (err) {
      console.warn('MongoDB connection failed:', err);
      lastFailedTime = Date.now();
      if (cachedClient) {
        try {
          await cachedClient.close();
        } catch (_) {}
        cachedClient = null;
      }
      throw new Error(`Không thể kết nối đến MongoDB: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      connectPromise = null;
    }
  })();

  return (await connectPromise)!;
}

export const getDraws = cache(async (lotteryType: LotteryType, limit: number | 'all' = 50): Promise<DrawRecord[]> => {
  const db = await getMongoDb();
  const col = db.collection<DrawRecord>('draws');
  
  // Use aggregation to deduplicate by id, preferring 'official' source
  const pipeline: any[] = [
    { $match: { lotteryType } },
    { $sort: { drawDate: -1, source: -1 } }, // 'official' > 'community' alphabetically
    { $group: {
        _id: "$id",
        doc: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { drawDate: -1 } }
  ];

  if (limit !== 'all') {
    pipeline.push({ $limit: limit });
  }

  const docs = await col.aggregate(pipeline).toArray();
  
  return docs.map((doc) => ({
    id: doc.id,
    lotteryType: doc.lotteryType,
    drawDate: doc.drawDate,
    numbers: doc.numbers,
    bonusNumber: doc.bonusNumber,
    jackpotValue: doc.jackpotValue,
    hasWinner: doc.hasWinner,
    createdAt: doc.createdAt,
    source: doc.source,
    syncedAt: doc.syncedAt,
  }));
});

export async function addDraw(draw: Omit<DrawRecord, 'createdAt'>): Promise<DrawRecord> {
  const newRecord: DrawRecord = {
    ...draw,
    createdAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  await db.collection<DrawRecord>('draws').insertOne(newRecord);
  await evaluatePendingSuggestions(newRecord);
  return newRecord;
}

export async function addDrawsBulk(draws: Omit<DrawRecord, 'createdAt'>[]): Promise<{ upsertedCount: number, modifiedCount: number }> {
  if (draws.length === 0) return { upsertedCount: 0, modifiedCount: 0 };
  
  const db = await getMongoDb();
  
  const bulkOps = draws.map((draw) => ({
    updateOne: {
      filter: { id: draw.id, lotteryType: draw.lotteryType, source: draw.source },
      update: { 
        $setOnInsert: {
          ...draw,
          createdAt: new Date().toISOString()
        } 
      },
      upsert: true
    }
  }));

  const result = await db.collection<DrawRecord>('draws').bulkWrite(bulkOps, { ordered: false });
  return { upsertedCount: result.upsertedCount, modifiedCount: result.modifiedCount };
}


export async function updateDrawSource(drawId: string, source: 'official'): Promise<void> {
  const db = await getMongoDb();
  await db.collection<DrawRecord>('draws').updateOne(
    { id: drawId },
    { $set: { source, syncedAt: new Date().toISOString() } }
  );
}

export const getLotteryStats = cache(async (lotteryType: LotteryType, timeRangeDraws: number | 'all' = 30): Promise<LotteryStats> => {
  const draws = await getDraws(lotteryType, timeRangeDraws);
  const numberStats = calculateNumberStats(draws, lotteryType);
  const evenOdd = calculateEvenOdd(draws);
  const highLow = calculateHighLow(draws, lotteryType);
  const trend = calculateTrendData(draws);

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

export const getSuggestionLogs = cache(async (lotteryType?: LotteryType): Promise<SuggestionRecord[]> => {
  const db = await getMongoDb();
  const filter = lotteryType ? { lotteryType } : {};
  return await db
    .collection<SuggestionRecord>('suggestions')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();
});

export async function saveSuggestionLog(suggestion: SuggestionRecord): Promise<SuggestionRecord> {
  const db = await getMongoDb();
  await db.collection<SuggestionRecord>('suggestions').insertOne(suggestion);
  return suggestion;
}

export async function saveCronLog(log: Omit<CronLogRecord, 'id'>): Promise<CronLogRecord> {
  const record: CronLogRecord = {
    ...log,
    id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const db = await getMongoDb();
  await db.collection<CronLogRecord>('cron_logs').insertOne(record);
  return record;
}

export const getCronLogs = cache(async (limit = 20): Promise<CronLogRecord[]> => {
  const db = await getMongoDb();
  const docs = await db
    .collection<CronLogRecord>('cron_logs')
    .find({})
    .sort({ runAt: -1 })
    .limit(limit)
    .toArray();
  
  return docs.map((doc) => ({
    id: doc.id,
    runAt: doc.runAt,
    triggeredBy: doc.triggeredBy,
    triggeredByEmail: doc.triggeredByEmail,
    results: doc.results,
    success: doc.success,
  }));
});

export interface AdminDataOverview {
  totalDraws: number;
  megaDrawsCount: number;
  powerDrawsCount: number;
  officialSourceCount: number;
  communitySourceCount: number;
  latestMegaDraw?: DrawRecord;
  latestPowerDraw?: DrawRecord;
  recentDraws: DrawRecord[];
}

export const getAdminDataOverview = cache(async (): Promise<AdminDataOverview> => {
  const db = await getMongoDb();
  const collection = db.collection<DrawRecord>('draws');
  const totalDraws = await collection.countDocuments({});
  const megaDrawsCount = await collection.countDocuments({ lotteryType: 'mega645' });
  const powerDrawsCount = await collection.countDocuments({ lotteryType: 'power655' });
  const officialSourceCount = await collection.countDocuments({ source: 'official' });
  const communitySourceCount = await collection.countDocuments({ source: 'community' });

  const latestMegaDocs = await collection.find({ lotteryType: 'mega645' }).sort({ drawDate: -1 }).limit(1).toArray();
  const latestPowerDocs = await collection.find({ lotteryType: 'power655' }).sort({ drawDate: -1 }).limit(1).toArray();
  const recentDocs = await collection.find({}).sort({ drawDate: -1, createdAt: -1 }).limit(10).toArray();

  const mapDoc = (doc: any): DrawRecord => ({
    id: doc.id,
    lotteryType: doc.lotteryType,
    drawDate: doc.drawDate,
    numbers: doc.numbers,
    bonusNumber: doc.bonusNumber,
    jackpotValue: doc.jackpotValue,
    hasWinner: doc.hasWinner,
    createdAt: doc.createdAt,
    source: doc.source,
    syncedAt: doc.syncedAt,
  });

  return {
    totalDraws,
    megaDrawsCount,
    powerDrawsCount,
    officialSourceCount,
    communitySourceCount,
    latestMegaDraw: latestMegaDocs[0] ? mapDoc(latestMegaDocs[0]) : undefined,
    latestPowerDraw: latestPowerDocs[0] ? mapDoc(latestPowerDocs[0]) : undefined,
    recentDraws: recentDocs.map(mapDoc),
  };
});

export async function evaluatePendingSuggestions(newDraw: DrawRecord) {
  const winSet = new Set(newDraw.numbers);
  const db = await getMongoDb();
  
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
}
