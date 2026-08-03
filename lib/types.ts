export type LotteryType = 'mega645' | 'power655';

/**
 * Số kỳ quay gần nhất được phân tích trên Dashboard (?range= trên URL).
 * Kept as a numeric enum (not a raw `number`) so every call site is self-documenting
 * and there is a single source of truth for the allowed values.
 */
export enum TimeRange {
  Last10 = 10,
  Last30 = 30,
  Last50 = 50,
}

/** Danh sách TimeRange hợp lệ, dùng để validate query param và render các nút chọn. */
export const TIME_RANGE_OPTIONS: TimeRange[] = [
  TimeRange.Last10,
  TimeRange.Last30,
  TimeRange.Last50,
];

export const DEFAULT_TIME_RANGE = TimeRange.Last30;

/** Bộ lọc xổ số cho danh sách nhật ký gợi ý (?filter= trên URL của trang Suggestions). */
export enum SuggestionFilter {
  All = 'all',
  Mega645 = 'mega645',
  Power655 = 'power655',
}

export const DEFAULT_SUGGESTION_FILTER = SuggestionFilter.All;

/**
 * Số kỳ liên tiếp vắng mặt tối thiểu để một con số được coi là "gan cực đại".
 * Không enum hoá `LotteryType` — TypeScript string-literal union đã đóng vai trò
 * tương đương một enum (type-safe, exhaustive) và được dùng làm giá trị lưu trực tiếp
 * trong MongoDB/API; chuyển sang `enum` sẽ đụng ~90 nơi so sánh chuỗi hiện có mà
 * không mang lại lợi ích type-safety nào thêm.
 */
export const GAN_THRESHOLD = 8;

export interface DrawRecord {
  id: string; // e.g., "#01124"
  lotteryType: LotteryType;
  drawDate: string; // YYYY-MM-DD
  numbers: number[]; // 6 numbers for Mega, 6 numbers for Power
  bonusNumber?: number; // 7th special bonus ball for Power 6/55
  jackpotValue: number; // in VND (e.g. 45000000000)
  hasWinner: boolean;
  createdAt: string;
}

export interface NumberStat {
  number: number;
  count: number;
  frequencyPercent: number;
  drought: number; // Number of draws since last appearance ("số kỳ gan")
  expectedCount: number;
  diffFromExpected: number;
  status: 'hot' | 'warm' | 'cold' | 'gan_cuc_dai';
}

export interface EvenOddStat {
  evenCount: number;
  oddCount: number;
  label: string; // e.g., "3 Chẵn - 3 Lẻ"
  percentage: number;
}

export interface HighLowStat {
  highCount: number;
  lowCount: number;
  label: string; // e.g., "4 Cao - 2 Thấp"
  percentage: number;
}

export interface TrendDataPoint {
  drawId: string;
  date: string;
  evenCount: number;
  oddCount: number;
  sumNumbers: number;
  maxNumber: number;
  minNumber: number;
}

export interface LotteryStats {
  lotteryType: LotteryType;
  totalDrawsAnalyzed: number;
  numberStats: NumberStat[];
  evenOdd: EvenOddStat[];
  highLow: HighLowStat[];
  trend: TrendDataPoint[];
  hotNumbers: NumberStat[];
  coldNumbers: NumberStat[];
  overdueNumbers: NumberStat[];
  latestDraw: DrawRecord | null;
}

export interface SuggestionItem {
  number: number;
  statSummary: string; // e.g., "Xuất hiện 8/30 kỳ (26.7%), gan 2 kỳ"
  aiReasoning: string; // Natural language explanation referencing actual data
}

export interface SuggestionRecord {
  id: string;
  lotteryType: LotteryType;
  createdAt: string;
  targetDrawId?: string; // Subsequent draw ID to compare against
  suggestedNumbers: SuggestionItem[];
  overallAnalysis: string;
  disclaimer: string;
  userId?: string; // Optional user ID if logged in
  matchedNumbers?: number[];
  matchCount?: number;
  status: 'pending_draw' | 'evaluated';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  dataCard?: {
    title: string;
    type: 'hot_cold' | 'even_odd' | 'recent_draws' | 'probability_note';
    payload: any;
  };
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  favoriteNumbers: {
    mega645: number[][];
    power655: number[][];
  };
  savedSuggestionsCount: number;
}
