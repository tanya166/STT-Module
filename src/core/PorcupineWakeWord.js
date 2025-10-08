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
      console.log('   Access Key:', this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'Missing');
      console.log('   Model Path:', this.wakeWordModel);
      
      const keywordConfig = {
        publicPath: this.wakeWordModel,
        label: 'wake',
        sensitivity: 0.5
      };
      
      console.log('📋 Keyword config:', keywordConfig);
      
      // Create WITHOUT the model parameter (let it use defaults)
      // Pass keywords as array
      this.porcupineWorker = await PorcupineWorker.create(
        this.accessKey,
        [keywordConfig]  // Array of keywords
      );
      
      console.log('✅ Porcupine initialized successfully');
      console.log('   Frame length:', this.porcupineWorker.frameLength);
      console.log('   Sample rate:', this.porcupineWorker.sampleRate);
      console.log('   Version:', this.porcupineWorker.version);
      
      return true;
    } catch (error) {
      console.error('❌ Porcupine initialization failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      // Provide helpful debugging info
      if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
        console.error('💡 Model file not found. Check:');
        console.error('   1. File exists at: public' + this.wakeWordModel);
        console.error('   2. Path is correct in config.js');
        console.error('   3. Vite dev server is serving public files');
      } else if (error.message.includes('Invalid AccessKey') || error.message.includes('Unauthorized')) {
        console.error('💡 Access key issue. Check:');
        console.error('   1. AccessKey is valid and active');
        console.error('   2. AccessKey is copied correctly');
      }
      
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
      
      // Set up detection callback
      this.porcupineWorker.onmessage = (msg) => {
        console.log('📨 Porcupine worker message:', msg.data);
        
        if (msg.data.command === 'ppn-keyword') {
          // v3 uses 'keywordIndex' not 'keywordLabel'
          const keywordIndex = msg.data.keywordIndex;
          const label = msg.data.label || 'unknown';
          
          console.log(`🔔 Porcupine detected keyword!`);
          console.log(`   Index: ${keywordIndex}`);
          console.log(`   Label: ${label}`);
          
          // Since we only have one keyword (index 0), trigger wake word
          if (this.onWakeWordDetected) {
            console.log('🎤 Wake word detected by Porcupine! Activating...');
            this.onWakeWordDetected();
          }
        }
      };
      
      this.isListening = true;
      console.log('✅ Porcupine is now actively listening for wake words');
    } catch (error) {
      console.error('❌ Failed to start Porcupine:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isListening) return;
    
    try {
      console.log('🔇 Stopping Porcupine...');
      await WebVoiceProcessor.unsubscribe(this.porcupineWorker);
      this.isListening = false;
      console.log('✅ Porcupine stopped');
    } catch (error) {
      console.error('❌ Error stopping Porcupine:', error);
      throw error;
    }
  }

  async release() {
    console.log('🗑️ Releasing Porcupine resources...');
    await this.stop();
    
    if (this.porcupineWorker) {
      try {
        await this.porcupineWorker.release();
        this.porcupineWorker.terminate();
        this.porcupineWorker = null;
        console.log('✅ Porcupine worker released and terminated');
      } catch (error) {
        console.error('❌ Error releasing Porcupine:', error);
      }
    }
  }
  checkForWakeWord(text) {
    return false;
  }

  checkForSleepWord(text) {
    return false;
  }
}