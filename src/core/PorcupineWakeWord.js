import { WakeWordDetector } from './WakeWordDetector.js';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

export class PorcupineWakeWord extends WakeWordDetector {
  constructor(wakeWord, accessKey, wakeWordModel) {
    super(wakeWord, null); // No sleep word for Porcupine
    this.accessKey = accessKey;
    this.wakeWordModel = wakeWordModel; // .ppn file for wake word ONLY
    this.porcupineWorker = null;
    this.isListening = false;
    
    // Callback for wake word only
    this.onWakeWordDetected = null;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Porcupine for WAKE WORD ONLY...');
      
      // Create Porcupine worker with ONLY the wake word model
      this.porcupineWorker = await PorcupineWorker.create(
        this.accessKey,
        [{
          publicPath: this.wakeWordModel,
          label: 'wake',
          sensitivity: 0.5 // 0-1, higher = more sensitive but more false positives
        }]
      );
      
      console.log('✅ Porcupine initialized (wake word only)');
      return true;
    } catch (error) {
      console.error('❌ Porcupine initialization failed:', error);
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

  // These methods are for compatibility with SimpleWakeWord interface
  // but Porcupine doesn't use text, it uses audio directly
  // They're here so the class can be swapped with SimpleWakeWord if needed
  checkForWakeWord(text) {
    // Not used with Porcupine - detection happens in real-time via callbacks
    // But return false for compatibility
    return false;
  }

  checkForSleepWord(text) {
    // Not used with Porcupine - detection happens in real-time via callbacks
    // But return false for compatibility
    return false;
  }
}