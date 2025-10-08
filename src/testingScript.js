import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, Loader } from 'lucide-react';

// ==================== CONFIGURATION ====================
const CONFIG = {
  deepgramApiKey: 'YOUR_DEEPGRAM_API_KEY_HERE', // Replace with your key
  wakeWord: 'hi',
  sleepWord: 'bye',
  language: 'en-US',
  model: 'nova-2',
  punctuate: true,
  interimResults: true
};

// ==================== CORE: AudioCapture ====================
class AudioCapture {
  constructor() {
    this.stream = null;
    this.mediaRecorder = null;
  }

  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }

  getStream() {
    return this.stream;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

// ==================== CORE: WakeWordDetector (Interface) ====================
// This is the interface that both Simple and Porcupine will implement
class WakeWordDetector {
  constructor(wakeWord, sleepWord) {
    this.wakeWord = wakeWord.toLowerCase();
    this.sleepWord = sleepWord.toLowerCase();
  }

  // Override this in implementations
  checkForWakeWord(text) {
    throw new Error('Must implement checkForWakeWord');
  }

  checkForSleepWord(text) {
    throw new Error('Must implement checkForSleepWord');
  }
}

// ==================== CORE: SimpleWakeWord (Text Matching) ====================
class SimpleWakeWord extends WakeWordDetector {
  checkForWakeWord(text) {
    const normalized = text.toLowerCase().trim();
    // Check if wake word appears as a complete word
    const regex = new RegExp(`\\b${this.wakeWord}\\b`, 'i');
    return regex.test(normalized);
  }

  checkForSleepWord(text) {
    const normalized = text.toLowerCase().trim();
    const regex = new RegExp(`\\b${this.sleepWord}\\b`, 'i');
    return regex.test(normalized);
  }
}

// ==================== CORE: PorcupineWakeWord (Stub for Phase 2) ====================
class PorcupineWakeWord extends WakeWordDetector {
  constructor(wakeWord, sleepWord) {
    super(wakeWord, sleepWord);
    this.porcupineManager = null;
    // TODO: Initialize Porcupine in Phase 2
  }

  async initialize() {
    // TODO: Set up Porcupine with access key and wake word models
    console.log('Porcupine initialization - coming in Phase 2');
  }

  checkForWakeWord(audioData) {
    // TODO: Process audio through Porcupine
    // This will process raw audio, not text
    return false;
  }

  checkForSleepWord(audioData) {
    // TODO: Process audio through Porcupine
    return false;
  }
}

// ==================== CORE: DeepgramSTT ====================
class DeepgramSTT {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.options = options;
    this.socket = null;
    this.isConnected = false;
    this.onTranscript = null;
    this.onError = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Validate API key first
      if (!this.apiKey || this.apiKey === 'YOUR_DEEPGRAM_API_KEY_HERE') {
        reject(new Error('Invalid Deepgram API key. Please set your API key in CONFIG.'));
        return;
      }

      const params = new URLSearchParams({
        model: this.options.model || 'nova-2',
        language: this.options.language || 'en-US',
        punctuate: String(this.options.punctuate !== false),
        interim_results: String(this.options.interimResults !== false),
        encoding: 'linear16',
        sample_rate: '16000'
      });

      const url = `wss://api.deepgram.com/v1/listen?${params}`;

      console.log('🔌 Attempting Deepgram connection...');
      console.log('📍 URL:', url.split('?')[0]);
      console.log('🔑 API Key preview:', this.apiKey.substring(0, 10) + '...' + this.apiKey.substring(this.apiKey.length - 4));
      console.log('📊 Params:', Object.fromEntries(params));

      try {
        // Create WebSocket with authorization token using Sec-WebSocket-Protocol
        this.socket = new WebSocket(url, ['token', this.apiKey]);
        this.socket.binaryType = 'arraybuffer';

        // Add timeout
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error('❌ Connection timeout after 10 seconds');
            this.socket.close();
            reject(new Error('Connection timeout. Possible issues: 1) Invalid API key, 2) Network firewall blocking WebSocket, 3) No Deepgram credits'));
          }
        }, 10000);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          console.log('✅ Deepgram connected successfully!');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle errors from Deepgram
            if (data.type === 'Error') {
              console.error('❌ Deepgram API Error:', data);
              if (this.onError) this.onError(new Error(data.message || 'Deepgram API error'));
              return;
            }
            
            if (data.channel?.alternatives?.[0]) {
              const transcript = data.channel.alternatives[0].transcript;
              const isFinal = data.is_final;
              if (transcript && this.onTranscript) {
                this.onTranscript(transcript, isFinal);
              }
            }
          } catch (err) {
            console.error('Error parsing Deepgram message:', err);
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Deepgram WebSocket error:', error);
          console.error('📝 Troubleshooting:');
          console.error('   1. Verify API key at: https://console.deepgram.com/');
          console.error('   2. Check you have credits: https://console.deepgram.com/billing');
          console.error('   3. Try in incognito mode (browser extensions can block WebSockets)');
          console.error('   4. Check if firewall/VPN is blocking wss:// connections');
          
          if (this.onError) this.onError(error);
          reject(new Error('WebSocket connection failed - see console for troubleshooting steps'));
        };

        this.socket.onclose = (event) => {
          clearTimeout(timeout);
          this.isConnected = false;
          console.log('🔌 Deepgram disconnected');
          console.log('   Code:', event.code, 'Reason:', event.reason || 'No reason provided');
          
          // Specific close codes
          if (event.code === 1002) {
            console.error('❌ Protocol error - likely invalid API key format');
          } else if (event.code === 1008) {
            console.error('❌ Policy violation - API key might be invalid or expired');
          }
        };

      } catch (err) {
        console.error('❌ Failed to create WebSocket:', err);
        reject(err);
      }
    });
  }

  sendAudio(audioData) {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(audioData);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// ==================== CORE: SpeechModule (Main Orchestrator) ====================
class SpeechModule {
  constructor(config) {
    this.config = config;
    this.audioCapture = new AudioCapture();
    this.deepgramSTT = new DeepgramSTT(config.deepgramApiKey, config);
    
    // Use SimpleWakeWord for now, easily swap to Porcupine later
    this.wakeWordDetector = new SimpleWakeWord(config.wakeWord, config.sleepWord);
    
    this.isActive = false; // Transcription active
    this.isListening = false; // Microphone active
    this.mediaRecorder = null;
    
    // Callbacks
    this.onTranscriptUpdate = null;
    this.onStateChange = null;
  }

  async start() {
    // Initialize microphone
    const micSuccess = await this.audioCapture.initialize();
    if (!micSuccess) {
      throw new Error('Could not access microphone');
    }

    // Connect to Deepgram
    await this.deepgramSTT.connect();

    // Set up transcript handler
    this.deepgramSTT.onTranscript = (text, isFinal) => {
      // Always check for wake/sleep words
      if (!this.isActive && this.wakeWordDetector.checkForWakeWord(text)) {
        this.isActive = true;
        if (this.onStateChange) this.onStateChange({ isActive: true });
        console.log('🎤 Wake word detected! Transcription ACTIVE');
      }

      // If active, emit transcripts and check for sleep word
      if (this.isActive) {
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(text, isFinal);
        }

        if (this.wakeWordDetector.checkForSleepWord(text)) {
          this.isActive = false;
          if (this.onStateChange) this.onStateChange({ isActive: false });
          console.log('😴 Sleep word detected! Transcription PAUSED');
        }
      }
    };

    // Start streaming audio
    this.startAudioStreaming();
    this.isListening = true;
    if (this.onStateChange) this.onStateChange({ isListening: true });
  }

  startAudioStreaming() {
    const stream = this.audioCapture.getStream();
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        // Convert to the format Deepgram expects
        const arrayBuffer = await event.data.arrayBuffer();
        this.deepgramSTT.sendAudio(arrayBuffer);
      }
    };

    // Send data every 250ms for real-time
    this.mediaRecorder.start(250);
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    this.audioCapture.stop();
    this.deepgramSTT.disconnect();
    
    this.isListening = false;
    this.isActive = false;
    
    if (this.onStateChange) {
      this.onStateChange({ isListening: false, isActive: false });
    }
  }
}

