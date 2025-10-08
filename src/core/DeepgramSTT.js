export class DeepgramSTT {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.options = options;
    this.socket = null;
    this.isConnected = false;
    this.onTranscript = null;
    this.onError = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = `wss://api.deepgram.com/v1/listen?${new URLSearchParams({
        model: this.options.model || 'nova-2',
        language: this.options.language || 'en-US',
        punctuate: this.options.punctuate !== false,
        interim_results: this.options.interimResults !== false,
      })}`;

      this.socket = new WebSocket(url, ['token', this.apiKey]);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('Deepgram connected');
        resolve();
      };

      this.socket.onmessage = (event) => {
        //event handler that runs everytime deepgram  send a new message
        const data = JSON.parse(event.data);
         console.log('📥 Deepgram message:', data)
        //optional chaining 
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final;
          if (transcript && this.onTranscript) {
            console.log(transcript);
            this.onTranscript(transcript, isFinal);
          }
        }
      };

      this.socket.onerror = (error) => {
        console.error('Deepgram error:', error);
        if (this.onError) this.onError(error);
        reject(error);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('Deepgram disconnected');
      };
    });
  }

  sendAudio(audioData) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(audioData);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}