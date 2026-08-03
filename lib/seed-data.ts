import { DrawRecord, LotteryType, NumberStat, EvenOddStat, HighLowStat, TrendDataPoint, SuggestionRecord, GAN_THRESHOLD } from './types';

// ==========================================
// SEED HISTORICAL DRAWS: MEGA 6/45 (45 balls)
// ==========================================
export const SEED_DRAWS_MEGA645: DrawRecord[] = [
  {
    id: '#01314',
    lotteryType: 'mega645',
    drawDate: '2025-08-01',
    numbers: [3, 11, 18, 24, 33, 42],
    jackpotValue: 28450000000,
    hasWinner: false,
    createdAt: '2025-08-01T11:30:00Z',
  },
  {
    id: '#01313',
    lotteryType: 'mega645',
    drawDate: '2025-07-30',
    numbers: [7, 14, 19, 28, 31, 44],
    jackpotValue: 25120000000,
    hasWinner: false,
    createdAt: '2025-07-30T11:30:00Z',
  },
  {
    id: '#01312',
    lotteryType: 'mega645',
    drawDate: '2025-07-27',
    numbers: [2, 11, 23, 27, 36, 41],
    jackpotValue: 22800000000,
    hasWinner: false,
    createdAt: '2025-07-27T11:30:00Z',
  },
  {
    id: '#01311',
    lotteryType: 'mega645',
    drawDate: '2025-07-25',
    numbers: [5, 14, 22, 28, 33, 39],
    jackpotValue: 20400000000,
    hasWinner: false,
    createdAt: '2025-07-25T11:30:00Z',
  },
  {
    id: '#01310',
    lotteryType: 'mega645',
    drawDate: '2025-07-23',
    numbers: [11, 17, 24, 29, 38, 44],
    jackpotValue: 18150000000,
    hasWinner: false,
    createdAt: '2025-07-23T11:30:00Z',
  },
  {
    id: '#01309',
    lotteryType: 'mega645',
    drawDate: '2025-07-20',
    numbers: [4, 12, 18, 25, 31, 40],
    jackpotValue: 46200000000,
    hasWinner: true,
    createdAt: '2025-07-20T11:30:00Z',
  },
  {
    id: '#01308',
    lotteryType: 'mega645',
    drawDate: '2025-07-18',
    numbers: [3, 14, 21, 28, 35, 42],
    jackpotValue: 43100000000,
    hasWinner: false,
    createdAt: '2025-07-18T11:30:00Z',
  },
  {
    id: '#01307',
    lotteryType: 'mega645',
    drawDate: '2025-07-16',
    numbers: [8, 15, 23, 29, 34, 44],
    jackpotValue: 39800000000,
    hasWinner: false,
    createdAt: '2025-07-16T11:30:00Z',
  },
  {
    id: '#01306',
    lotteryType: 'mega645',
    drawDate: '2025-07-13',
    numbers: [1, 11, 19, 27, 33, 41],
    jackpotValue: 36500000000,
    hasWinner: false,
    createdAt: '2025-07-13T11:30:00Z',
  },
  {
    id: '#01305',
    lotteryType: 'mega645',
    drawDate: '2025-07-11',
    numbers: [6, 13, 22, 28, 36, 43],
    jackpotValue: 33200000000,
    hasWinner: false,
    createdAt: '2025-07-11T11:30:00Z',
  },
  {
    id: '#01304',
    lotteryType: 'mega645',
    drawDate: '2025-07-09',
    numbers: [9, 14, 20, 24, 31, 38],
    jackpotValue: 29900000000,
    hasWinner: false,
    createdAt: '2025-07-09T11:30:00Z',
  },
  {
    id: '#01303',
    lotteryType: 'mega645',
    drawDate: '2025-07-06',
    numbers: [2, 11, 17, 26, 33, 44],
    jackpotValue: 26800000000,
    hasWinner: false,
    createdAt: '2025-07-06T11:30:00Z',
  },
  {
    id: '#01302',
    lotteryType: 'mega645',
    drawDate: '2025-07-04',
    numbers: [5, 12, 18, 28, 34, 42],
    jackpotValue: 23500000000,
    hasWinner: false,
    createdAt: '2025-07-04T11:30:00Z',
  },
  {
    id: '#01301',
    lotteryType: 'mega645',
    drawDate: '2025-07-02',
    numbers: [10, 16, 23, 29, 37, 45],
    jackpotValue: 20200000000,
    hasWinner: false,
    createdAt: '2025-07-02T11:30:00Z',
  },
  {
    id: '#01300',
    lotteryType: 'mega645',
    drawDate: '2025-06-29',
    numbers: [3, 14, 21, 27, 33, 40],
    jackpotValue: 18100000000,
    hasWinner: false,
    createdAt: '2025-06-29T11:30:00Z',
  },
  {
    id: '#01299',
    lotteryType: 'mega645',
    drawDate: '2025-06-27',
    numbers: [7, 11, 19, 24, 32, 44],
    jackpotValue: 52400000000,
    hasWinner: true,
    createdAt: '2025-06-27T11:30:00Z',
  },
  {
    id: '#01298',
    lotteryType: 'mega645',
    drawDate: '2025-06-25',
    numbers: [4, 15, 22, 28, 36, 41],
    jackpotValue: 48900000000,
    hasWinner: false,
    createdAt: '2025-06-25T11:30:00Z',
  },
  {
    id: '#01297',
    lotteryType: 'mega645',
    drawDate: '2025-06-22',
    numbers: [8, 13, 20, 26, 33, 39],
    jackpotValue: 45600000000,
    hasWinner: false,
    createdAt: '2025-06-22T11:30:00Z',
  },
  {
    id: '#01296',
    lotteryType: 'mega645',
    drawDate: '2025-06-20',
    numbers: [2, 11, 18, 25, 31, 43],
    jackpotValue: 42300000000,
    hasWinner: false,
    createdAt: '2025-06-20T11:30:00Z',
  },
  {
    id: '#01295',
    lotteryType: 'mega645',
    drawDate: '2025-06-18',
    numbers: [6, 14, 23, 29, 35, 44],
    jackpotValue: 39100000000,
    hasWinner: false,
    createdAt: '2025-06-18T11:30:00Z',
  },
  {
    id: '#01294',
    lotteryType: 'mega645',
    drawDate: '2025-06-15',
    numbers: [1, 12, 19, 28, 34, 42],
    jackpotValue: 35800000000,
    hasWinner: false,
    createdAt: '2025-06-15T11:30:00Z',
  },
  {
    id: '#01293',
    lotteryType: 'mega645',
    drawDate: '2025-06-13',
    numbers: [9, 17, 24, 30, 37, 45],
    jackpotValue: 32500000000,
    hasWinner: false,
    createdAt: '2025-06-13T11:30:00Z',
  },
  {
    id: '#01292',
    lotteryType: 'mega645',
    drawDate: '2025-06-11',
    numbers: [5, 11, 21, 27, 33, 40],
    jackpotValue: 29200000000,
    hasWinner: false,
    createdAt: '2025-06-11T11:30:00Z',
  },
  {
    id: '#01291',
    lotteryType: 'mega645',
    drawDate: '2025-06-08',
    numbers: [3, 14, 22, 28, 36, 44],
    jackpotValue: 26000000000,
    hasWinner: false,
    createdAt: '2025-06-08T11:30:00Z',
  },
  {
    id: '#01290',
    lotteryType: 'mega645',
    drawDate: '2025-06-06',
    numbers: [7, 16, 23, 29, 35, 41],
    jackpotValue: 22800000000,
    hasWinner: false,
    createdAt: '2025-06-06T11:30:00Z',
  },
  {
    id: '#01289',
    lotteryType: 'mega645',
    drawDate: '2025-06-04',
    numbers: [2, 10, 18, 25, 33, 42],
    jackpotValue: 19600000000,
    hasWinner: false,
    createdAt: '2025-06-04T11:30:00Z',
  },
  {
    id: '#01288',
    lotteryType: 'mega645',
    drawDate: '2025-06-01',
    numbers: [11, 19, 24, 31, 38, 44],
    jackpotValue: 18100000000,
    hasWinner: false,
    createdAt: '2025-06-01T11:30:00Z',
  },
  {
    id: '#01287',
    lotteryType: 'mega645',
    drawDate: '2025-05-30',
    numbers: [4, 13, 21, 28, 34, 43],
    jackpotValue: 61200000000,
    hasWinner: true,
    createdAt: '2025-05-30T11:30:00Z',
  },
  {
    id: '#01286',
    lotteryType: 'mega645',
    drawDate: '2025-05-28',
    numbers: [8, 15, 23, 29, 36, 45],
    jackpotValue: 57800000000,
    hasWinner: false,
    createdAt: '2025-05-28T11:30:00Z',
  },
  {
    id: '#01285',
    lotteryType: 'mega645',
    drawDate: '2025-05-25',
    numbers: [1, 11, 18, 27, 33, 41],
    jackpotValue: 54400000000,
    hasWinner: false,
    createdAt: '2025-05-25T11:30:00Z',
  },
];