// ==================== REACT HOOK ====================
const useSpeechModule = (config) => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, testing, connected, failed
  
  const moduleRef = useRef(null);
  const transcriptHistoryRef = useRef([]);

  useEffect(() => {
    // Initialize module
    moduleRef.current = new SpeechModule(config);

    // Set up callbacks
    moduleRef.current.onTranscriptUpdate = (text, isFinal) => {
      if (isFinal) {
        transcriptHistoryRef.current.push(text);
        setTranscript(transcriptHistoryRef.current.join(' '));
      }
    };

    moduleRef.current.onStateChange = (state) => {
      if ('isListening' in state) setIsListening(state.isListening);
      if ('isActive' in state) {
        setIsActive(state.isActive);
        if (state.isActive) {
          // Clear transcript when waking up
          transcriptHistoryRef.current = [];
          setTranscript('');
        }
      }
    };

    return () => {
      if (moduleRef.current) {
        moduleRef.current.stop();
      }
    };
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const testSTT = new DeepgramSTT(config.deepgramApiKey, config);
      await testSTT.connect();
      testSTT.disconnect();
      setConnectionStatus('connected');
      return true;
    } catch (err) {
      setError(err.message);
      setConnectionStatus('failed');
      return false;
    }
  };

  const start = async () => {
    try {
      setError(null);
      setConnectionStatus('testing');
      await moduleRef.current.start();
      setConnectionStatus('connected');
    } catch (err) {
      setError(err.message);
      setConnectionStatus('failed');
      console.error('Failed to start:', err);
    }
  };

  const stop = () => {
    moduleRef.current.stop();
    transcriptHistoryRef.current = [];
    setTranscript('');
    setConnectionStatus('idle');
  };

  return {
    isListening,
    isActive,
    transcript,
    error,
    connectionStatus,
    start,
    stop,
    testConnection
  };
};

