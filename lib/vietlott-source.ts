import * as cheerio from 'cheerio';
import { DrawRecord, LotteryType } from './types';

// ============================================================
// NGUỒN CHÍNH: gọi thẳng vietlott.vn (chính chủ)
// ============================================================
// Vietlott không có REST/JSON API công khai. Trang kết quả (ASP.NET WebForms cũ) tải
// bảng kết quả qua cơ chế RPC nội bộ "AjaxPro" thay vì API thông thường. Endpoint, request
// body và header dưới đây được tham khảo từ mã nguồn mở MIT license
// https://github.com/vietvudanh/vietlott-data (src/vietlott/crawler/products/power655.py,
// requests_helper/config.py) — đã tự verify lại bằng curl, response khớp 100% với trang
// kết quả chính thức, không cần cookie (khác với một số sản phẩm Vietlott khác).

interface AjaxProEndpointConfig {
  url: string;
  key: string;
  arrayRows: number; // ArrayNumbers phải đúng số hàng, sai thì server trả lỗi
  referer: string;
}

const OFFICIAL_ENDPOINTS: Record<LotteryType, AjaxProEndpointConfig> = {
  mega645: {
    url: 'https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.Game645CompareWebPart,Vietlott.PlugIn.WebParts.ashx',
    key: '8290fce2',
    arrayRows: 6,
    referer: 'https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-645',
  },
  power655: {
    url: 'https://vietlott.vn/ajaxpro/Vietlott.PlugIn.WebParts.Game655CompareWebPart,Vietlott.PlugIn.WebParts.ashx',
    key: '23bbd667',
    arrayRows: 5,
    referer: 'https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-655',
  },
};

function buildAjaxProBody(config: AjaxProEndpointConfig, pageIndex: number = 0) {
  return {
    ORenderInfo: {
      ExtraParam1: '',
      ExtraParam2: '',
      ExtraParam3: '',
      FullPageAlias: '',
      IsPageDesign: false,
      OrgPageAlias: '',
      PageAlias: '',
      RefKey: '',
      SiteAlias: 'main.vi',
      SiteId: 'main.frontend.vi',
      SiteLang: 'vi',
      SiteName: 'Vietlott',
      SiteURL: '',
      System: 1,
      UserSessionId: '',
      WebPage: null,
    },
    Key: config.key,
    GameDrawId: '',
    ArrayNumbers: Array.from({ length: config.arrayRows }, () => Array(18).fill('')),
    CheckMulti: false,
    PageIndex: pageIndex,
  };
}

/** Parse fragment HTML (bảng kết quả) trả về trong `value.HtmlContent` của response AjaxPro. */
function parseOfficialHtml(
  html: string,
  lotteryType: LotteryType,
  limit: number
): Omit<DrawRecord, 'createdAt'>[] {
  const $ = cheerio.load(html);
  const draws: Omit<DrawRecord, 'createdAt'>[] = [];

  $('table tbody tr').each((_, row) => {
    if (draws.length >= limit) return;

    const cells = $(row).find('td');
    const dateText = $(cells[0]).text().trim(); // dd/MM/yyyy
    const idText = $(cells[1]).text().trim(); // "01544" (không có #)

    const allNumbers: number[] = [];
    $(cells[2])
      .find('span')
      .each((__, span) => {
        const $span = $(span);
        if ($span.hasClass('bong_tron-sperator')) return; // dấu "|" ngăn số chính/số đặc biệt
        const text = $span.text().trim();
        if (text) allNumbers.push(parseInt(text, 10));
      });

    if (!idText || !dateText || allNumbers.length === 0 || allNumbers.some(Number.isNaN)) {
      return;
    }

    const [day, month, year] = dateText.split('/');
    const mainNumbers = lotteryType === 'power655' ? allNumbers.slice(0, 6) : allNumbers;
    const bonusNumber = lotteryType === 'power655' ? allNumbers[6] : undefined;

    draws.push({
      id: `#${idText}`,
      lotteryType,
      drawDate: `${year}-${month}-${day}`,
      numbers: [...mainNumbers].sort((a, b) => a - b),
      bonusNumber,
      jackpotValue: 20000000000,
      hasWinner: false,
    });
  });

  return draws;
}

