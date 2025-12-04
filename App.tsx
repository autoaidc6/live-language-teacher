import React, { useState, useEffect, useRef } from 'react';
import { Language, ConnectionState } from './types';
import { LiveSessionService } from './services/liveSession';
import Visualizer from './components/Visualizer';
import LanguageSelector from './components/LanguageSelector';
import { Mic, PhoneOff, Sparkles, Globe2, Loader2, Volume2, Settings2 } from 'lucide-react';

// Pre-defined difficulty levels
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const App: React.FC = () => {
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.SPANISH);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to hold the service instance to avoid recreation on re-renders
  const sessionService = useRef<LiveSessionService | null>(null);

  useEffect(() => {
    // Initialize service
    sessionService.current = new LiveSessionService({
      onStateChange: setConnectionState,
      onAnalyzerReady: setAnalyserNode,
      onError: (err) => setError(err)
    });

    return () => {
      // Cleanup on unmount
      if (sessionService.current) {
        sessionService.current.disconnect();
      }
    };
  }, []);

  const handleStart = async () => {
    setError(null);
    if (sessionService.current) {
      await sessionService.current.connect(targetLanguage, difficulty);
    }
  };

  const handleStop = () => {
    if (sessionService.current) {
      sessionService.current.disconnect();
    }
  };

  const isSessionActive = connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Globe2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
              LinguaFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
             {connectionState === ConnectionState.CONNECTED && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 animate-fade-in">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 Live
               </div>
             )}
          </div>
        </div>
      </nav>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[80px] -z-10 translate-x-20 translate-y-20" />

        <div className="w-full max-w-2xl flex flex-col items-center gap-12">
          
          {/* Dynamic Hero Section */}
          <div className="relative w-full">
            {isSessionActive ? (
              // Active Session UI: Mic + Spectrum
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-8 flex items-center gap-8 animate-in fade-in zoom-in duration-500">
                {/* Gradient Mic Orb */}
                <div className="relative flex-shrink-0">
                   <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur animate-pulse opacity-50"></div>
                   <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner border-[3px] border-white/20">
                      <Mic className="w-10 h-10 text-white" />
                   </div>
                </div>

                {/* Spectrum Visualizer */}
                <div className="flex-1 h-24 bg-slate-50/50 rounded-2xl overflow-hidden relative">
                   {connectionState === ConnectionState.CONNECTING && (
                     <div className="absolute inset-0 flex items-center justify-center z-10 text-slate-400 bg-slate-50/80 backdrop-blur-sm">
                       <Loader2 className="w-6 h-6 animate-spin mr-2" />
                       Connecting...
                     </div>
                   )}
                   <Visualizer analyser={analyserNode} isActive={connectionState === ConnectionState.CONNECTED} />
                </div>
              </div>
            ) : (
              // Inactive State: Welcoming UI
              <div className="text-center space-y-6 py-12">
                 <div className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 mb-4">
                   <span className="px-4 py-1.5 rounded-full bg-white shadow-sm text-sm font-medium text-slate-600 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-amber-400" />
                     AI Language Coach
                   </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                   Master <span className="text-indigo-600">fluency</span> with <br/>real-time conversation.
                 </h1>
                 <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                   Choose a language, set your level, and start talking. Your AI tutor adapts instantly to your pace.
                 </p>
              </div>
            )}
          </div>

          {/* Controls Container */}
          <div className="w-full max-w-md bg-white/60 backdrop-blur-sm border border-white/50 shadow-xl shadow-slate-200/50 rounded-3xl p-6 transition-all duration-300">
            
            {/* Configuration Options */}
            <div className={`space-y-6 transition-all duration-500 ${isSessionActive ? 'opacity-50 pointer-events-none grayscale-[0.5] scale-[0.98]' : 'opacity-100'}`}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     <Globe2 className="w-4 h-4 text-slate-400" />
                     Target Language
                   </label>
                 </div>
                 <LanguageSelector selected={targetLanguage} onChange={setTargetLanguage} disabled={isSessionActive} />
              </div>

              <div className="space-y-4">
                 <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                   <Settings2 className="w-4 h-4 text-slate-400" />
                   Proficiency Level
                 </label>
                 <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                   {DIFFICULTIES.map((level) => (
                     <button
                       key={level}
                       onClick={() => setDifficulty(level)}
                       disabled={isSessionActive}
                       className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                         difficulty === level 
                           ? 'bg-white text-indigo-600 shadow-sm' 
                           : 'text-slate-500 hover:text-slate-700'
                       }`}
                     >
                       {level}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-pulse">
                 <div className="mt-0.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                 {error}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-8">
              {!isSessionActive ? (
                <button
                  onClick={handleStart}
                  className="w-full group relative overflow-hidden bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-slate-500/25 active:scale-[0.99] flex items-center justify-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-lg">Start Practice Session</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-4 px-8 rounded-2xl transition-colors border border-red-100 flex items-center justify-center gap-3"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Session
                </button>
              )}
            </div>
            
            {/* Contextual Hint */}
            {isSessionActive && (
              <div className="mt-4 text-center animate-in slide-in-from-bottom-2 fade-in">
                <p className="text-xs text-slate-400 font-medium">
                  Try saying: <span className="text-indigo-500">"Switch to English"</span> to pause practice.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;