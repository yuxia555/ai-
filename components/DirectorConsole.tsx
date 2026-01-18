
import React, { useEffect, useRef } from 'react';
import { DirectorLog } from '../types';

interface DirectorConsoleProps {
  logs: DirectorLog[];
}

export const DirectorConsole: React.FC<DirectorConsoleProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="w-full bg-black/60 backdrop-blur-md border border-zinc-800/40 rounded-xl p-5 font-mono text-[11px] text-zinc-400 shadow-2xl overflow-hidden flex flex-col h-56 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-3 text-zinc-600 uppercase tracking-widest text-[9px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          CONSOLE LOG // 执行序列
        </div>
        <div className="text-[8px] opacity-40">OS_v3.2.0</div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <span className="text-zinc-700 tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            <span className={`font-bold min-w-[70px] ${log.phase === '失败' || log.phase === '错误' ? 'text-red-900' : 'text-zinc-500'}`}>[{log.phase}]</span>
            <span className={`${log.phase === 'DNA分析' || log.phase === '策划' ? 'text-zinc-300' : 'text-zinc-500'} leading-snug`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1c1c1f;
        }
      `}</style>
    </div>
  );
};
