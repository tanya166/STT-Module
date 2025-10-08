import { WakeWordDetector } from './WakeWordDetector.js';

export class SimpleWakeWord extends WakeWordDetector {
  checkForWakeWord(text) {
    const normalized = text.toLowerCase().trim();
    const regex = new RegExp(`\\b${this.wakeWord}\\b`, 'i');
    return regex.test(normalized);
  }

  checkForSleepWord(text) {
    const normalized = text.toLowerCase().trim();
    const regex = new RegExp(`\\b${this.sleepWord}\\b`, 'i');
    return regex.test(normalized);
  }
}