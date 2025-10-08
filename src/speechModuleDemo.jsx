import { useSpeechModule } from './hooks/useSpeechModule';

function MyApp() {
  const { isListening, isActive, transcript, start, stop  , interimTranscript} = useSpeechModule({
    deepgramApiKey: '272226165d8d5eea138a68836a0762a5cedacede',
    wakeWord: 'hello',
    sleepWord: 'bye'
  });

  return (
    <div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <p>Status: {isActive ? 'Recording' : 'Waiting for wake word'}</p>
      <p>Transcript: {transcript}</p>
      {interimTranscript && (
                <span className="text-slate-400 italic">
                  {transcript && ' '}{interimTranscript}
                </span>
              )}
    </div>
  );
}
export default MyApp;