// ==========================================
// SEED HISTORICAL DRAWS: POWER 6/55 (55 balls + bonus)
// ==========================================
export const SEED_DRAWS_POWER655: DrawRecord[] = [
  {
    id: '#01211',
    lotteryType: 'power655',
    drawDate: '2025-08-02',
    numbers: [5, 12, 21, 33, 44, 52],
    bonusNumber: 17,
    jackpotValue: 68500000000,
    hasWinner: false,
    createdAt: '2025-08-02T11:30:00Z',
  },
  {
    id: '#01210',
    lotteryType: 'power655',
    drawDate: '2025-07-31',
    numbers: [9, 16, 24, 35, 48, 55],
    bonusNumber: 31,
    jackpotValue: 64200000000,
    hasWinner: false,
    createdAt: '2025-07-31T11:30:00Z',
  },
  {
    id: '#01209',
    lotteryType: 'power655',
    drawDate: '2025-07-29',
    numbers: [3, 14, 22, 29, 41, 53],
    bonusNumber: 8,
    jackpotValue: 59900000000,
    hasWinner: false,
    createdAt: '2025-07-29T11:30:00Z',
  },
  {
    id: '#01208',
    lotteryType: 'power655',
    drawDate: '2025-07-26',
    numbers: [7, 19, 28, 36, 45, 51],
    bonusNumber: 12,
    jackpotValue: 55600000000,
    hasWinner: false,
    createdAt: '2025-07-26T11:30:00Z',
  },
  {
    id: '#01207',
    lotteryType: 'power655',
    drawDate: '2025-07-24',
    numbers: [2, 11, 23, 33, 42, 54],
    bonusNumber: 26,
    jackpotValue: 51300000000,
    hasWinner: false,
    createdAt: '2025-07-24T11:30:00Z',
  },
  {
    id: '#01206',
    lotteryType: 'power655',
    drawDate: '2025-07-22',
    numbers: [8, 15, 25, 34, 47, 50],
    bonusNumber: 4,
    jackpotValue: 47100000000,
    hasWinner: false,
    createdAt: '2025-07-22T11:30:00Z',
  },
  {
    id: '#01205',
    lotteryType: 'power655',
    drawDate: '2025-07-19',
    numbers: [1, 12, 21, 31, 43, 52],
    bonusNumber: 19,
    jackpotValue: 42800000000,
    hasWinner: false,
    createdAt: '2025-07-19T11:30:00Z',
  },
  {
    id: '#01204',
    lotteryType: 'power655',
    drawDate: '2025-07-17',
    numbers: [6, 17, 27, 38, 46, 55],
    bonusNumber: 13,
    jackpotValue: 38500000000,
    hasWinner: false,
    createdAt: '2025-07-17T11:30:00Z',
  },
  {
    id: '#01203',
    lotteryType: 'power655',
    drawDate: '2025-07-15',
    numbers: [4, 14, 23, 33, 44, 49],
    bonusNumber: 30,
    jackpotValue: 34200000000,
    hasWinner: false,
    createdAt: '2025-07-15T11:30:00Z',
  },
  {
    id: '#01202',
    lotteryType: 'power655',
    drawDate: '2025-07-12',
    numbers: [10, 18, 26, 35, 41, 53],
    bonusNumber: 22,
    jackpotValue: 30000000000,
    hasWinner: false,
    createdAt: '2025-07-12T11:30:00Z',
  },
  {
    id: '#01201',
    lotteryType: 'power655',
    drawDate: '2025-07-10',
    numbers: [5, 13, 22, 32, 45, 54],
    bonusNumber: 16,
    jackpotValue: 98400000000,
    hasWinner: true,
    createdAt: '2025-07-10T11:30:00Z',
  },
  {
    id: '#01200',
    lotteryType: 'power655',
    drawDate: '2025-07-08',
    numbers: [3, 11, 20, 29, 39, 51],
    bonusNumber: 42,
    jackpotValue: 93800000000,
    hasWinner: false,
    createdAt: '2025-07-08T11:30:00Z',
  },
  {
    id: '#01199',
    lotteryType: 'power655',
    drawDate: '2025-07-05',
    numbers: [8, 16, 25, 33, 47, 52],
    bonusNumber: 11,
    jackpotValue: 89300000000,
    hasWinner: false,
    createdAt: '2025-07-05T11:30:00Z',
  },
  {
    id: '#01198',
    lotteryType: 'power655',
    drawDate: '2025-07-03',
    numbers: [2, 14, 24, 36, 44, 55],
    bonusNumber: 28,
    jackpotValue: 84900000000,
    hasWinner: false,
    createdAt: '2025-07-03T11:30:00Z',
  },
  {
    id: '#01197',
    lotteryType: 'power655',
    drawDate: '2025-07-01',
    numbers: [7, 15, 23, 34, 43, 50],
    bonusNumber: 9,
    jackpotValue: 80500000000,
    hasWinner: false,
    createdAt: '2025-07-01T11:30:00Z',
  },
  {
    id: '#01196',
    lotteryType: 'power655',
    drawDate: '2025-06-28',
    numbers: [1, 12, 21, 31, 42, 48],
    bonusNumber: 35,
    jackpotValue: 76100000000,
    hasWinner: false,
    createdAt: '2025-06-28T11:30:00Z',
  },
  {
    id: '#01195',
    lotteryType: 'power655',
    drawDate: '2025-06-26',
    numbers: [6, 17, 27, 37, 46, 53],
    bonusNumber: 14,
    jackpotValue: 71800000000,
    hasWinner: false,
    createdAt: '2025-06-26T11:30:00Z',
  },
  {
    id: '#01194',
    lotteryType: 'power655',
    drawDate: '2025-06-24',
    numbers: [4, 13, 22, 33, 44, 54],
    bonusNumber: 20,
    jackpotValue: 67400000000,
    hasWinner: false,
    createdAt: '2025-06-24T11:30:00Z',
  },
  {
    id: '#01193',
    lotteryType: 'power655',
    drawDate: '2025-06-21',
    numbers: [9, 18, 26, 35, 45, 51],
    bonusNumber: 5,
    jackpotValue: 63100000000,
    hasWinner: false,
    createdAt: '2025-06-21T11:30:00Z',
  },
  {
    id: '#01192',
    lotteryType: 'power655',
    drawDate: '2025-06-19',
    numbers: [3, 11, 23, 32, 41, 52],
    bonusNumber: 49,
    jackpotValue: 58800000000,
    hasWinner: false,
    createdAt: '2025-06-19T11:30:00Z',
  },
];