// ==================== DEMO COMPONENT ====================
export default function SpeechModuleDemo() {
  const { isListening, isActive, transcript, error, start, stop } = useSpeechModule(CONFIG);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Speech Module Demo</h1>
          <p className="text-slate-400">
            Say "{CONFIG.wakeWord}" to start • Say "{CONFIG.sleepWord}" to pause
          </p>
        </div>

        {/* API Key Warning */}
        {CONFIG.deepgramApiKey === 'YOUR_DEEPGRAM_API_KEY_HERE' && (
          <div className="bg-amber-900/50 border border-amber-600 rounded-lg p-4 mb-6">
            <p className="font-semibold">⚠️ Set your Deepgram API key</p>
            <p className="text-sm mt-1">Edit CONFIG.deepgramApiKey in the code above</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={start}
            disabled={isListening}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Mic size={20} />
            Start Listening
          </button>
          <button
            onClick={stop}
            disabled={!isListening}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <MicOff size={20} />
            Stop
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            isListening 
              ? 'bg-green-900/30 border-green-600' 
              : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isListening ? <Activity className="animate-pulse" size={20} /> : <MicOff size={20} />}
              <span className="font-semibold">Microphone</span>
            </div>
            <p className="text-sm text-slate-400">
              {isListening ? 'Listening for wake word...' : 'Not listening'}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 transition-colors ${
            isActive 
              ? 'bg-blue-900/30 border-blue-600' 
              : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isActive ? <Loader className="animate-spin" size={20} /> : <Activity size={20} />}
              <span className="font-semibold">Transcription</span>
            </div>
            <p className="text-sm text-slate-400">
              {isActive ? 'ACTIVE - Recording speech' : 'Paused'}
            </p>
          </div>
        </div>

        {/* Transcript Display */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-h-[200px]">
          <h2 className="text-xl font-semibold mb-4">Transcript</h2>
          {transcript ? (
            <p className="text-slate-200 text-lg leading-relaxed">{transcript}</p>
          ) : (
            <p className="text-slate-500 italic">
              {isListening 
                ? `Waiting for wake word "${CONFIG.wakeWord}"...` 
                : 'Click "Start Listening" to begin'}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
            <li>Click "Start Listening" to activate the microphone</li>
            <li>Say the wake word "{CONFIG.wakeWord}" to start transcription</li>
            <li>Speak normally - your speech will be transcribed in real-time</li>
            <li>Say the sleep word "{CONFIG.sleepWord}" to pause transcription</li>
            <li>Repeat wake/sleep words as needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
}