import { cache } from 'react';
import { MongoClient, Db } from 'mongodb';
import {
  DrawRecord,
  LotteryType,
  LotteryStats,
  SuggestionRecord,
  CronLogRecord,
  AdminGroupedDraw,
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

/** In-memory fallback so the app still runs when MONGODB_URI is missing or Mongo is down. */
let memoryDrawsMega: DrawRecord[] = [...SEED_DRAWS_MEGA645];
let memoryDrawsPower: DrawRecord[] = [...SEED_DRAWS_POWER655];
let memorySuggestions: SuggestionRecord[] = [...SEED_SUGGESTION_LOGS];
let memoryCronLogs: CronLogRecord[] = [];

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;
let lastFailedTime = 0;
const RETRY_COOLDOWN_MS = 60000;

function memoryDrawsFor(lotteryType: LotteryType): DrawRecord[] {
  return lotteryType === 'mega645' ? memoryDrawsMega : memoryDrawsPower;
}

function mapDraw(doc: DrawRecord): DrawRecord {
  return {
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
  };
}

/** Prefer official over community when both exist for the same draw id. */
function dedupePreferOfficial(draws: DrawRecord[]): DrawRecord[] {
  const byId = new Map<string, DrawRecord>();
  const sorted = [...draws].sort((a, b) => b.drawDate.localeCompare(a.drawDate));
  for (const draw of sorted) {
    const existing = byId.get(draw.id);
    if (!existing || (draw.source === 'official' && existing.source !== 'official')) {
      byId.set(draw.id, draw);
    }
  }
  return [...byId.values()].sort((a, b) => b.drawDate.localeCompare(a.drawDate));
}

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

/**
 * Returns a connected Db, or `null` when URI is missing / connection failed.
 * Callers in this module must fall back to in-memory seed data — never throw to the UI.
 */
export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  if (Date.now() - lastFailedTime < RETRY_COOLDOWN_MS) {
    return null;
  }

  if (connectPromise) {
    return connectPromise;
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

export const getDraws = cache(async (lotteryType: LotteryType, limit: number | 'all' = 50): Promise<DrawRecord[]> => {
  const db = await getMongoDb();
  if (db) {
    try {
      const col = db.collection<DrawRecord>('draws');
      const pipeline: object[] = [
        { $match: { lotteryType } },
        { $sort: { drawDate: -1, source: -1 } },
        {
          $group: {
            _id: '$id',
            doc: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$doc' } },
        { $sort: { drawDate: -1 } },
      ];
      if (limit !== 'all') {
        pipeline.push({ $limit: limit });
      }
      const docs = await col.aggregate(pipeline).toArray();
      return docs.map((doc) => mapDraw(doc as DrawRecord));
    } catch (error) {
      console.warn('MongoDB fetch error, using fallback:', error);
    }
  }

  const list = dedupePreferOfficial(memoryDrawsFor(lotteryType));
  return limit === 'all' ? list : list.slice(0, limit);
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
      console.warn('Failed inserting draw into MongoDB, using memory store:', error);
      upsertMemoryDraw(newRecord);
    }
  } else {
    upsertMemoryDraw(newRecord);
  }

  await evaluatePendingSuggestions(newRecord);
  return newRecord;
}

export async function addDrawsBulk(
  draws: Omit<DrawRecord, 'createdAt'>[]
): Promise<{ upsertedCount: number; modifiedCount: number }> {
  if (draws.length === 0) return { upsertedCount: 0, modifiedCount: 0 };

  const withCreatedAt: DrawRecord[] = draws.map((draw) => ({
    ...draw,
    createdAt: new Date().toISOString(),
  }));

  const db = await getMongoDb();
  if (db) {
    try {
      const bulkOps = withCreatedAt.map((draw) => ({
        updateOne: {
          filter: { id: draw.id, lotteryType: draw.lotteryType, source: draw.source },
          update: {
            $setOnInsert: draw,
          },
          upsert: true,
        },
      }));
      const result = await db.collection<DrawRecord>('draws').bulkWrite(bulkOps, { ordered: false });
      return { upsertedCount: result.upsertedCount, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.warn('Failed bulk writing draws into MongoDB, using memory store:', error);
    }
  }

  let upsertedCount = 0;
  for (const draw of withCreatedAt) {
    if (upsertMemoryDraw(draw)) upsertedCount += 1;
  }
  return { upsertedCount, modifiedCount: 0 };
}

function upsertMemoryDraw(draw: DrawRecord): boolean {
  const list = draw.lotteryType === 'mega645' ? memoryDrawsMega : memoryDrawsPower;
  const idx = list.findIndex((d) => d.id === draw.id && d.source === draw.source);
  if (idx >= 0) return false;
  list.unshift(draw);
  return true;
}

export async function updateDrawSource(drawId: string, source: 'official'): Promise<void> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection<DrawRecord>('draws').updateOne(
        { id: drawId },
        { $set: { source, syncedAt: new Date().toISOString() } }
      );
      return;
    } catch (error) {
      console.warn('Failed updating draw source in MongoDB:', error);
    }
  }
  for (const list of [memoryDrawsMega, memoryDrawsPower]) {
    const found = list.find((d) => d.id === drawId);
    if (found) {
      found.source = source;
      found.syncedAt = new Date().toISOString();
      break;
    }
  }
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
  if (db) {
    try {
      const filter = lotteryType ? { lotteryType } : {};
      return await db
        .collection<SuggestionRecord>('suggestions')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();
    } catch (error) {
      console.warn('MongoDB suggestion fetch error, using fallback:', error);
    }
  }
  const list = lotteryType
    ? memorySuggestions.filter((s) => s.lotteryType === lotteryType)
    : memorySuggestions;
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30);
});