// ==========================================
// SEED SUGGESTION LOGS (REALISTIC MATCH RATES!)
// Reflecting true probability: most suggestions match 0-2 numbers,
// occasionally 3 numbers, and matching 4+ is extremely rare.
// ==========================================
export const SEED_SUGGESTION_LOGS: SuggestionRecord[] = [
  {
    id: 'sug-010',
    lotteryType: 'mega645',
    createdAt: '2025-07-30T10:00:00Z',
    targetDrawId: '#01313', // Winning: 7, 14, 19, 28, 31, 44
    suggestedNumbers: [
      { number: 7, statSummary: 'Tần suất ấm (23.3%), gan 4 kỳ', aiReasoning: 'Số 7 vừa kết thúc chuỗi gan 4 kỳ, tần suất tích lũy đạt 23.3% trong 30 kỳ gần nhất.' },
      { number: 11, statSummary: 'Số nóng nhất (36.7%), gan 0 kỳ', aiReasoning: 'Số 11 là số nóng với 11 lần xuất hiện trong 30 kỳ qua.' },
      { number: 19, statSummary: 'Tần suất trung bình (20.0%), gan 3 kỳ', aiReasoning: 'Số 19 có tần suất ổn định quanh mức kỳ vọng lý thuyết.' },
      { number: 25, statSummary: 'Số gan vừa (13.3%), gan 6 kỳ', aiReasoning: 'Số 25 đã 6 kỳ chưa xuất hiện, thuộc nhóm tần suất dưới trung bình.' },
      { number: 33, statSummary: 'Số nóng (30.0%), gan 1 kỳ', aiReasoning: 'Số 33 duy trì sự ổn định với 9/30 kỳ gần nhất có mặt.' },
      { number: 40, statSummary: 'Số gan (16.7%), gan 8 kỳ', aiReasoning: 'Số 40 có độ gan 8 kỳ, không có dấu hiệu tăng tần suất gần đây.' },
    ],
    overallAnalysis: 'Bộ số kết hợp giữa 2 số nóng (11, 33), 2 số ấm (7, 19) và 2 số gan (25, 40). Tuy nhiên, trong xổ số độc lập, mỗi bộ 6 số bất kỳ đều có xác suất trúng như nhau là 1 trên 8.14 triệu.',
    disclaimer: 'LotoVN AI nhắc bạn: Các số liệu thống kê chỉ phản ánh quá khứ. Mọi kỳ quay đều độc lập 100%.',
    matchedNumbers: [7, 19], // Matched 2 numbers
    matchCount: 2,
    status: 'evaluated',
  },
  {
    id: 'sug-009',
    lotteryType: 'mega645',
    createdAt: '2025-07-27T10:00:00Z',
    targetDrawId: '#01312', // Winning: 2, 11, 23, 27, 36, 41
    suggestedNumbers: [
      { number: 3, statSummary: 'Số ấm (26.7%), gan 2 kỳ', aiReasoning: 'Số 3 có tần suất 26.7%, cao hơn mức trung bình 13.3% của toàn bộ 45 bóng.' },
      { number: 14, statSummary: 'Số nóng (33.3%), gan 0 kỳ', aiReasoning: 'Số 14 xuất hiện liên tục trong 2 kỳ gần đây, đạt tần suất 33.3%.' },
      { number: 23, statSummary: 'Số ấm (23.3%), gan 4 kỳ', aiReasoning: 'Số 23 duy trì nhịp xuất hiện cách quãng 3-4 kỳ trong tháng qua.' },
      { number: 29, statSummary: 'Số trung bình (20.0%), gan 1 kỳ', aiReasoning: 'Số 29 xuất hiện đúng mức kỳ vọng lý thuyết 20.0%.' },
      { number: 38, statSummary: 'Số lạnh (10.0%), gan 10 kỳ', aiReasoning: 'Số 38 ít xuất hiện trong 30 kỳ qua, độ gan hiện là 10 kỳ.' },
      { number: 44, statSummary: 'Số nóng (30.0%), gan 0 kỳ', aiReasoning: 'Số 44 là bóng xuất hiện thường xuyên ở dải cao.' },
    ],
    overallAnalysis: 'Kiểm chứng thực tế: Bộ gợi ý này chỉ trùng 1 số (23) với kết quả thực tế #01312. Đây là minh chứng rõ nhất cho việc số nóng hay số gan đều không có lợi thế xác suất.',
    disclaimer: 'Xác suất trúng 1 số hoặc 0 số chiếm tới hơn 82% tổng số trường hợp quay thưởng ngẫu nhiên.',
    matchedNumbers: [23], // Matched 1 number
    matchCount: 1,
    status: 'evaluated',
  },
  {
    id: 'sug-008',
    lotteryType: 'mega645',
    createdAt: '2025-07-25T10:00:00Z',
    targetDrawId: '#01311', // Winning: 5, 14, 22, 28, 33, 39
    suggestedNumbers: [
      { number: 5, statSummary: 'Số trung bình (16.7%), gan 7 kỳ', aiReasoning: 'Số 5 có tần suất dưới mức trung bình, vừa xuất hiện trở lại sau 7 kỳ vắng bóng.' },
      { number: 12, statSummary: 'Số lạnh (13.3%), gan 3 kỳ', aiReasoning: 'Số 12 có tần suất xuất hiện khá thấp trong tháng qua.' },
      { number: 18, statSummary: 'Số ấm (26.7%), gan 2 kỳ', aiReasoning: 'Số 18 thuộc dải giữa, tần suất ổn định 8/30 kỳ.' },
      { number: 28, statSummary: 'Số nóng (33.3%), gan 0 kỳ', aiReasoning: 'Số 28 là một trong những số xuất hiện nhiều nhất ở cụm 20-30.' },
      { number: 35, statSummary: 'Số trung bình (20.0%), gan 3 kỳ', aiReasoning: 'Số 35 có tần suất 6/30 kỳ, đúng bằng kỳ vọng toán học.' },
      { number: 42, statSummary: 'Số nóng (30.0%), gan 1 kỳ', aiReasoning: 'Số 42 thuộc nhóm số cao có mật độ xuất hiện trên 30%.' },
    ],
    overallAnalysis: 'Kết quả đối chiếu kỳ #01311 cho thấy khớp 2 số (5, 28). Khớp 2/6 số là kết quả phổ biến nhất trong thống kê phân phối siêu bội của xổ số 6/45.',
    disclaimer: 'Thống kê tần suất giúp bạn hiểu sự phân bố trong quá khứ, không phải công cụ dự báo tương lai.',
    matchedNumbers: [5, 28], // Matched 2 numbers
    matchCount: 2,
    status: 'evaluated',
  },
  {
    id: 'sug-007',
    lotteryType: 'mega645',
    createdAt: '2025-07-23T10:00:00Z',
    targetDrawId: '#01310', // Winning: 11, 17, 24, 29, 38, 44
    suggestedNumbers: [
      { number: 1, statSummary: 'Số gan (10.0%), gan 12 kỳ', aiReasoning: 'Số 1 đang thuộc danh sách số gan với 12 kỳ liên tiếp chưa về.' },
      { number: 8, statSummary: 'Số lạnh (13.3%), gan 5 kỳ', aiReasoning: 'Số 8 ít xuất hiện ở nửa đầu tháng.' },
      { number: 16, statSummary: 'Số lạnh (13.3%), gan 11 kỳ', aiReasoning: 'Số 16 có mật độ xuất hiện thấp hơn 35% so với mức trung bình.' },
      { number: 27, statSummary: 'Số ấm (23.3%), gan 4 kỳ', aiReasoning: 'Số 27 thường xuất hiện kèm các bóng dải 20-30.' },
      { number: 33, statSummary: 'Số nóng (30.0%), gan 2 kỳ', aiReasoning: 'Số 33 có mặt trong 9 trên 30 kỳ quay gần đây.' },
      { number: 41, statSummary: 'Số ấm (23.3%), gan 3 kỳ', aiReasoning: 'Số 41 là bóng có tần suất ổn định ở dải trên 40.' },
    ],
    overallAnalysis: 'Đối chiếu với kỳ quay #01310: KHÔNG KHỚP SỐ NÀO (0/6). Đây là minh họa thực tế cho tính độc lập thống kê: việc chọn số "gan" hay "nóng" không làm thay đổi xác suất 0/6 lên tới 42.4%!',
    disclaimer: 'Xác suất không trùng bất kỳ số nào trong 6 số bạn chọn là khoảng 42.4%, đây là hiện tượng hoàn toàn bình thường.',
    matchedNumbers: [], // Matched 0 numbers! Honest probability!
    matchCount: 0,
    status: 'evaluated',
  },
  {
    id: 'sug-006',
    lotteryType: 'mega645',
    createdAt: '2025-07-20T10:00:00Z',
    targetDrawId: '#01309', // Winning: 4, 12, 18, 25, 31, 40
    suggestedNumbers: [
      { number: 4, statSummary: 'Số trung bình (16.7%), gan 8 kỳ', aiReasoning: 'Số 4 vừa về sau chuỗi gan 8 kỳ, khớp với phân phối chuẩn.' },
      { number: 11, statSummary: 'Số nóng (36.7%), gan 0 kỳ', aiReasoning: 'Số 11 xuất hiện dày đặc nhưng kỳ này không lặp lại.' },
      { number: 18, statSummary: 'Số ấm (26.7%), gan 3 kỳ', aiReasoning: 'Số 18 có tần suất cao ở dải 10-20.' },
      { number: 24, statSummary: 'Số ấm (23.3%), gan 1 kỳ', aiReasoning: 'Số 24 xuất hiện đều đặn trong 30 kỳ qua.' },
      { number: 31, statSummary: 'Số ấm (26.7%), gan 4 kỳ', aiReasoning: 'Số 31 là bóng số lẻ có số lần xuất hiện trên trung bình.' },
      { number: 45, statSummary: 'Số trung bình (20.0%), gan 6 kỳ', aiReasoning: 'Số 45 có tần suất đúng mức kỳ vọng 20%.' },
    ],
    overallAnalysis: 'Kỳ #01309 ghi nhận bộ gợi ý khớp 3 số (4, 18, 31). Trong thực tế, xác suất để 1 bộ 6 số khớp đúng 3 số là khoảng 1 trên 57 (tương đương 1.76%).',
    disclaimer: 'Khớp 3 số là một kết quả ít gặp (1.76%), không phản ánh "quy luật" nào của máy quay thưởng.',
    matchedNumbers: [4, 18, 31], // Matched 3 numbers (rare occasion)
    matchCount: 3,
    status: 'evaluated',
  },
  {
    id: 'sug-005',
    lotteryType: 'power655',
    createdAt: '2025-07-31T10:00:00Z',
    targetDrawId: '#01210', // Winning: 9, 16, 24, 35, 48, 55 (Bonus 31)
    suggestedNumbers: [
      { number: 9, statSummary: 'Số ấm (20.0%), gan 4 kỳ', aiReasoning: 'Số 9 có tần suất trung bình trong 30 kỳ gần đây.' },
      { number: 14, statSummary: 'Số nóng (26.7%), gan 1 kỳ', aiReasoning: 'Số 14 thuộc dải thấp có mật độ xuất hiện khá đều.' },
      { number: 21, statSummary: 'Số ấm (23.3%), gan 2 kỳ', aiReasoning: 'Số 21 thường về trong các kỳ quay giữa tuần.' },
      { number: 33, statSummary: 'Số nóng (30.0%), gan 0 kỳ', aiReasoning: 'Số 33 xuất hiện nhiều nhất ở dải giữa 30-40.' },
      { number: 48, statSummary: 'Số trung bình (16.7%), gan 6 kỳ', aiReasoning: 'Số 48 thuộc nhóm số cao, có tần suất ổn định.' },
      { number: 52, statSummary: 'Số nóng (26.7%), gan 1 kỳ', aiReasoning: 'Số 52 là bóng có tần suất cao ở cụm trên 50.' },
    ],
    overallAnalysis: 'Đối chiếu với kết quả Power 6/55 kỳ #01210: Khớp 2/6 số (9, 48). Trong Power 6/55 với 55 bóng, xác suất khớp 2 số là khoảng 13.5%.',
    disclaimer: 'Power 6/55 có không gian mẫu 28.98 triệu tổ hợp — mỗi kỳ quay đều độc lập và không thể dự đoán.',
    matchedNumbers: [9, 48], // Matched 2 numbers
    matchCount: 2,
    status: 'evaluated',
  },
  {
    id: 'sug-004',
    lotteryType: 'power655',
    createdAt: '2025-07-29T10:00:00Z',
    targetDrawId: '#01209', // Winning: 3, 14, 22, 29, 41, 53
    suggestedNumbers: [
      { number: 7, statSummary: 'Số ấm (20.0%), gan 2 kỳ', aiReasoning: 'Số 7 có tần suất trung bình.' },
      { number: 19, statSummary: 'Số ấm (23.3%), gan 1 kỳ', aiReasoning: 'Số 19 có tần suất 7/30 kỳ gần nhất.' },
      { number: 29, statSummary: 'Số trung bình (16.7%), gan 5 kỳ', aiReasoning: 'Số 29 vừa xuất hiện tại kỳ #01209.' },
      { number: 36, statSummary: 'Số nóng (26.7%), gan 1 kỳ', aiReasoning: 'Số 36 có tần suất trên mức trung bình.' },
      { number: 45, statSummary: 'Số ấm (20.0%), gan 3 kỳ', aiReasoning: 'Số 45 thuộc nhóm số cao.' },
      { number: 51, statSummary: 'Số trung bình (16.7%), gan 4 kỳ', aiReasoning: 'Số 51 có tần suất ở mức trung bình.' },
    ],
    overallAnalysis: 'Khớp 1 số (29) trong kỳ #01209. Đây là trường hợp phổ biến nhất của các bộ 6 số ngẫu nhiên khi đối chiếu với 55 bóng.',
    disclaimer: 'Không có công thức toán học hay trí tuệ nhân tạo nào vượt qua được tính ngẫu nhiên của lồng cầu.',
    matchedNumbers: [29], // Matched 1 number
    matchCount: 1,
    status: 'evaluated',
  },
  {
    id: 'sug-003',
    lotteryType: 'power655',
    createdAt: '2025-07-26T10:00:00Z',
    targetDrawId: '#01208', // Winning: 7, 19, 28, 36, 45, 51
    suggestedNumbers: [
      { number: 2, statSummary: 'Số trung bình (16.7%), gan 3 kỳ', aiReasoning: 'Số 2 có tần suất bình thường.' },
      { number: 11, statSummary: 'Số ấm (23.3%), gan 2 kỳ', aiReasoning: 'Số 11 xuất hiện 7 lần trong 30 kỳ qua.' },
      { number: 23, statSummary: 'Số trung bình (16.7%), gan 4 kỳ', aiReasoning: 'Số 23 không xuất hiện ở kỳ quay này.' },
      { number: 34, statSummary: 'Số lạnh (10.0%), gan 9 kỳ', aiReasoning: 'Số 34 là số gan lâu chưa về.' },
      { number: 42, statSummary: 'Số trung bình (16.7%), gan 3 kỳ', aiReasoning: 'Số 42 có tần suất ổn định.' },
      { number: 54, statSummary: 'Số nóng (26.7%), gan 1 kỳ', aiReasoning: 'Số 54 là một trong các số nóng ở cụm cuối.' },
    ],
    overallAnalysis: 'Đối chiếu với kỳ quay #01208: 0/6 số khớp. Việc 1 bộ số không trúng bất kỳ số nào diễn ra với tần suất rất cao trong thực tế.',
    disclaimer: 'Minh bạch dữ liệu giúp bạn nhìn nhận xổ số như một hình thức giải trí có xác suất rất thấp, không phải đầu tư.',
    matchedNumbers: [], // Matched 0 numbers
    matchCount: 0,
    status: 'evaluated',
  },
];

