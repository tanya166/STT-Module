import { WakeWordDetector } from './WakeWordDetector.js';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

export class PorcupineWakeWord extends WakeWordDetector {
  constructor(wakeWord, accessKey, wakeWordModel) {
    super(wakeWord, null); 
    this.accessKey = accessKey;
    this.wakeWordModel = wakeWordModel; 
    this.porcupineWorker = null;
    this.isListening = false;
    this.onWakeWordDetected = null;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Porcupine for WAKE WORD ONLY...');
      
      // Create Porcupine worker with ONLY the wake word model
      // Note: You need to provide the full path or use base64 for custom models
      this.porcupineWorker = await PorcupineWorker.create(
        this.accessKey,
        [{
          publicPath: this.wakeWordModel,
          label: 'wake',
          sensitivity: 0.5,
          // Add this if you're having issues with custom models
          customWritePath: 'porcupine_model'
        }],
        // Optional: Specify model path
        {
          publicPath: '/porcupine_params.pv', // Path to base Porcupine model
          // Or use customWritePath if bundling differently
          customWritePath: 'porcupine_params'
        }
      );
      
      console.log('✅ Porcupine initialized (wake word only)');
      return true;
    } catch (error) {
      console.error('❌ Porcupine initialization failed:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  async start() {
    if (this.isListening) {
      console.warn('⚠️ Porcupine is already listening');
      return;
    }
    
    try {
      console.log('🎤 Starting Porcupine wake word detection...');
      
      // Start listening for wake words
      await WebVoiceProcessor.subscribe(this.porcupineWorker);
      
      // Set up detection callback - ONLY for wake word
      this.porcupineWorker.onmessage = (msg) => {
        if (msg.data.command === 'ppn-keyword') {
          const label = msg.data.keywordLabel;
          
          console.log(`🔔 Porcupine detected: ${label}`);
          
          if (label === 'wake' && this.onWakeWordDetected) {
            console.log('🎤 Wake word detected by Porcupine!');
            this.onWakeWordDetected();
          }
        }
      };
      
      this.isListening = true;
      console.log('✅ Porcupine listening for wake words');
    } catch (error) {
      console.error('❌ Failed to start Porcupine:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isListening) return;
    
    try {
      await WebVoiceProcessor.unsubscribe(this.porcupineWorker);
      this.isListening = false;
      console.log('🔇 Porcupine stopped');
    } catch (error) {
      console.error('Error stopping Porcupine:', error);
    }
  }

  async release() {
    await this.stop();
    if (this.porcupineWorker) {
      this.porcupineWorker.terminate();
      this.porcupineWorker = null;
      console.log('🗑️ Porcupine worker terminated');
    }
  }

  checkForWakeWord(text) {
    return false;
  }

  checkForSleepWord(text) {
    return false;
  }
}