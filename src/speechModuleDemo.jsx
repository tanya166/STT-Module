import { useEffect, useState } from 'react';
import { useSpeechModule } from './hooks/useSpeechModule'; 
import { config } from './core/config.js';

function MyApp() {
  const [usespeechModule] = useState(() => new useSpeechModule(config));
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    usespeechModule.onStateChange = ({ isActive, isListening }) => {
      if (isActive !== undefined) setIsActive(isActive);
      if (isListening !== undefined) setIsListening(isListening);
    };

    usespeechModule.onTranscriptUpdate = (text, isFinal) => {
      if (isFinal) {
        setTranscript(prev => prev + ' ' + text);
        setInterimTranscript('');
      } else {
        setInterimTranscript(text);
      }
    };


    return () => {
      usespeechModule.stop();
    };
  }, [usespeechModule]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Speech Module Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => usespeechModule.start()}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            fontSize: '16px',
            backgroundColor: isListening ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isListening ? 'not-allowed' : 'pointer'
          }}
          disabled={isListening}
        >
          Start Listening
        </button>
        <button 
          onClick={() => usespeechModule.stop()}
          style={{ 
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: !isListening ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isListening ? 'not-allowed' : 'pointer'
          }}
          disabled={!isListening}
        >
          Stop
        </button>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '10px'
      }}>
        <strong>Status:</strong> 
        <span style={{ 
          marginLeft: '10px',
          padding: '5px 10px',
          borderRadius: '4px',
          backgroundColor: isActive ? '#4CAF50' : '#ff9800',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {isListening ? (isActive ? '🎤 RECORDING' : '⏸️ Waiting for wake word...') : '❌ Stopped'}
        </span>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff', 
        border: '1px solid #ddd',
        borderRadius: '8px',
        minHeight: '100px'
      }}>
        <strong>Transcript:</strong>
        <p style={{ marginTop: '10px', fontSize: '16px', lineHeight: '1.6' }}>
          {transcript}
          {interimTranscript && (
            <span style={{ color: '#888', fontStyle: 'italic' }}>
              {transcript && ' '}
              {interimTranscript}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default MyApp;