export async function saveSuggestionLog(suggestion: SuggestionRecord): Promise<SuggestionRecord> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection<SuggestionRecord>('suggestions').insertOne(suggestion);
      return suggestion;
    } catch (error) {
      console.warn('Failed saving suggestion to MongoDB, using memory store:', error);
    }
  }
  memorySuggestions.unshift(suggestion);
  return suggestion;
}

export async function saveCronLog(log: Omit<CronLogRecord, 'id'>): Promise<CronLogRecord> {
  const record: CronLogRecord = {
    ...log,
    id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection<CronLogRecord>('cron_logs').insertOne(record);
      return record;
    } catch (error) {
      console.warn('Failed saving cron log to MongoDB, using memory store:', error);
    }
  }
  memoryCronLogs.unshift(record);
  memoryCronLogs = memoryCronLogs.slice(0, 50);
  return record;
}

export const getCronLogs = cache(async (limit = 20): Promise<CronLogRecord[]> => {
  const db = await getMongoDb();
  if (db) {
    try {
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
    } catch (error) {
      console.warn('MongoDB cron log fetch error, using fallback:', error);
    }
  }
  return memoryCronLogs.slice(0, limit);
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

function overviewFromDraws(all: DrawRecord[]): AdminDataOverview {
  const mega = all.filter((d) => d.lotteryType === 'mega645');
  const power = all.filter((d) => d.lotteryType === 'power655');
  const byDate = [...all].sort((a, b) => b.drawDate.localeCompare(a.drawDate));
  return {
    totalDraws: all.length,
    megaDrawsCount: mega.length,
    powerDrawsCount: power.length,
    officialSourceCount: all.filter((d) => d.source === 'official').length,
    communitySourceCount: all.filter((d) => d.source === 'community').length,
    latestMegaDraw: dedupePreferOfficial(mega)[0],
    latestPowerDraw: dedupePreferOfficial(power)[0],
    recentDraws: byDate.slice(0, 10).map(mapDraw),
  };
}

export const getAdminDataOverview = cache(async (): Promise<AdminDataOverview> => {
  const db = await getMongoDb();
  if (db) {
    try {
      const collection = db.collection<DrawRecord>('draws');
      const [totalDraws, megaDrawsCount, powerDrawsCount, officialSourceCount, communitySourceCount] =
        await Promise.all([
          collection.countDocuments({}),
          collection.countDocuments({ lotteryType: 'mega645' }),
          collection.countDocuments({ lotteryType: 'power655' }),
          collection.countDocuments({ source: 'official' }),
          collection.countDocuments({ source: 'community' }),
        ]);
      const latestMegaDocs = await collection.find({ lotteryType: 'mega645' }).sort({ drawDate: -1 }).limit(1).toArray();
      const latestPowerDocs = await collection.find({ lotteryType: 'power655' }).sort({ drawDate: -1 }).limit(1).toArray();
      const recentDocs = await collection.find({}).sort({ drawDate: -1, createdAt: -1 }).limit(10).toArray();
      return {
        totalDraws,
        megaDrawsCount,
        powerDrawsCount,
        officialSourceCount,
        communitySourceCount,
        latestMegaDraw: latestMegaDocs[0] ? mapDraw(latestMegaDocs[0]) : undefined,
        latestPowerDraw: latestPowerDocs[0] ? mapDraw(latestPowerDocs[0]) : undefined,
        recentDraws: recentDocs.map(mapDraw),
      };
    } catch (error) {
      console.warn('MongoDB admin overview error, using fallback:', error);
    }
  }
  return overviewFromDraws([...memoryDrawsMega, ...memoryDrawsPower]);
});

export async function evaluatePendingSuggestions(newDraw: DrawRecord) {
  const winSet = new Set(newDraw.numbers);
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
          if (winSet.has(item.number)) matched.push(item.number);
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
      return;
    } catch (error) {
      console.warn('Failed evaluating suggestions in MongoDB, using memory store:', error);
    }
  }

  for (const doc of memorySuggestions) {
    if (doc.lotteryType !== newDraw.lotteryType || doc.status !== 'pending_draw') continue;
    const matched: number[] = [];
    doc.suggestedNumbers.forEach((item) => {
      if (winSet.has(item.number)) matched.push(item.number);
    });
    doc.matchedNumbers = matched;
    doc.matchCount = matched.length;
    doc.targetDrawId = newDraw.id;
    doc.status = 'evaluated';
  }
}

