export class WakeWordDetector {
  constructor(wakeWord, sleepWord) {
   this.wakeWord =wakeWord ? wakeWord.toLowerCase() : null;
   this.sleepWord = sleepWord ? sleepWord.toLowerCase() : null;
  }

  checkForWakeWord(data) {
    throw new Error('Must implement checkForWakeWord');
  }

  checkForSleepWord(data) {
    throw new Error('Must implement checkForSleepWord');
  }
}