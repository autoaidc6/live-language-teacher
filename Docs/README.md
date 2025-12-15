# Livelingo - AI Language Coach

Livelingo is a real-time, voice-interactive AI language tutor application. It utilizes Google's Gemini Live API (Multimodal) to provide low-latency, natural conversational practice for language learners of all levels.

## 🚀 Features

- **Real-time Voice Conversation**: Talk naturally with the AI without pressing buttons to record.
- **Adaptive Difficulty**: Switch between Beginner, Intermediate, and Advanced levels on the fly.
- **Multi-Language Support**: Practice Spanish, French, German, Japanese, and more.
- **Audio Visualization**: Real-time frequency analysis of the conversation.
- **Dark Mode**: Fully responsive UI with light and dark themes.
- **Zero-Server Latency**: connects directly from the client to the Gemini Live API via WebSockets.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI/Backend**: Google Gemini Live API (@google/genai SDK)
- **Audio Processing**: Web Audio API (AudioContext, ScriptProcessor, AnalyserNode)
- **Icons**: Lucide React

## 📦 Setup & Usage

1. **API Key**: This project requires a valid Google Gemini API Key with access to the `gemini-2.5-flash-native-audio-preview-09-2025` model.
2. **Environment**: The API key is injected via `process.env.API_KEY` in the build environment.

### Development
The application uses ES modules and can be served directly.
- `index.html` is the entry point.
- `App.tsx` handles the UI and state.
- `services/liveSession.ts` handles the WebSocket connection and audio streaming.

## 🧠 How it Works

1. **Audio Capture**: The app captures microphone input at the device's native sample rate.
2. **Downsampling**: Audio is downsampled to 16kHz PCM (required by Gemini) in the browser.
3. **Streaming**: PCM chunks are streamed via WebSocket to the Gemini Live API.
4. **Response**: The model returns raw PCM audio chunks.
5. **Playback**: The app queues and plays these chunks gaplessly using the Web Audio API.

## 📄 License

MIT
