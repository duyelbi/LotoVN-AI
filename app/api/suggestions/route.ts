import { NextRequest, NextResponse } from 'next/server';
import { getDraws, getSuggestionLogs, saveSuggestionLog } from '@/lib/db';
import { generateStatisticalSuggestion } from '@/lib/seed-data';
import { LotteryType } from '@/lib/types';
import { getGemini } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') as LotteryType | null;
    const logs = await getSuggestionLogs(typeParam || undefined);
    return NextResponse.json({ suggestions: logs });
  } catch (err: any) {
    console.error('Error in GET /api/suggestions:', err);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lotteryType, userId } = body;
    const type: LotteryType = lotteryType === 'power655' ? 'power655' : 'mega645';

    const draws = await getDraws(type, 40);
    const suggestionRecord = generateStatisticalSuggestion(type, draws);
    if (userId) {
      suggestionRecord.userId = userId;
    }

    // Enhance natural language reasoning via Gemini if available
    const ai = getGemini();
    if (ai) {
      try {
        const numbersPrompt = suggestionRecord.suggestedNumbers
          .map((item) => `- Số ${item.number}: ${item.statSummary} (Lý do gốc: ${item.aiReasoning})`)
          .join('\n');

        const prompt = `Bạn là cố vấn thống kê toán học và giáo dục xác suất của ứng dụng "LotoVN AI".
Chúng tôi đang tạo một bộ 6 số tham khảo thống kê cho xổ số ${type === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}:
${numbersPrompt}

Hãy viết lại câu trả lời JSON (chỉ JSON hợp lệ, không markdown) theo định dạng sau:
{
  "enhancedItems": [
    {
      "number": 11,
      "aiReasoning": "Giải thích ngắn gọn 1-2 câu bằng tiếng Việt chuẩn xác học thuật, dẫn đúng số liệu tần suất và kỳ gan ở trên, không dùng từ ngữ tâm linh/may mắn."
    }
  ],
  "overallAnalysis": "Nhận xét tổng hợp ngắn gọn về phổ phân bố của bộ số này, nhấn mạnh rằng các số nóng, ấm hay gan cực đại đều có xác suất xuất hiện ngang bằng nhau trong kỳ quay độc lập tới."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.enhancedItems)) {
            suggestionRecord.suggestedNumbers = suggestionRecord.suggestedNumbers.map((item) => {
              const match = parsed.enhancedItems.find((p: any) => Number(p.number) === item.number);
              return {
                ...item,
                aiReasoning: match?.aiReasoning || item.aiReasoning,
              };
            });
          }
          if (parsed.overallAnalysis) {
            suggestionRecord.overallAnalysis = parsed.overallAnalysis;
          }
        }
      } catch (aiErr) {
        // Fallback silently to our high-quality data-grounded statistical explanations
        console.warn('Gemini enhancement unavailable, using grounded statistical reasoning:', aiErr);
      }
    }

    const saved = await saveSuggestionLog(suggestionRecord);
    return NextResponse.json({ success: true, suggestion: saved }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/suggestions:', error);
    return NextResponse.json(
      { error: 'Không thể tạo bộ số gợi ý', details: error?.message },
      { status: 500 }
    );
  }
}