/** Distinct draw ids for one lottery type (used by missing-draw scan and dashboard count). */
export async function countUniqueDraws(lotteryType: LotteryType): Promise<number> {
  const ids = await getStoredDrawIds(lotteryType);
  return ids.size;
}

export async function getStoredDrawIds(lotteryType: LotteryType): Promise<Set<string>> {
  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db
        .collection<DrawRecord>('draws')
        .find({ lotteryType }, { projection: { id: 1 } })
        .toArray();
      return new Set(docs.map((d) => d.id));
    } catch (error) {
      console.warn('MongoDB getStoredDrawIds error, using fallback:', error);
    }
  }
  return new Set(memoryDrawsFor(lotteryType).map((d) => d.id));
}

export async function getDrawSources(id: string, lotteryType: LotteryType): Promise<Set<string>> {
  const db = await getMongoDb();
  if (db) {
    try {
      const docs = await db
        .collection<DrawRecord>('draws')
        .find({ id, lotteryType }, { projection: { source: 1 } })
        .toArray();
      return new Set(docs.map((d) => d.source).filter(Boolean) as string[]);
    } catch (error) {
      console.warn('MongoDB getDrawSources error, using fallback:', error);
    }
  }
  return new Set(
    memoryDrawsFor(lotteryType)
      .filter((d) => d.id === id && d.source)
      .map((d) => d.source as string)
  );
}

/** Keys `${id}-${source}` of the most recent draws — used by daily cron skip-if-exists. */
export async function getRecentDrawSourceKeys(lotteryType: LotteryType, limit = 20): Promise<Set<string>> {
  const db = await getMongoDb();
  if (db) {
    try {
      const rawDraws = await db
        .collection<DrawRecord>('draws')
        .find({ lotteryType })
        .sort({ drawDate: -1 })
        .limit(limit)
        .toArray();
      return new Set(rawDraws.map((d) => `${d.id}-${d.source}`));
    } catch (error) {
      console.warn('MongoDB getRecentDrawSourceKeys error, using fallback:', error);
    }
  }
  return new Set(
    [...memoryDrawsFor(lotteryType)]
      .sort((a, b) => b.drawDate.localeCompare(a.drawDate))
      .slice(0, limit)
      .map((d) => `${d.id}-${d.source}`)
  );
}