// ==========================================
// HELPER FUNCTIONS TO CALCULATE REAL STATISTICS
// ==========================================

export function getDrawsByType(draws: DrawRecord[], type: LotteryType): DrawRecord[] {
  return draws
    .filter((d) => d.lotteryType === type)
    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
}

export function calculateNumberStats(draws: DrawRecord[], lotteryType: LotteryType): NumberStat[] {
  const totalBalls = lotteryType === 'mega645' ? 45 : 55;
  const totalDraws = draws.length || 1;
  const counts = new Array(totalBalls + 1).fill(0);
  const lastSeenIndex = new Array(totalBalls + 1).fill(-1);

  // Traverse oldest to newest to compute drought properly
  const sortedAsc = [...draws].sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());

  sortedAsc.forEach((draw, idx) => {
    draw.numbers.forEach((num) => {
      if (num >= 1 && num <= totalBalls) {
        counts[num]++;
        lastSeenIndex[num] = idx;
      }
    });
  });

  const expectedCount = (6 * totalDraws) / totalBalls;

  const stats: NumberStat[] = [];
  for (let num = 1; num <= totalBalls; num++) {
    const count = counts[num];
    const frequencyPercent = Number(((count / totalDraws) * 100).toFixed(1));
    const drought = lastSeenIndex[num] === -1 ? totalDraws : totalDraws - 1 - lastSeenIndex[num];
    const diffFromExpected = Number((count - expectedCount).toFixed(1));

    let status: NumberStat['status'] = 'warm';
    if (drought >= GAN_THRESHOLD) {
      status = 'gan_cuc_dai';
    } else if (count >= expectedCount * 1.25) {
      status = 'hot';
    } else if (count <= expectedCount * 0.75) {
      status = 'cold';
    }

    stats.push({
      number: num,
      count,
      frequencyPercent,
      drought,
      expectedCount: Number(expectedCount.toFixed(1)),
      diffFromExpected,
      status,
    });
  }

  return stats;
}

