import React, { useState, useEffect, useRef } from 'react';
import { Language, ConnectionState } from './types';
import { LiveSessionService } from './services/liveSession';
import Visualizer from './components/Visualizer';
import LanguageSelector from './components/LanguageSelector';
import { Mic, PhoneOff, Sparkles, Globe2, Loader2, Volume2, Settings2, X, Moon, Sun } from 'lucide-react';

// Pre-defined difficulty levels
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const App: React.FC = () => {
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.SPANISH);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Ref to hold the service instance to avoid recreation on re-renders
  const sessionService = useRef<LiveSessionService | null>(null);

  useEffect(() => {
    // Initialize service
    sessionService.current = new LiveSessionService({
      onStateChange: setConnectionState,
      onAnalyzerReady: setAnalyserNode,
      onError: (err) => setError(err)
    });

    // Load theme from preference or system
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    return () => {
      // Cleanup on unmount
      if (sessionService.current) {
        sessionService.current.disconnect();
      }
    };
  }, []);

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <Globe2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
              LinguaFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
             {connectionState === ConnectionState.CONNECTED && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium border border-green-100 dark:border-green-800 animate-fade-in">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 Live
               </div>
             )}
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
               aria-label="Settings"
             >
               <Settings2 className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[100px] -z-10 transition-colors duration-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-200/30 dark:bg-purple-500/10 rounded-full blur-[80px] -z-10 translate-x-20 translate-y-20 transition-colors duration-500" />

        <div className="w-full max-w-2xl flex flex-col items-center gap-12">
          
          {/* Dynamic Hero Section */}
          <div className="relative w-full">
            {isSessionActive ? (
              // Active Session UI: Mic + Spectrum
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-indigo-100 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 flex items-center gap-8 animate-in fade-in zoom-in duration-500 transition-colors duration-300">
                {/* Gradient Mic Orb */}
                <div className="relative flex-shrink-0">
                   <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur animate-pulse opacity-50 dark:opacity-40"></div>
                   <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner border-[3px] border-white/20">
                      <Mic className="w-10 h-10 text-white" />
                   </div>
                </div>

                {/* Spectrum Visualizer */}
                <div className="flex-1 h-24 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl overflow-hidden relative transition-colors duration-300">
                   {connectionState === ConnectionState.CONNECTING && (
                     <div className="absolute inset-0 flex items-center justify-center z-10 text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
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
                 <div className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 transition-colors">
                   <span className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                     <Sparkles className="w-4 h-4 text-amber-400" />
                     AI Language Coach
                   </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                   Master <span className="text-indigo-600 dark:text-indigo-400">fluency</span> with <br/>real-time conversation.
                 </h1>
                 <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                   Choose a language, set your level, and start talking. Your AI tutor adapts instantly to your pace.
                 </p>
              </div>
            )}
          </div>

          {/* Controls Container */}
          <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20 rounded-3xl p-6 transition-all duration-300">
            
            {/* Configuration Options */}
            <div className={`space-y-6 transition-all duration-500 ${isSessionActive ? 'opacity-50 pointer-events-none grayscale-[0.5] scale-[0.98]' : 'opacity-100'}`}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                     <Globe2 className="w-4 h-4 text-slate-400" />
                     Target Language
                   </label>
                 </div>
                 <LanguageSelector selected={targetLanguage} onChange={setTargetLanguage} disabled={isSessionActive} />
              </div>

              <div className="space-y-4">
                 <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                   <Settings2 className="w-4 h-4 text-slate-400" />
                   Proficiency Level
                 </label>
                 <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
                   {DIFFICULTIES.map((level) => (
                     <button
                       key={level}
                       onClick={() => setDifficulty(level)}
                       disabled={isSessionActive}
                       className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                         difficulty === level 
                           ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                           : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-pulse">
                 <div className="mt-0.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                 {error}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-8">
              {!isSessionActive ? (
                <button
                  onClick={handleStart}
                  className="w-full group relative overflow-hidden bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-slate-500/25 dark:shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-lg">Start Practice Session</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium py-4 px-8 rounded-2xl transition-colors border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Session
                </button>
              )}
            </div>
            
            {/* Contextual Hint */}
            {isSessionActive && (
              <div className="mt-4 text-center animate-in slide-in-from-bottom-2 fade-in">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Try saying: <span className="text-indigo-500 dark:text-indigo-400">"Switch to English"</span> to pause practice.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Appearance</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{theme === 'dark' ? 'Dark' : 'Light'} theme enabled</p>
                  </div>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                  LinguaFlow v1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;