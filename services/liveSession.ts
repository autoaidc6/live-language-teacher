import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ConnectionState, Language } from "../types";
import { base64ToBytes, createPcmBlob, decodeAudioData } from "../utils/audioUtils";

interface LiveSessionCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onAnalyzerReady: (analyzer: AnalyserNode | null) => void;
  onError: (error: string) => void;
}

export class LiveSessionService {
  private ai: GoogleGenAI;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private currentSessionPromise: Promise<any> | null = null;
  
  // Audio Contexts
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  
  // Audio Nodes
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  
  // Playback State
  private nextStartTime: number = 0;
  private audioSources: Set<AudioBufferSourceNode> = new Set();
  
  private callbacks: LiveSessionCallbacks;

  constructor(callbacks: LiveSessionCallbacks) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.callbacks = callbacks;
  }

  public async connect(language: Language, difficulty: string) {
    if (this.connectionState === ConnectionState.CONNECTED) return;

    this.updateState(ConnectionState.CONNECTING);

    try {
      // 1. Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // 2. Setup Audio Graph (Analyzer for visuals)
      this.analyzer = this.outputAudioContext.createAnalyser();
      this.analyzer.fftSize = 512; // Higher resolution for spectrum
      this.analyzer.smoothingTimeConstant = 0.5;
      
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.analyzer);
      this.analyzer.connect(this.outputAudioContext.destination);

      // Notify App that analyzer is ready for visualization
      this.callbacks.onAnalyzerReady(this.analyzer);

      // 3. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 4. Connect to Gemini Live
      const systemInstruction = `You are an expert ${language} language coach. 
      Your student is at a ${difficulty} level.
      Goal: Help them practice speaking naturally. 
      Behavior:
      - Engage in a conversation.
      - Correct major mistakes gently but don't be nitpicky.
      - If they struggle, switch to English briefly to explain, then switch back.
      - Adapt your vocabulary to their level (${difficulty}).
      - Keep responses relatively concise (under 30 seconds) to allow for back-and-forth.
      - If the user asks to switch languages, immediately switch to that language and continue the lesson seamlessly.
      `;

      this.currentSessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            this.updateState(ConnectionState.CONNECTED);
            this.startAudioInput(stream);
          },
          onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
          onclose: () => this.disconnect(),
          onerror: (err) => {
            console.error("Session error:", err);
            this.callbacks.onError(err.message || "Unknown session error");
            this.disconnect();
          }
        }
      });

    } catch (error: any) {
      this.callbacks.onError(error.message);
      this.updateState(ConnectionState.ERROR);
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      if (this.currentSessionPromise) {
        this.currentSessionPromise.then(session => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      const audioBuffer = await decodeAudioData(
        base64ToBytes(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode); // Connect to output node (which goes to analyzer -> dest)
      
      source.addEventListener('ended', () => {
        this.audioSources.delete(source);
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.audioSources.add(source);
    }

    // Handle Interruption
    if (message.serverContent?.interrupted) {
      this.stopAllAudio();
      this.nextStartTime = 0;
    }
  }

  private stopAllAudio() {
    this.audioSources.forEach(source => {
      try {
        source.stop();
      } catch (e) { /* ignore */ }
    });
    this.audioSources.clear();
  }

  public disconnect() {
    if (this.connectionState === ConnectionState.DISCONNECTED) return;

    this.stopAllAudio();
    this.callbacks.onAnalyzerReady(null);

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.inputSource) this.inputSource.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    
    this.updateState(ConnectionState.DISCONNECTED);
  }

  private updateState(state: ConnectionState) {
    this.connectionState = state;
    this.callbacks.onStateChange(state);
  }
}