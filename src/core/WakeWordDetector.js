export class WakeWordDetector {
  constructor(wakeWord, sleepWord) {
    this.wakeWord = wakeWord.toLowerCase();
    this.sleepWord = sleepWord.toLowerCase();
  }

  checkForWakeWord(data) {
    throw new Error('Must implement checkForWakeWord');
  }

  checkForSleepWord(data) {
    throw new Error('Must implement checkForSleepWord');
  }
}