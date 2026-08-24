'use client';

import React, { useState, useMemo } from 'react';
import { DrawRecord, TimeRange } from '@/lib/types';
import { NumberBall } from '@/components/NumberBall';
import { Search, X, SearchX, History } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DrawHistoryClientProps {
  draws: DrawRecord[];
  range: TimeRange;
}

export function DrawHistoryClient({ draws, range }: DrawHistoryClientProps) {
  const [query, setQuery] = useState('');

  // Filter draws client-side
  const filteredDraws = useMemo(() => {
    if (!query) return draws;
    const lowerQuery = query.toLowerCase();
    return draws.filter((draw) => 
      draw.id.toLowerCase().includes(lowerQuery) ||
      draw.drawDate.toLowerCase().includes(lowerQuery)
    );
  }, [draws, query]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-1.5">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <History className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Lịch Sử Quay Thưởng ({range === 'all' ? 'Tất cả kỳ quay' : `${range} kỳ gần nhất`})</span>
        </h3>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kỳ quay hoặc ngày..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block pl-9 pr-10 py-2 placeholder-slate-500 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {/* Desktop Table (>= 640px) */}
        <ScrollArea className="hidden sm:block h-[400px] rounded-xl border border-slate-800">
          <Table className="text-xs text-slate-300">
            <TableHeader className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800 sticky top-0 z-10 shadow-sm">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="py-3 px-4 h-auto text-slate-400">Kỳ quay</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400">Ngày quay</TableHead>
                <TableHead className="py-3 px-4 h-auto text-slate-400">Bộ số trúng thưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-slate-900/40 relative">
              {filteredDraws.length === 0 ? (
                <TableRow className="h-[300px]">
                  <TableCell colSpan={3} className="text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-800/50 rounded-full">
                        <SearchX className="w-8 h-8 text-slate-500" />
                      </div>
                      <p>Không tìm thấy kỳ quay nào khớp với tìm kiếm của bạn.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDraws.map((draw) => (
                <TableRow key={draw.id} className="border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <TableCell className="py-3.5 px-4 font-bold text-teal-300">{draw.id}</TableCell>
                  <TableCell className="py-3.5 px-4 text-slate-400">{draw.drawDate}</TableCell>
                  <TableCell className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {draw.numbers.map((n) => (
                        <NumberBall key={n} number={n} status="default" size="sm" />
                      ))}
                      {draw.bonusNumber && (
                        <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-800">
                          <span className="text-[10px] text-sky-400 font-medium">Bonus</span>
                          <NumberBall number={draw.bonusNumber} status="bonus" size="sm" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Mobile Card List (< 640px) */}
        <ScrollArea className="sm:hidden h-[400px]">
          <div className="space-y-3 h-full pr-3">
            {filteredDraws.length === 0 ? (
              <div className="bg-slate-950/50 border border-slate-800/50 border-dashed rounded-xl h-full flex flex-col items-center justify-center text-center text-slate-400 text-sm">
                <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-slate-800/50 rounded-full">
                  <SearchX className="w-6 h-6 text-slate-500" />
                </div>
                <p>Không tìm thấy kỳ quay nào.</p>
              </div>
            </div>
          ) : filteredDraws.map((draw) => (
            <div key={draw.id} className="py-3 border-b border-slate-800/60 last:border-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-300">{draw.id}</span>
                <span className="text-slate-400">{draw.drawDate}</span>
              </div>
              <div className="flex flex-col gap-1.5 py-1">
              <div className="flex items-center gap-1.5">
                {draw.numbers.slice(0, 5).map((n) => (
                  <NumberBall key={n} number={n} status="default" size="sm" />
                ))}
              </div>
              <div className="flex items-center gap-1.5 self-end">
                {draw.numbers.slice(5).map((n) => (
                  <NumberBall key={n} number={n} status="default" size="sm" />
                ))}
                {draw.bonusNumber && (
                  <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-800 shrink-0">
                    <NumberBall number={draw.bonusNumber} status="bonus" size="sm" />
                  </div>
                )}
              </div>
            </div>
            </div>
          ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
