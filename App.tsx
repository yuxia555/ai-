
import React, { useState } from 'react';
import JSZip from 'jszip';
import { ImageUploader } from './components/ImageUploader';
import { DirectorConsole } from './components/DirectorConsole';
import { AppState, DirectorLog, GenerationConfig, ImageAnalysis, StoryboardFramePlan, GeneratedFrame } from './types';
import * as geminiService from './services/geminiService';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [actionDescription, setActionDescription] = useState('');
  const [logs, setLogs] = useState<DirectorLog[]>([]);
  const [frames, setFrames] = useState<GeneratedFrame[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    actionDescription: '',
    quality: 'standard',
    aspectRatio: '16:9'
  });

  const addLog = (phase: string, message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      phase,
      message
    }]);
  };

  const handleStart = async () => {
    if (!referenceImage || !actionDescription) return;

    setAppState(AppState.ANALYZING);
    setLogs([]);
    setFrames([]);

    try {
      addLog('初始化', '核心引擎已就绪，正在接入视觉语义网络...');
      addLog('DNA分析', '深度提取参考图特征：骨骼构图、光效分布、角色肤色服装...');
      const analysis = await geminiService.analyzeReferenceImage(referenceImage);
      addLog('锁定', `人物DNA解析完成: ${analysis.characterDNA.substring(0, 45)}...`);
      
      setAppState(AppState.PLANNING);
      addLog('策划', '导演正在编写 9 镜头叙事脚本 (Sequence Planning)...');
      const sequencePlans = await geminiService.planStoryboardSequence(analysis, actionDescription);
      
      const initialFrames: GeneratedFrame[] = sequencePlans.map(plan => ({
        id: plan.frameNumber,
        imageUrl: null,
        plan,
        status: 'pending'
      }));
      setFrames(initialFrames);
      addLog('导演', '脚本定稿。进入强制一致性渲染阶段。');

      setAppState(AppState.GENERATING);
      
      for (let i = 0; i < sequencePlans.length; i++) {
        const currentPlan = sequencePlans[i];
        
        setFrames(prev => prev.map(f => 
          f.id === currentPlan.frameNumber ? { ...f, status: 'generating' } : f
        ));
        
        addLog('渲染', `帧 ${currentPlan.frameNumber}/9: [${currentPlan.shotType}] 正在同步渲染...`);
        
        try {
          const imageUrl = await geminiService.generateSingleFrame(currentPlan, referenceImage, config);
          
          setFrames(prev => prev.map(f => 
            f.id === currentPlan.frameNumber ? { ...f, imageUrl, status: 'done' } : f
          ));
        } catch (err) {
          setFrames(prev => prev.map(f => 
            f.id === currentPlan.frameNumber ? { ...f, status: 'error' } : f
          ));
          addLog('警告', `帧 ${currentPlan.frameNumber} 渲染受到干扰，已尝试自动修正。`);
        }
      }

      addLog('产出', '分镜脚本全序列生成完毕。角色特征已完美复刻。');
      setAppState(AppState.COMPLETE);

    } catch (error: any) {
      console.error(error);
      addLog('失败', error.message || '渲染引擎发生致命错误');
      setAppState(AppState.ERROR);
    }
  };

  const handleDownloadAll = async () => {
    if (frames.length === 0) return;
    setIsZipping(true);
    addLog('打包', '正在聚合所有分镜素材，准备 ZIP 容器...');

    try {
      const zip = new JSZip();
      frames.forEach((frame) => {
        if (frame.imageUrl) {
          const base64Data = frame.imageUrl.split(',')[1];
          const fileName = `Frame_${frame.id}_${frame.plan.shotType.replace(/\s+/g, '_')}.png`;
          zip.file(fileName, base64Data, { base64: true });
        }
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI分镜脚本_项目包_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog('系统', '项目包已成功导出。');
    } catch (err) {
      addLog('错误', '打包下载请求被拒绝。');
    } finally {
      setIsZipping(false);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setFrames([]);
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-zinc-300 flex flex-col items-center">
      {/* Cinematic Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              AI 分镜脚本
              <span className="text-[10px] font-mono py-0.5 px-2 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700 tracking-widest uppercase">PRO v3.2</span>
            </h1>
            <p className="text-zinc-500 text-[10px] font-mono mt-0.5 tracking-[0.3em] uppercase opacity-60">Visual Continuity Narrative Engine</p>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          <div className="flex flex-col items-end">
             <span className="text-zinc-500">角色锁定</span>
             <span className="text-red-500/80">DNA IDENTITY ACTIVE</span>
          </div>
          <div className="flex flex-col items-end border-l border-zinc-800 pl-8">
            <span className="text-zinc-500">渲染环境</span>
            <span className="text-zinc-400">GEMINI CLUSTER 2.5</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1 flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Controls */}
        <div className="lg:w-80 flex flex-col gap-8 shrink-0">
          <section className="space-y-3">
            <label className="text-[11px] font-medium uppercase text-zinc-500 tracking-widest flex justify-between items-center">
              01 角色与视觉参考
              {referenceImage && <span className="text-red-500 text-[8px] animate-pulse">DNA LOCKED</span>}
            </label>
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800/50">
              <ImageUploader 
                onImageSelected={setReferenceImage} 
                selectedImage={referenceImage}
                disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR} 
              />
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-[11px] font-medium uppercase text-zinc-500 tracking-widest">02 叙事脚本流</label>
            <textarea
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="请描述故事情节的变化过程... 引擎将自动拆解为 9 个高保真分镜，并严格保持参考图的人物特征。"
              disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
              className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-300 focus:outline-none focus:border-red-900/40 transition-all resize-none h-40 placeholder-zinc-700 font-light leading-relaxed ring-offset-black focus:ring-1 focus:ring-red-900/20"
            />
          </section>

          <section className="space-y-5 pt-6 border-t border-zinc-900/50">
             <div className="flex justify-between items-center px-1">
               <label className="text-[11px] font-medium uppercase text-zinc-500 tracking-widest">渲染比例</label>
               <select 
                  value={config.aspectRatio}
                  onChange={(e) => setConfig({...config, aspectRatio: e.target.value as '16:9' | '4:3'})}
                  disabled={appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] text-zinc-400 focus:outline-none uppercase font-mono"
               >
                 <option value="16:9">16:9 电影宽幅</option>
                 <option value="4:3">4:3 经典画幅</option>
               </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={appState === AppState.COMPLETE ? handleReset : handleStart}
                disabled={!referenceImage || !actionDescription || (appState !== AppState.IDLE && appState !== AppState.COMPLETE && appState !== AppState.ERROR)}
                className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-500 text-[11px] border
                  ${appState === AppState.IDLE || appState === AppState.ERROR 
                    ? 'bg-white text-black border-white hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.05)]' 
                    : appState === AppState.COMPLETE 
                      ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-wait'
                  }
                `}
              >
                {appState === AppState.IDLE && '开始叙事渲染 (9 Frames)'}
                {appState === AppState.ANALYZING && '语义网络分析中...'}
                {appState === AppState.PLANNING && '导演策划脚本中...'}
                {appState === AppState.GENERATING && '锁定 DNA 渲染中...'}
                {appState === AppState.COMPLETE && '重置并新建项目'}
                {appState === AppState.ERROR && '重试生成'}
              </button>

              {appState === AppState.COMPLETE && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="w-full py-4 bg-red-600/10 text-red-500 border border-red-900/30 rounded-xl font-bold tracking-widest uppercase text-[11px] hover:bg-red-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isZipping ? (
                    <span className="animate-pulse">正在封装 ZIP 包...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载全套分镜脚本 (ZIP)
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          <DirectorConsole logs={logs} />
        </div>

        {/* Narrative Grid View */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 md:p-10 shadow-inner relative overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            {frames.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <div className="grid grid-cols-3 gap-6 w-64 mb-10">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-[16/10] border-2 border-zinc-800 rounded-lg"></div>
                  ))}
                </div>
                <p className="text-zinc-500 font-mono text-[11px] uppercase tracking-[0.4em]">Cinematic Sequence Standby</p>
                <p className="text-zinc-600 text-xs mt-4">等待叙事脚本输入以激活渲染矩阵</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-1000">
                {frames.map((frame) => (
                  <div key={frame.id} className="group relative flex flex-col bg-zinc-900/20 border border-zinc-800/40 rounded-2xl overflow-hidden transition-all hover:border-zinc-600/50 hover:shadow-2xl hover:shadow-black">
                    
                    {/* Frame Meta Header */}
                    <div className="flex justify-between items-center px-4 py-2 bg-black/40 border-b border-zinc-900/50 text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${frame.status === 'done' ? 'bg-red-600' : frame.status === 'generating' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'}`}></span>
                        SCENE {frame.id.toString().padStart(2, '0')}
                      </span>
                      <span className="text-zinc-400 font-bold uppercase tracking-wider">{frame.plan.shotType}</span>
                    </div>

                    {/* Frame Visual Content */}
                    <div className={`${config.aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-[4/3]'} relative flex items-center justify-center bg-black overflow-hidden`}>
                      {frame.status === 'generating' && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                           <div className="w-20 h-0.5 bg-zinc-900 overflow-hidden rounded-full mb-4">
                              <div className="h-full bg-red-600 animate-[loading_2s_infinite] shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                           </div>
                           <span className="text-[10px] font-mono text-red-600 animate-pulse uppercase tracking-[0.3em]">DNA LOCKING...</span>
                        </div>
                      )}
                      
                      {frame.imageUrl ? (
                        <img 
                          src={frame.imageUrl} 
                          alt={`Frame ${frame.id}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out"
                        />
                      ) : (
                        <div className="text-[10px] font-mono text-zinc-800 uppercase tracking-widest">Waiting for Render</div>
                      )}

                      {/* Overlays */}
                      <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity">
                         <div className="w-4 h-4 border-t border-l border-white/50"></div>
                      </div>
                      <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity">
                         <div className="w-4 h-4 border-b border-r border-white/50"></div>
                      </div>

                      {frame.imageUrl && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-[2px] transition-all duration-500 flex items-center justify-center gap-4">
                           <a 
                             href={frame.imageUrl} 
                             download={`SCENE_${frame.id}.png`}
                             className="bg-white text-black text-[10px] font-bold px-6 py-2.5 rounded-full uppercase tracking-tighter hover:bg-zinc-200 transition-all hover:scale-110 active:scale-95"
                           >
                             保存当前帧
                           </a>
                        </div>
                      )}
                    </div>

                    {/* Frame Annotation */}
                    <div className="px-5 py-4 min-h-[70px] bg-black/40">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-light italic opacity-80 group-hover:opacity-100 transition-opacity">
                        "{frame.plan.description}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="w-full py-6 border-t border-zinc-900/50 flex justify-center items-center gap-12 text-zinc-800">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">AI 分镜脚本 © 2025 HIGH-FIDELITY STORYBOARD</span>
        <div className="flex items-center gap-3">
           <span className="w-1 h-1 rounded-full bg-red-900"></span>
           <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700">Role Consistency Engine v3.2.0-Alpha</span>
        </div>
      </footer>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #18181b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