export async function getAdminGroupedDraws(opts: {
  type: string;
  syncStatus: string;
  limit: number | 'all';
  page: number;
}): Promise<{
  draws: AdminGroupedDraw[];
  pagination: { total: number; page: number; limit: number | 'all'; totalPages: number };
}> {
  const { type, syncStatus, limit, page } = opts;

  const groupFromList = (docs: DrawRecord[]): AdminGroupedDraw[] => {
    const groups = new Map<string, AdminGroupedDraw>();
    for (const doc of docs) {
      if (type !== 'all' && doc.lotteryType !== type) continue;
      const key = `${doc.lotteryType}:${doc.id}`;
      const current = groups.get(key) || {
        id: doc.id,
        lotteryType: doc.lotteryType,
        drawDate: doc.drawDate,
      };
      if (doc.source === 'official') current.official = mapDraw(doc);
      if (doc.source === 'community') current.community = mapDraw(doc);
      if (doc.drawDate > current.drawDate) current.drawDate = doc.drawDate;
      groups.set(key, current);
    }
    let list = [...groups.values()];
    if (syncStatus === 'missing') {
      list = list.filter((g) => !g.official || !g.community);
    }
    list.sort((a, b) => b.drawDate.localeCompare(a.drawDate));
    return list;
  };

  const db = await getMongoDb();
  if (db) {
    try {
      const col = db.collection<DrawRecord>('draws');
      const matchStage: Record<string, string> = {};
      if (type !== 'all') matchStage.lotteryType = type;

      const countPipeline: object[] = [
        { $match: matchStage },
        { $group: { _id: { id: '$id', lotteryType: '$lotteryType' }, sourceCount: { $sum: 1 } } },
      ];
      if (syncStatus === 'missing') {
        countPipeline.push({ $match: { sourceCount: { $lt: 2 } } });
      }
      countPipeline.push({ $count: 'total' });
      const countResult = await col.aggregate(countPipeline).toArray();
      const totalRecords = countResult.length > 0 ? countResult[0].total : 0;
      const totalPages = limit === 'all' ? 1 : Math.ceil(totalRecords / (limit as number));

      const dataPipeline: object[] = [
        { $match: matchStage },
        {
          $group: {
            _id: { id: '$id', lotteryType: '$lotteryType' },
            id: { $first: '$id' },
            lotteryType: { $first: '$lotteryType' },
            drawDate: { $first: '$drawDate' },
            docs: { $push: '$$ROOT' },
            sourceCount: { $sum: 1 },
          },
        },
      ];
      if (syncStatus === 'missing') {
        dataPipeline.push({ $match: { sourceCount: { $lt: 2 } } });
      }
      dataPipeline.push({ $sort: { drawDate: -1 } });
      if (limit !== 'all') {
        dataPipeline.push({ $skip: (page - 1) * (limit as number) });
        dataPipeline.push({ $limit: limit });
      }
      const groupedDocs = await col.aggregate(dataPipeline).toArray();
      const draws = groupedDocs.map((doc) => {
        const official = (doc.docs as DrawRecord[]).find((d) => d.source === 'official');
        const community = (doc.docs as DrawRecord[]).find((d) => d.source === 'community');
        return {
          id: doc.id as string,
          lotteryType: doc.lotteryType as LotteryType,
          drawDate: doc.drawDate as string,
          official: official ? mapDraw(official) : undefined,
          community: community ? mapDraw(community) : undefined,
        };
      });
      return { draws, pagination: { total: totalRecords, page, limit, totalPages } };
    } catch (error) {
      console.warn('MongoDB getAdminGroupedDraws error, using fallback:', error);
    }
  }

  const all = groupFromList([...memoryDrawsMega, ...memoryDrawsPower]);
  const totalRecords = all.length;
  const totalPages = limit === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / (limit as number)));
  const draws = limit === 'all' ? all : all.slice((page - 1) * (limit as number), page * (limit as number));
  return { draws, pagination: { total: totalRecords, page, limit, totalPages } };
}
