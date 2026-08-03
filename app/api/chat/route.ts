import { NextRequest, NextResponse } from 'next/server';
import { getLotteryStats } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Tin nhắn không hợp lệ' }, { status: 400 });
    }

    // Load real statistical data for both lotteries to ground the assistant
    const megaStats = await getLotteryStats('mega645', 30);
    const powerStats = await getLotteryStats('power655', 30);

    const megaTopHot = megaStats.hotNumbers.slice(0, 5).map((s) => `${s.number} (${s.count} lần, ${s.frequencyPercent}%)`).join(', ');
    const megaTopGan = megaStats.overdueNumbers.slice(0, 5).map((s) => `${s.number} (gan ${s.drought} kỳ)`).join(', ');
    const powerTopHot = powerStats.hotNumbers.slice(0, 5).map((s) => `${s.number} (${s.count} lần, ${s.frequencyPercent}%)`).join(', ');
    const powerTopGan = powerStats.overdueNumbers.slice(0, 5).map((s) => `${s.number} (gan ${s.drought} kỳ)`).join(', ');

    const lowerMsg = message.toLowerCase();

    // Determine if we should attach an interactive DataCard to the chat response
    let dataCard: any = null;
    if (lowerMsg.includes('gan') || lowerMsg.includes('lạnh') || lowerMsg.includes('nóng') || lowerMsg.includes('lâu chưa')) {
      const type = lowerMsg.includes('power') || lowerMsg.includes('6/55') ? 'power655' : 'mega645';
      const selected = type === 'power655' ? powerStats : megaStats;
      dataCard = {
        title: `Thống Kê Số Nóng & Số Gan (${type === 'power655' ? 'Power 6/55' : 'Mega 6/45'})`,
        type: 'hot_cold',
        payload: {
          hotNumbers: selected.hotNumbers.slice(0, 5),
          overdueNumbers: selected.overdueNumbers.slice(0, 5),
        },
      };
    } else if (lowerMsg.includes('chẵn') || lowerMsg.includes('lẻ') || lowerMsg.includes('phân bố') || lowerMsg.includes('xu hướng')) {
      dataCard = {
        title: 'Phân Bố Chẵn / Lẻ 30 Kỳ Gần Nhất (Mega 6/45)',
        type: 'even_odd',
        payload: megaStats.evenOdd,
      };
    } else if (lowerMsg.includes('xác suất') || lowerMsg.includes('may mắn') || lowerMsg.includes('trúng') || lowerMsg.includes('tâm linh')) {
      dataCard = {
        title: 'Minh Bạch Toán Học & Xác Suất Độc Lập',
        type: 'probability_note',
        payload: {
          megaProb: '1 / 8,145,060 (0.000012%)',
          powerProb: '1 / 28,989,675 (0.0000034%)',
          note: 'Mỗi kỳ quay là một sự kiện ngẫu nhiên độc lập. Số gan lâu chưa về KHÔNG có xác suất xuất hiện cao hơn trong kỳ tiếp theo.',
        },
      };
    }

    const ai = getGemini();
    if (ai) {
      try {
        const systemInstruction = `Bạn là Trợ lý AI Thống Kê và Giáo Dục Xác Suất của LotoVN AI.
Triết lý cốt lõi: MINH BẠCH DỮ LIỆU, THỐNG KÊ HỌC THUẬT, và GIÁO DỤC XÁC SUẤT.
Tuyệt đối KHÔNG sử dụng các cụm từ tâm linh, may mắn, phong thủy, bói toán hay lời khứa hẹn trúng thưởng.
Luôn nhắc nhở rằng mọi kỳ quay xổ số là sự kiện ngẫu nhiên độc lập 100%.

Dữ liệu thực tế 30 kỳ quay gần nhất từ cơ sở dữ liệu MongoDB/LotoVN AI:
- MEGA 6/45:
  + Số Nóng nhất: ${megaTopHot}
  + Số Gan (lâu chưa về nhất): ${megaTopGan}
  + Tỷ lệ Chẵn - Lẻ phổ biến nhất: 3 Chẵn - 3 Lẻ và 4 Chẵn - 2 Lẻ.
  + Kỳ quay mới nhất: ${megaStats.latestDraw?.id} (${megaStats.latestDraw?.drawDate}) - Dãy số: ${megaStats.latestDraw?.numbers.join(', ')}

- POWER 6/55:
  + Số Nóng nhất: ${powerTopHot}
  + Số Gan (lâu chưa về nhất): ${powerTopGan}
  + Kỳ quay mới nhất: ${powerStats.latestDraw?.id} (${powerStats.latestDraw?.drawDate}) - Dãy số: ${powerStats.latestDraw?.numbers.join(', ')}

Hãy trả lời câu hỏi của người dùng bằng tiếng Việt, trích dẫn chính xác các con số thống kê trên nếu liên quan, giải thích dễ hiểu, tự tin, mang phong cách của một chuyên gia khoa học dữ liệu và toán xác suất.`;

        const chatResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemInstruction}\n\nNgười dùng hỏi: "${message}"\n\nHãy trả lời:`,
        });

        const reply = chatResponse.text;
        return NextResponse.json({
          reply: reply || 'Tôi sẵn sàng phân tích dữ liệu thống kê xổ số Mega 6/45 và Power 6/55 cho bạn.',
          dataCard,
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, using smart statistical fallback:', geminiError);
      }
    }

    // High quality statistical fallback when Gemini API key is offline / not set
    let fallbackReply = '';
    if (lowerMsg.includes('mega') || lowerMsg.includes('6/45')) {
      if (lowerMsg.includes('gan') || lowerMsg.includes('lâu')) {
        fallbackReply = `Dựa trên dữ liệu 30 kỳ quay Mega 6/45 gần nhất, các số gan (lâu chưa xuất hiện nhất) là: ${megaTopGan}. Xin lưu ý theo toán học xác suất, số gan lâu chưa về KHÔNG có xác suất xuất hiện cao hơn ở kỳ quay tới—mỗi con bóng vẫn giữ xác suất ngang nhau là 1/45.`;
      } else if (lowerMsg.includes('nóng') || lowerMsg.includes('nhiều')) {
        fallbackReply = `Trong 30 kỳ quay Mega 6/45 gần nhất, top số nóng xuất hiện nhiều nhất bao gồm: ${megaTopHot}. Dù xuất hiện nhiều trong quá khứ, ở kỳ quay mới mỗi quả bóng đều được trộn ngẫu nhiên độc lập.`;
      } else {
        fallbackReply = `Dữ liệu Mega 6/45 hiện tại ghi nhận kỳ quay gần nhất ${megaStats.latestDraw?.id} ngày ${megaStats.latestDraw?.drawDate} với bộ số: [${megaStats.latestDraw?.numbers.join(', ')}]. Tỷ lệ xuất hiện của các số dao động quanh mức trung bình toán học 13.3%. Bạn muốn xem chi tiết số nóng hay số gan nào?`;
      }
    } else if (lowerMsg.includes('power') || lowerMsg.includes('6/55')) {
      if (lowerMsg.includes('gan') || lowerMsg.includes('lâu')) {
        fallbackReply = `Đối với Power 6/55, danh sách các số gan lâu chưa về nhất trong 30 kỳ gần đây là: ${powerTopGan}. Trong không gian 55 số, hiện tượng một số không xuất hiện trong 15-20 kỳ là hoàn toàn phù hợp với phân phối ngẫu nhiên.`;
      } else {
        fallbackReply = `Trong 30 kỳ quay Power 6/55 gần đây, top số nóng xuất hiện nhiều nhất là: ${powerTopHot}. Bạn có thể xem biểu đồ phân bố và chi tiết kỳ gan trong tab Thống Kê.`;
      }
    } else if (lowerMsg.includes('xác suất') || lowerMsg.includes('tại sao') || lowerMsg.includes('độc lập') || lowerMsg.includes('trúng')) {
      fallbackReply = `Về mặt toán học xác suất, mỗi kỳ quay xổ số là một sự kiện ngẫu nhiên độc lập (Independent Random Event). Với Mega 6/45, xác suất trúng Jackpot là 1 trên 8,145,060; với Power 6/55 là 1 trên 28,989,675. Việc một con số "gan 15 kỳ" hay "vừa về kỳ trước" hoàn toàn không ảnh hưởng đến xác suất 1/45 hay 1/55 của nó trong lồng cầu ở kỳ tiếp theo.`;
    } else {
      fallbackReply = `Chào bạn! Tôi là trợ lý AI thống kê của LotoVN AI. Hiện tại trong 30 kỳ Mega 6/45 gần nhất, top số nóng là ${megaTopHot}, còn top số gan lâu chưa về là ${megaTopGan}. Bạn có thể hỏi tôi cụ thể về tần suất, độ gan, phân bố chẵn/lẻ hoặc nguyên lý toán học xác suất của Mega 6/45 và Power 6/55.`;
    }

    return NextResponse.json({
      reply: fallbackReply,
      dataCard: dataCard || {
        title: 'Thống Kê Nhanh Mega 6/45',
        type: 'hot_cold',
        payload: {
          hotNumbers: megaStats.hotNumbers.slice(0, 4),
          overdueNumbers: megaStats.overdueNumbers.slice(0, 4),
        },
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/chat:', err);
    return NextResponse.json({ error: 'Lỗi xử lý yêu cầu chat' }, { status: 500 });
  }
}
