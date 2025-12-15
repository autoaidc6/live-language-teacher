# System Architecture

## 1. High-Level Overview

Livelingo is a **client-side Single Page Application (SPA)**. It interacts directly with the Google Gemini API using the Multimodal Live WebSocket protocol. There is no intermediate backend server for audio processing; all audio encoding/decoding happens in the user's browser to minimize latency.

## 2. Component Diagram

```mermaid
graph TD
    User[User Microphone] -->|Raw Audio| Browser[Browser AudioContext]
    Browser -->|Downsampling (48k -> 16k)| AudioUtils[Audio Utilities]
    AudioUtils -->|PCM Base64| LiveService[LiveSessionService]
    LiveService -->|WebSocket| Gemini[Google Gemini API]
    
    Gemini -->|PCM Base64| LiveService
    LiveService -->|Float32Array| Browser
    Browser -->|AudioBufferSource| Speaker[User Speakers]
    
    LiveService -->|Frequency Data| Visualizer[Canvas Visualizer]
    ReactUI[React App Component] -->|Control| LiveService
```

## 3. Core Modules

### 3.1 `App.tsx` (View Layer)
*   Manages the UI state (Settings open/close, Theme, Language selection).
*   Instantiates the `LiveSessionService`.
*   Handles user intents (Start/Stop session).

### 3.2 `services/liveSession.ts` (Controller Layer)
*   **Connection Management**: Initializes the `GoogleGenAI` client and manages the WebSocket lifecycle.
*   **Audio Pipeline**:
    *   *Input*: Captures `navigator.mediaDevices.getUserMedia`. Uses a `ScriptProcessorNode` to grab raw buffers.
    *   *Output*: Receives chunks from Gemini. Decodes them using `AudioContext.decodeAudioData` (wrapped to handle headerless PCM if necessary, though Gemini provides raw PCM).
    *   *Scheduling*: Maintains a `nextStartTime` cursor to ensure gapless playback of streaming audio chunks.

### 3.3 `utils/audioUtils.ts` (Utility Layer)
*   **`downsampleBuffer`**: Converts microphone input (usually 44.1kHz or 48kHz) to the 16kHz required by the model.
*   **`createPcmBlob`**: Converts Float32 audio data to Int16 PCM binary strings for transmission.
*   **`base64ToBytes` / `bytesToBase64`**: Helpers for data serialization.

## 4. Audio Handling Strategy

### Input (Microphone to API)
1.  Browser captures audio (Float32).
2.  Audio is downsampled to 16,000Hz.
3.  Converted to Int16 (16-bit depth).
4.  Base64 encoded and sent as `realtimeInput` via WebSocket.

### Output (API to Speaker)
1.  API sends `modelTurn` with Base64 PCM data.
2.  Data is converted to ArrayBuffer.
3.  Decoded into an `AudioBuffer`.
4.  Scheduled on the `AudioContext` timeline to play immediately after the previous chunk finishes.

## 5. State Management
*   **React State**: Used for UI flags (`isConnected`, `theme`, `language`).
*   **Refs (`useRef`)**: Used for the `LiveSessionService` instance to persist the connection across re-renders without triggering re-connections.

## 6. Security Considerations
*   **API Key**: The app expects `process.env.API_KEY`. In a production environment, this should be proxied or handled via a secure token exchange if the app is public, to prevent key leaking. For this demo, it relies on the build environment injection.
