import React, { useState, useEffect, useRef } from 'react';
import { Language, ConnectionState } from './types';
import { LiveSessionService } from './services/liveSession';
import Visualizer from './components/Visualizer';
import LanguageSelector from './components/LanguageSelector';
import { Mic, PhoneOff, Sparkles, Globe2, BrainCircuit } from 'lucide-react';

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

  const handleLanguageChange = (lang: Language) => {
    setTargetLanguage(lang);
  };

  const isSessionActive = connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Globe2 className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">LinguaFlow</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            connectionState === ConnectionState.CONNECTED ? 'bg-green-100 text-green-700' : 
            connectionState === ConnectionState.CONNECTING ? 'bg-amber-100 text-amber-700' : 'bg-slate-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionState === ConnectionState.CONNECTED ? 'bg-green-500 animate-pulse' : 
              connectionState === ConnectionState.CONNECTING ? 'bg-amber-500 animate-bounce' : 'bg-slate-400'
            }`}></span>
            {connectionState === ConnectionState.CONNECTED ? 'Live Session' : 
             connectionState === ConnectionState.CONNECTING ? 'Connecting...' : 'Ready'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10" style={{animationDelay: '1s'}}></div>

        <div className="max-w-md w-full flex flex-col items-center gap-8">
          
          {/* Visualizer Area */}
          <div className="relative w-full aspect-video bg-white rounded-3xl shadow-xl shadow-indigo-100/50 flex items-center justify-center border border-white/50 overflow-hidden ring-1 ring-slate-100">
            {connectionState === ConnectionState.CONNECTED ? (
               <Visualizer analyser={analyserNode} isActive={true} />
            ) : (
              <div className="text-center p-8">
                 <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-indigo-500" />
                 </div>
                 <h2 className="text-xl font-semibold text-slate-800 mb-2">Start your practice</h2>
                 <p className="text-slate-500">Select a language and connect to your AI coach.</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full space-y-4">
            
            {/* Settings */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity duration-300 ${isSessionActive ? 'opacity-80 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">I want to learn</label>
                <LanguageSelector selected={targetLanguage} onChange={handleLanguageChange} disabled={isSessionActive} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Level</label>
                <div className="relative">
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={isSessionActive}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 shadow-sm font-medium"
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDownIcon size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                 <span className="block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                 {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4">
              {!isSessionActive ? (
                <button
                  onClick={handleStart}
                  className="w-full group relative flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                >
                  <Mic className="w-6 h-6" />
                  <span className="text-lg">Start Conversation</span>
                  <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                   <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-center gap-2 text-slate-600 shadow-sm">
                      <BrainCircuit className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-medium">AI is listening...</span>
                   </div>
                   <button
                    onClick={handleStop}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-4 rounded-2xl transition-colors active:scale-95"
                    title="End Session"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            {isSessionActive && (
              <div className="text-center animate-fade-in">
                <p className="text-sm text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                  Tip: Say <span className="text-indigo-500 font-medium">"Switch to English"</span> or any language to change instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-xs">
        <p>Powered by Gemini Live API • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

// Simple Chevron Icon Component for the select inputs
const ChevronDownIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

export default App;