import { WakeWordDetector } from './WakeWordDetector.js';

export class SimpleWakeWord extends WakeWordDetector {
  checkForWakeWord(text) {
    if (!this.wakeWord) {
      console.log('⚠️ No wake word configured!');
      return false;
    }
    
    // Remove punctuation and normalize
    const normalized = text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const wakeWordNormalized = this.wakeWord.toLowerCase().trim();
    
    console.log(`   Normalized text: "${normalized}"`);
    console.log(`   Looking for: "${wakeWordNormalized}"`);
    
    // Check if wake word is contained in the text
    const found = normalized.includes(wakeWordNormalized);
    console.log(`   Match result: ${found}`);
    
    return found;
  }

  checkForSleepWord(text) {
    if (!this.sleepWord) {
      console.log('⚠️ No sleep word configured!');
      return false;
    }
    
    // Remove punctuation and normalize
    const normalized = text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const sleepWordNormalized = this.sleepWord.toLowerCase().trim();
    
    console.log(`   Normalized text: "${normalized}"`);
    console.log(`   Looking for: "${sleepWordNormalized}"`);
    
    // Check if sleep word is contained in the text
    const found = normalized.includes(sleepWordNormalized);
    console.log(`   Match result: ${found}`);
    
    return found;
  }
}