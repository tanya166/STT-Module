import { useState, useEffect, useRef } from 'react';
import { SpeechModule } from '../core/SpeechModule.js';
import { DeepgramSTT } from '../core/DeepgramSTT.js';

export const useSpeechModule = (config) => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState(''); // ← Add this
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  
  const moduleRef = useRef(null);
  const transcriptHistoryRef = useRef([]);

  useEffect(() => {
    moduleRef.current = new SpeechModule(config);

    // ← Update this callback
    moduleRef.current.onTranscriptUpdate = (text, isFinal) => {
      if (isFinal) {
        // Final result - add to history
        transcriptHistoryRef.current.push(text);
        setTranscript(transcriptHistoryRef.current.join(' '));
        setInterimTranscript(''); // Clear interim
      } else {
        // Interim result - show in real-time
        setInterimTranscript(text);
      }
    };

    moduleRef.current.onStateChange = (state) => {
      if ('isListening' in state) setIsListening(state.isListening);
      if ('isActive' in state) {
        setIsActive(state.isActive);
        if (state.isActive) {
          transcriptHistoryRef.current = [];
          setTranscript('');
          setInterimTranscript(''); // ← Clear interim too
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
    setInterimTranscript(''); // ← Clear interim too
    setConnectionStatus('idle');
  };

  return {
    isListening,
    isActive,
    transcript,
    interimTranscript, // ← Export interim transcript
    error,
    connectionStatus,
    start,
    stop,
    testConnection
  };
};