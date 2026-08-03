'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LotteryType } from '@/lib/types';
import { NumberBall } from './NumberBall';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  BarChart2,
  TrendingUp,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

function createMsgId(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 100000000)}`;
}

interface ChatTabProps {
  selectedLottery: LotteryType;
}

export const ChatTab: React.FC<ChatTabProps> = ({ selectedLottery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Xin chào! Tôi là **Trợ lý AI Thống Kê & Giáo Dục Xác Suất** của LotoVN AI.
Tôi có thể phân tích dữ liệu 30 kỳ quay gần nhất của **Mega 6/45** và **Power 6/55**, giúp bạn:
- Nhận diện các **số nóng** (xuất hiện nhiều) và **số gan** (lâu chưa về).
- So sánh tỷ lệ **chẵn/lẻ**, **cao/thấp** và xu hướng phân bố.
- Giải thích **nguyên lý xác suất toán học** để bạn luôn hiểu đúng rằng mỗi kỳ quay xổ số là sự kiện ngẫu nhiên độc lập.

Bạn muốn hỏi về số liệu nào hôm nay?`,
      timestamp: new Date().toISOString(),
      dataCard: {
        title: 'Thẻ Dữ Liệu Nhanh: Minh Bạch Xác Suất',
        type: 'probability_note',
        payload: {
          megaProb: '1 / 8,145,060',
          powerProb: '1 / 28,989,675',
          note: 'Trong thống kê độc lập, một số lâu chưa về (số gan) KHÔNG có xác suất cao hơn ở kỳ quay tới.',
        },
      },
    },
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const promptSuggestions = [
    'Số nào lâu chưa về nhất ở Mega 6/45?',
    'Top 5 số nóng nhất của Power 6/55 là gì?',
    'Phân bố chẵn lẻ 30 kỳ qua thế nào?',
    'Tại sao tôi chọn toàn số nóng nhưng vẫn trượt?',
    'Giải thích Ngụy biện của người đánh bạc',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: createMsgId('user'),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6),
        }),
      });

      const json = await res.json();
      const botMsg: ChatMessage = {
        id: createMsgId('assistant'),
        role: 'assistant',
        content:
          json.reply ||
          'Tôi đã nhận được yêu cầu, nhưng có lỗi tạm thời khi truy xuất cơ sở dữ liệu.',
        timestamp: new Date().toISOString(),
        dataCard: json.dataCard,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: createMsgId('error'),
        role: 'assistant',
        content:
          'Xin lỗi, không thể kết nối đến máy chủ thống kê. Vui lòng thử lại sau vài giây.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Trợ Lý AI Thống Kê & Xác Suất</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Gemini Grounded
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Hỏi đáp tự nhiên bằng tiếng Việt dựa trên dữ liệu thật từ MongoDB
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Trực tuyến • Minh bạch 100%</span>
        </div>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
          Gợi ý hỏi:
        </span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}
              >
                {isUser ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-teal-500/15 text-slate-100 border border-teal-500/30 rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800/80 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-line font-normal">
                  {msg.content}
                </div>

                {/* Optional Interactive DataCard Widget embedded in assistant replies */}
                {!isUser && msg.dataCard && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 mb-2">
                      <BarChart2 className="w-4 h-4" />
                      <span>{msg.dataCard.title}</span>
                    </div>

                    {msg.dataCard.type === 'hot_cold' &&
                      msg.dataCard.payload && (
                        <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <div>
                            <div className="text-[11px] text-slate-400 font-semibold mb-1.5">
                              Số Nóng Nhất:
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {msg.dataCard.payload.hotNumbers?.map(
                                (s: any) => (
                                  <NumberBall
                                    key={s.number}
                                    number={s.number}
                                    size="sm"
                                    status="hot"
                                  />
                                )
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] text-slate-400 font-semibold mb-1.5">
                              Số Gan Lâu Nhất:
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {msg.dataCard.payload.overdueNumbers?.map(
                                (s: any) => (
                                  <NumberBall
                                    key={s.number}
                                    number={s.number}
                                    size="sm"
                                    status="gan_cuc_dai"
                                    drought={s.drought}
                                    showDroughtBadge
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {msg.dataCard.type === 'probability_note' &&
                      msg.dataCard.payload && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300/90 space-y-1">
                          <div>
                            <strong>Mega 6/45:</strong>{' '}
                            {msg.dataCard.payload.megaProb} •{' '}
                            <strong>Power 6/55:</strong>{' '}
                            {msg.dataCard.payload.powerProb}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {msg.dataCard.payload.note}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">
                Đang phân tích số liệu MongoDB & xác suất...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Hỏi về số gan, số nóng, xu hướng chẵn lẻ hay xác suất trúng..."
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !inputMsg.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
        >
          <span>Gửi</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
