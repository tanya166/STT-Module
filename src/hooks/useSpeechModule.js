import { AudioCapture } from '../core/AudioCapture.js';
import { DeepgramSTT } from '../core/DeepgramSTT.js';
import { SimpleWakeWord } from '../core/simpleWakeWord.js';

export class useSpeechModule {
  constructor(config) {
    this.config = config;
    this.audioCapture = new AudioCapture();
    this.deepgramSTT = new DeepgramSTT(config.deepgramApiKey, config);
    
    // Only use SimpleWakeWord for both wake and sleep detection
    this.wakeWordDetector = new SimpleWakeWord(config.wakeWord, config.sleepWord);
    
    this.isActive = false;
    this.isListening = false;
    this.mediaRecorder = null;
    this.onTranscriptUpdate = null;
    this.onStateChange = null;
  }

  async start() {
    try {
      console.log('🚀 Starting Speech Module...');
      console.log(`📋 Using simple text-based wake/sleep word detection`);
      console.log(`   Wake word: "${this.config.wakeWord}"`);
      console.log(`   Sleep word: "${this.config.sleepWord}"`);
      
      // Initialize microphone
      const micSuccess = await this.audioCapture.initialize();
      if (!micSuccess) {
        throw new Error('Could not access microphone');
      }

      console.log('Testing microphone levels...');
      this.audioCapture.testMicrophoneLevel();

      // Connect to Deepgram
      await this.deepgramSTT.connect();

      // Set up transcript handler
      this.deepgramSTT.onTranscript = (text, isFinal) => {
        console.log(`📝 Transcript (${isFinal ? 'FINAL' : 'interim'}): "${text}"`);

        // Check for wake word when not active
        if (!this.isActive) {
          const foundWakeWord = this.wakeWordDetector.checkForWakeWord(text);
          if (foundWakeWord) {
            this.isActive = true;
            if (this.onStateChange) this.onStateChange({ isActive: true });
            console.log('🎤 Wake word detected! Transcription ACTIVE');
          }
        }

        // If active, emit transcripts and check for sleep word
        if (this.isActive) {
          if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate(text, isFinal);
          }

          // Check for sleep word
          if (this.wakeWordDetector.checkForSleepWord(text)) {
            this.isActive = false;
            if (this.onStateChange) this.onStateChange({ isActive: false });
            console.log('😴 Sleep word detected! Transcription PAUSED');
          }
        }
      };

      // Start streaming audio to Deepgram
      this.startAudioStreaming();
      this.isListening = true;
      if (this.onStateChange) this.onStateChange({ isListening: true });
      
      console.log('✅ Speech Module ready - say wake word to start recording');
    } catch (err) {
      console.error('❌ SpeechModule start failed:', err);
      if (this.onStateChange) {
        this.onStateChange({ isListening: false, isActive: false });
      }
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
        // Only log occasionally to reduce console noise
        if (chunkCount % 20 === 0) {
          console.log(`📤 Sent ${chunkCount} audio chunks to Deepgram`);
        }
        
        const arrayBuffer = await event.data.arrayBuffer();
        this.deepgramSTT.sendAudio(arrayBuffer);
      }
    };

    this.mediaRecorder.start(250);
    console.log('🎙️ Audio streaming started');
  }

  async stop() {
    console.log('🛑 Stopping Speech Module...');
    
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
    
    console.log('✅ Speech Module stopped');
  }
}