export function calculateEvenOdd(draws: DrawRecord[]): EvenOddStat[] {
  const labelCounts: Record<string, number> = {
    '6 Chẵn - 0 Lẻ': 0,
    '5 Chẵn - 1 Lẻ': 0,
    '4 Chẵn - 2 Lẻ': 0,
    '3 Chẵn - 3 Lẻ': 0,
    '2 Chẵn - 4 Lẻ': 0,
    '1 Chẵn - 5 Lẻ': 0,
    '0 Chẵn - 6 Lẻ': 0,
  };

  const total = draws.length || 1;

  draws.forEach((d) => {
    let even = 0;
    d.numbers.forEach((n) => {
      if (n % 2 === 0) even++;
    });
    const odd = 6 - even;
    const key = `${even} Chẵn - ${odd} Lẻ`;
    if (labelCounts[key] !== undefined) {
      labelCounts[key]++;
    }
  });

  return Object.entries(labelCounts).map(([label, count]) => {
    const parts = label.split(' - ');
    const evenCount = parseInt(parts[0]);
    const oddCount = parseInt(parts[1]);
    return {
      label,
      evenCount,
      oddCount,
      percentage: Number(((count / total) * 100).toFixed(1)),
    };
  });
}

export function calculateHighLow(draws: DrawRecord[], lotteryType: LotteryType): HighLowStat[] {
  const threshold = lotteryType === 'mega645' ? 22 : 27; // low is <= threshold, high is > threshold
  const labelCounts: Record<string, number> = {
    '6 Cao - 0 Thấp': 0,
    '5 Cao - 1 Thấp': 0,
    '4 Cao - 2 Thấp': 0,
    '3 Cao - 3 Thấp': 0,
    '2 Cao - 4 Thấp': 0,
    '1 Cao - 5 Thấp': 0,
    '0 Cao - 6 Thấp': 0,
  };

  const total = draws.length || 1;

  draws.forEach((d) => {
    let high = 0;
    d.numbers.forEach((n) => {
      if (n > threshold) high++;
    });
    const low = 6 - high;
    const key = `${high} Cao - ${low} Thấp`;
    if (labelCounts[key] !== undefined) {
      labelCounts[key]++;
    }
  });

  return Object.entries(labelCounts).map(([label, count]) => {
    const parts = label.split(' - ');
    const highCount = parseInt(parts[0]);
    const lowCount = parseInt(parts[1]);
    return {
      label,
      highCount,
      lowCount,
      percentage: Number(((count / total) * 100).toFixed(1)),
    };
  });
}

