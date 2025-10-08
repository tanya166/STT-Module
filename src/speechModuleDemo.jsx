import { useEffect, useState } from 'react';
import { useSpeechModule } from './core/SpeechModule'; // class
import { config } from './core/config.js';

function MyApp() {
  const [usespeechModule] = useState(() => new useSpeechModule(config));
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    // Subscribe to state updates
    usespeechModule.onStateChange = ({ isActive, isListening }) => {
      setIsActive(isActive);
      setIsListening(isListening);
    };

    // Subscribe to transcript updates
    usespeechModule.onTranscriptUpdate = (text) => {
      setTranscript(text);
    };

    // Optional: cleanup on unmount
    return () => {
      usespeechModule.stop();
    };
  }, [usespeechModule]);

  return (
    <div>
      <button onClick={() => usespeechModule.start()}>Start</button>
      <button onClick={() => usespeechModule.stop()}>Stop</button>

      <p>Status: {isActive ? 'Recording' : 'Waiting for wake word'}</p>
      <p>Transcript: {transcript}</p>

      {interimTranscript && (
        <span className="text-slate-400 italic">
          {transcript && ' '}
          {interimTranscript}
        </span>
      )}
    </div>
  );
}

export default MyApp;