export async function fetchFromOfficialSource(
  lotteryType: LotteryType,
  limit: number,
  pageIndex: number = 0
): Promise<Omit<DrawRecord, 'createdAt'>[]> {
  const config = OFFICIAL_ENDPOINTS[lotteryType];

  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
      Accept: '*/*',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-AjaxPro-Method': 'ServerSideDrawResult',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://vietlott.vn',
      Referer: config.referer,
    },
    body: JSON.stringify(buildAjaxProBody(config, pageIndex)),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Vietlott official endpoint HTTP ${res.status}`);
  }

  const json = await res.json();
  const html = json?.value?.HtmlContent;
  if (typeof html !== 'string' || html.length === 0) {
    if (pageIndex === 0) throw new Error('Vietlott official endpoint: missing HtmlContent trong response');
    return [];
  }

  const draws = parseOfficialHtml(html, lotteryType, limit);
  if (draws.length === 0 && pageIndex === 0) {
    throw new Error('Vietlott official endpoint: không parse được dòng kết quả nào (có thể HTML đã đổi cấu trúc)');
  }
  return draws;
}

export async function fetchAllFromOfficialSource(
  lotteryType: LotteryType
): Promise<Omit<DrawRecord, 'createdAt'>[]> {
  const allDraws: Omit<DrawRecord, 'createdAt'>[] = [];
  let pageIndex = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`[vietlott-source] Fetching official page ${pageIndex} for ${lotteryType}...`);
    const pageDraws = await fetchFromOfficialSource(lotteryType, 100, pageIndex);
    if (pageDraws.length === 0) {
      hasMore = false;
    } else {
      allDraws.push(...pageDraws);
      pageIndex++;
    }
  }
  
  return allDraws;
}

// ============================================================
// NGUỒN DỰ PHÒNG: community data (MIT license, cập nhật ~00:01 hàng ngày)
// https://github.com/vietvudanh/vietlott-data — chỉ dùng khi nguồn chính lỗi.
// ============================================================
const COMMUNITY_SOURCE_URLS: Record<LotteryType, string> = {
  mega645: 'https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power645.jsonl',
  power655: 'https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power655.jsonl',
};

interface CommunitySourceRecord {
  date: string;
  id: string;
  result: number[];
  process_time: string;
}

export async function fetchFromCommunitySource(
  lotteryType: LotteryType,
  limit: number
): Promise<Omit<DrawRecord, 'createdAt'>[]> {
  const res = await fetch(COMMUNITY_SOURCE_URLS[lotteryType], { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Community source HTTP ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);
  const latestLines = limit > 0 ? lines.slice(-limit).reverse() : lines.reverse(); // limit 0 = lấy hết

  return latestLines.map((line) => {
    const record: CommunitySourceRecord = JSON.parse(line);
    const mainNumbers = lotteryType === 'power655' ? record.result.slice(0, 6) : record.result;
    const bonusNumber = lotteryType === 'power655' ? record.result[6] : undefined;

    return {
      id: `#${record.id}`,
      lotteryType,
      drawDate: record.date,
      numbers: [...mainNumbers].sort((a, b) => a - b),
      bonusNumber,
      jackpotValue: 20000000000,
      hasWinner: false,
    };
  });
}

/**
 * Lấy N kỳ quay gần nhất, ưu tiên gọi thẳng vietlott.vn (nguồn chính chủ). Nếu lỗi
 * (đổi cấu trúc HTML, đổi endpoint, mạng lỗi...), tự động fallback sang nguồn cộng đồng
 * để cron job không bị gián đoạn hoàn toàn — trả kèm `source` để log biết đang dùng nguồn nào.
 */
export async function fetchLatestDrawsFromSource(
  lotteryType: LotteryType,
  count = 3
): Promise<{ draws: Omit<DrawRecord, 'createdAt'>[]; source: 'official' | 'community' }> {
  try {
    const draws = await fetchFromOfficialSource(lotteryType, count);
    return { draws, source: 'official' };
  } catch (officialError) {
    console.warn(
      `[vietlott-source] Nguồn chính thất bại cho ${lotteryType}, fallback sang community source:`,
      officialError
    );
    const draws = await fetchFromCommunitySource(lotteryType, count);
    return { draws, source: 'community' };
  }
}
