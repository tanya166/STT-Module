import { AudioCapture } from '../core/AudioCapture.js';
import { DeepgramSTT } from '../core/DeepgramSTT.js';
import { SimpleWakeWord } from '../core/SimpleWakeWord.js';
import { SpeechModule } from '../core/SpeechModule.js';
import { PorcupineWakeWord } from '../core/PorcupineWakeWord.js';

export class useSpeechModule {
  constructor(config, WakeWordClass = null) {
    this.config = config;
    this.audioCapture = new AudioCapture();
    this.deepgramSTT = new DeepgramSTT(config.deepgramApiKey, config);
    

    this.usePorcupine = config.usePorcupine && config.porcupineAccessKey && config.wakeWordModel;
    
    if (this.usePorcupine) {
      
      this.porcupineDetector = new PorcupineWakeWord(
        config.wakeWord,
        config.porcupineAccessKey,
        config.wakeWordModel
      );
      
      // Simple text matching for sleep word
      this.simpleDetector = new SimpleWakeWord(null, config.sleepWord);
    } else {
      // Fallback: Simple text matching for both
      this.simpleDetector = new SimpleWakeWord(
        config.wakeWord,
        config.sleepWord
      );
    }
    
    this.isActive = false;
    this.isListening = false;
    this.mediaRecorder = null;
    
    this.onTranscriptUpdate = null;
    this.onStateChange = null;
  }

  async start() {
    try {
      console.log('🚀 Starting Speech Module...');
      console.log(`📋 Strategy: Porcupine wake word + Text matching sleep word`);
      
      // Initialize microphone
      const micSuccess = await this.audioCapture.initialize();
      if (!micSuccess) {
        throw new Error('Could not access microphone');
      }

      // If using Porcupine for wake word
      if (this.usePorcupine) {
        await this.porcupineDetector.initialize();
        
        // Set up Porcupine wake word callback
        this.porcupineDetector.onWakeWordDetected = () => {
          this.isActive = true;
          if (this.onStateChange) this.onStateChange({ isActive: true });
          console.log('🎤 Wake word detected by Porcupine! Transcription ACTIVE');
        };
        
        // Start Porcupine listening
        await this.porcupineDetector.start();
      }

      // Connect to Deepgram (always needed for transcription)
      await this.deepgramSTT.connect();

      // Set up transcript handler
      this.deepgramSTT.onTranscript = (text, isFinal) => {
        // Only log transcripts when active to reduce noise
        if (this.isActive || !this.usePorcupine) {
          console.log('Received transcript:', text);
        }

        // Wake word detection from text (if NOT using Porcupine)
        if (!this.usePorcupine && !this.isActive) {
          if (this.simpleDetector.checkForWakeWord(text)) {
            this.isActive = true;
            if (this.onStateChange) this.onStateChange({ isActive: true });
            console.log('🎤 Wake word detected by text matching! Transcription ACTIVE');
          }
        }

        // If active, emit transcripts
        if (this.isActive) {
          if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate(text, isFinal);
          }

          // ALWAYS use text matching for sleep word (Option 1)
          if (this.simpleDetector.checkForSleepWord(text)) {
            this.isActive = false;
            if (this.onStateChange) this.onStateChange({ isActive: false });
            console.log('😴 Sleep word detected by text matching! Transcription PAUSED');
          }
        }
      };

      // Start streaming audio to Deepgram
      this.startAudioStreaming();
      this.isListening = true;
      if (this.onStateChange) this.onStateChange({ isListening: true });
      
      console.log(`✅ Speech Module ready`);
    } catch (err) {
      console.error('SpeechModule start failed:', err);
      this.onStateChange?.({ isListening: false, isActive: false });
      throw err;
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
        // Only log occasionally to reduce noise
        if (chunkCount % 20 === 0) {
          console.log(`📤 Sent ${chunkCount} audio chunks to Deepgram`);
        }
        
        const arrayBuffer = await event.data.arrayBuffer();
        this.deepgramSTT.sendAudio(arrayBuffer);
      }
    };

    this.mediaRecorder.start(250);
  }

  async stop() {
    console.log('🛑 Stopping Speech Module...');
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    this.audioCapture.stop();
    this.deepgramSTT.disconnect();
    
    // Stop Porcupine if using it
    if (this.usePorcupine && this.porcupineDetector) {
      await this.porcupineDetector.release();
    }
    
    this.isListening = false;
    this.isActive = false;
    
    if (this.onStateChange) {
      this.onStateChange({ isListening: false, isActive: false });
    }
    
    console.log('✅ Speech Module stopped');
  }
}