export function calculateTrendData(draws: DrawRecord[]): TrendDataPoint[] {
  // Return oldest to newest for charts
  const sorted = [...draws].sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
  return sorted.map((d) => {
    let even = 0;
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    d.numbers.forEach((n) => {
      if (n % 2 === 0) even++;
      sum += n;
      if (n > max) max = n;
      if (n < min) min = n;
    });
    return {
      drawId: d.id,
      date: d.drawDate,
      evenCount: even,
      oddCount: 6 - even,
      sumNumbers: sum,
      maxNumber: max,
      minNumber: min,
    };
  });
}

// Generate statistical suggestions with data-grounded explanations
export function generateStatisticalSuggestion(
  lotteryType: LotteryType,
  draws: DrawRecord[]
): SuggestionRecord {
  const stats = calculateNumberStats(draws, lotteryType);
  
  // Sort into groups
  const hots = [...stats].filter((s) => s.status === 'hot').sort((a, b) => b.count - a.count);
  const warms = [...stats].filter((s) => s.status === 'warm').sort((a, b) => b.frequencyPercent - a.frequencyPercent);
  const colds = [...stats].filter((s) => s.status === 'cold' || s.status === 'gan_cuc_dai').sort((a, b) => b.drought - a.drought);

  const selectedNumbers: NumberStat[] = [];
  const chosenSet = new Set<number>();

  // Pick 2 Hots, 2 Warms, 2 Colds/Gans for balanced historical representation
  const pickFromList = (list: NumberStat[], maxPick: number) => {
    let count = 0;
    for (const item of list) {
      if (!chosenSet.has(item.number) && count < maxPick) {
        selectedNumbers.push(item);
        chosenSet.add(item.number);
        count++;
      }
    }
  };

  pickFromList(hots, 2);
  pickFromList(warms, 2);
  pickFromList(colds, 2);

  // Fill remaining if needed
  if (selectedNumbers.length < 6) {
    const allSorted = [...stats].sort((a, b) => b.count - a.count);
    pickFromList(allSorted, 6 - selectedNumbers.length);
  }

  selectedNumbers.sort((a, b) => a.number - b.number);

  const totalDraws = draws.length;

  const suggestedItems = selectedNumbers.map((stat) => {
    const percent = stat.frequencyPercent;
    let category = 'Tần suất trung bình';
    if (stat.status === 'hot') category = 'Số xuất hiện nhiều (Hot)';
    else if (stat.status === 'gan_cuc_dai') category = 'Số gan lâu chưa về';
    else if (stat.status === 'cold') category = 'Số ít xuất hiện';

    const reasoning = `Số ${stat.number} xuất hiện ${stat.count}/${totalDraws} kỳ gần nhất (${percent}%), ${
      stat.drought === 0 ? 'vừa xuất hiện ở kỳ quay gần nhất.' : `hiện đang gan ${stat.drought} kỳ liên tiếp.`
    }`;

    return {
      number: stat.number,
      statSummary: `${category} (${percent}%), gan ${stat.drought} kỳ`,
      aiReasoning: reasoning,
    };
  });

  const now = new Date().toISOString();
  return {
    id: `sug-${Date.now().toString().slice(-6)}`,
    lotteryType,
    createdAt: now,
    suggestedNumbers: suggestedItems,
    overallAnalysis:
      'Bộ 6 số được chọn theo nguyên tắc cân bằng phổ thống kê (2 số có tần suất cao, 2 số trung bình, và 2 số gan lâu chưa về). Việc phối hợp các dải tần suất giúp người dùng kiểm chứng thực tế rằng mọi sự kết hợp đều không làm thay đổi xác suất trúng là 1/8.14 triệu (với 6/45) hoặc 1/28.98 triệu (với 6/55).',
    disclaimer:
      'LotoVN AI tuyệt đối minh bạch: Thống kê tần suất và kỳ gan KHÔNG dự báo được kết quả tương lai. Xổ số là trò chơi may rủi ngẫu nhiên độc lập.',
    status: 'pending_draw',
  };
}
