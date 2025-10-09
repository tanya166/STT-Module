import { useEffect, useState } from 'react';
import { useSpeechModule } from './hooks/useSpeechModule'; 
import { config } from './core/config.js';
import './speechModuleDemo.css';

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
    <div className="speech-container">
      <div className="speech-wrapper">
        
        {/* Header */}
        <div className="speech-header">
          <h1 className="speech-title">Speech Module</h1>
          <p className="speech-subtitle">Voice-activated transcription</p>
        </div>

        {/* Control Card */}
        <div className="control-card">
          
          {/* Buttons */}
          <div className="button-group">
            <button 
              onClick={() => usespeechModule.start()}
              disabled={isListening}
              className={`btn ${isListening ? '' : 'btn-start'}`}
            >
              Start Listening
            </button>
            
            <button 
              onClick={() => usespeechModule.stop()}
              disabled={!isListening}
              className={`btn ${!isListening ? '' : 'btn-stop'}`}
            >
              Stop
            </button>
          </div>

          {/* Status */}
          <div className="status-container">
            {isListening ? (
              isActive ? (
                <>
                  <span className="status-dot status-dot-recording"></span>
                  <span className="status-text status-text-recording">Recording</span>
                </>
              ) : (
                <>
                  <span className="status-dot status-dot-waiting"></span>
                  <span className="status-text status-text-waiting">
                    Waiting for "{config.wakeWord}"
                  </span>
                </>
              )
            ) : (
              <>
                <span className="status-dot status-dot-stopped"></span>
                <span className="status-text status-text-stopped">Stopped</span>
              </>
            )}
          </div>
        </div>

        {/* Transcript Card */}
        <div className="transcript-card">
          <h2 className="transcript-header">
            <span>📝</span> Transcript
          </h2>
          
          <div className="transcript-content">
            {transcript || interimTranscript ? (
              <p className="transcript-text">
                {transcript}
                {interimTranscript && (
                  <span className="transcript-interim">
                    {transcript && ' '}
                    {interimTranscript}
                  </span>
                )}
              </p>
            ) : (
              <div className="transcript-empty">
                <div className="transcript-empty-icon">🎤</div>
                <p className="transcript-empty-text">
                  {isListening 
                    ? isActive 
                      ? 'Start speaking...' 
                      : `Say "${config.wakeWord}" to begin`
                    : 'Click "Start Listening" to begin'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default MyApp;