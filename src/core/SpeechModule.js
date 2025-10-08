import { AudioCapture } from './AudioCapture.js';
import { DeepgramSTT } from './DeepgramSTT.js';
import { SimpleWakeWord } from './SimpleWakeWord.js';


export class SpeechModule {
  constructor(config, WakeWordClass = SimpleWakeWord) {
    this.config = config;
    this.audioCapture = new AudioCapture();
    this.deepgramSTT = new DeepgramSTT(config.deepgramApiKey, config);
    
    // Allow injection of different wake word detectors
    this.wakeWordDetector = new WakeWordClass(
      config.wakeWord, 
      config.sleepWord
    );
    
    this.isActive = false;
    this.isListening = false;
    this.mediaRecorder = null;
    
    this.onTranscriptUpdate = null;
    this.onStateChange = null;
  }

  async start() {
    try {
      const micSuccess = await this.audioCapture.initialize();
      if (!micSuccess) {
        throw new Error('Could not access microphone');
      }
      console.log('Testing microphone levels...');
    this.audioCapture.testMicrophoneLevel();
      await this.deepgramSTT.connect();

      // Debug: log every transcript received from Deepgram
      this.deepgramSTT.onTranscript = (text, isFinal) => {
        console.log('Received transcript:', text); // <-- added for debugging

        if (!this.isActive && this.wakeWordDetector.checkForWakeWord(text)) {
          this.isActive = true;
          this.onStateChange?.({ isActive: true });
          console.log('🎤 Wake word detected!');
        }

        if (this.isActive) {
          this.onTranscriptUpdate?.(text, isFinal);

          if (this.wakeWordDetector.checkForSleepWord(text)) {
            this.isActive = false;
            this.onStateChange?.({ isActive: false });
            console.log('😴 Sleep word detected!');
          }
        }
      };

      this.startAudioStreaming();
      this.isListening = true;
      this.onStateChange?.({ isListening: true });
    } catch (err) {
      console.error('SpeechModule start failed:', err);
      this.onStateChange?.({ isListening: false, isActive: false });
    }
  }

  startAudioStreaming() {
    const stream = this.audioCapture.getStream();
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

   let chunkCount = 0;
  this.mediaRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      chunkCount++;
      console.log(`📤 Sending audio chunk #${chunkCount}, size: ${event.data.size} bytes`); // Debug
      
      const arrayBuffer = await event.data.arrayBuffer();
      this.deepgramSTT.sendAudio(arrayBuffer);
    } else {
      console.warn('⚠️ Empty audio chunk received'); // Debug
    }
  };

    this.mediaRecorder.start(250);
  }

  stop() {
    this.mediaRecorder?.stop();
    this.mediaRecorder = null;
    this.audioCapture.stop();
    this.deepgramSTT.disconnect();
    
    this.isListening = false;
    this.isActive = false;
    
    this.onStateChange?.({ isListening: false, isActive: false });
  }
}
