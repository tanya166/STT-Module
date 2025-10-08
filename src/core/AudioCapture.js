export class AudioCapture {
  constructor() {
    this.stream = null;
    this.mediaRecorder = null;
  }

  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      console.log('✅ Microphone initialized');
    console.log('Audio tracks:', this.stream.getAudioTracks());
    console.log('Track settings:', this.stream.getAudioTracks()[0].getSettings());
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }
// Add this method to your AudioCapture class
testMicrophoneLevel() {
  if (!this.stream) {
    console.log('❌ Stream not initialized');
    return;
  }
  
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(this.stream);
  microphone.connect(analyser);
  
  analyser.fftSize = 256;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  console.log('🎤 Starting microphone level test... (will check for 10 seconds)');
  console.log('   Speak into your microphone now!');
  
  let checkCount = 0;
  const intervalId = setInterval(() => {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const level = Math.round(average);
    
    // Visual bar
    const bar = '█'.repeat(Math.floor(level / 5));
    
    if (level > 0) {
      console.log(`🎤 Level: ${level.toString().padStart(3)}/255 ${bar}`);
      
      if (level < 5) {
        console.log('   ⚠️ Very quiet - mic might not be working or you need to speak louder');
      } else if (level < 20) {
        console.log('   📢 Quiet - try speaking louder');
      } else {
        console.log('   ✅ Good audio level!');
      }
    } else {
      console.log(`🎤 Level: 0/255 (silence)`);
    }
    
    checkCount++;
    if (checkCount >= 10) {
      clearInterval(intervalId);
      console.log('🎤 Microphone test complete');
      audioContext.close();
    }
  }, 1000);
}
  getStream() {
    return this.stream;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}