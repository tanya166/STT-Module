# Speech Module - Web Application

I have also implemented a mobile-version (app) of the application (using react native ) - https://github.com/tanya166/STT-mobile

Note - I also tried using Porcupine (a wake word detection tool), but it wasn’t flexible enough — it allows two-word phrases or more like “Hey Siri” or “OK Google”. I wanted simple words like “hello” to start and “bye” to stop. So instead of Porcupine, I used an easier method: I checked the transcribed text from Deepgram and applied string matching technique. 

## 🚀 Features

- Real-time speech-to-text transcription in browser
- Wake word activation ("hello" to start recording)
- Sleep word deactivation ("bye" to pause recording)
- Powered by Deepgram AI

## 📋 Prerequisites

- Node.js 18+ 
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Microphone access

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd speech-wake-module
npm install
```

### 2. Configure Deepgram API Key

Open `src/core/config.js` and replace the API key:

```javascript
export const config = {
  deepgramApiKey: 'YOUR_API_KEY_HERE',  // Get from https://console.deepgram.com/
  wakeWord: 'hello',
  sleepWord: 'bye',
  // ...
};
```

### 3. Run Development Server

```bash
npm run dev
```

The app will automatically open at `http://localhost:3000`

## 📱 Usage

1. Click **"Start Listening"** to begin
2. Grant microphone permission when prompted
3. Say **"hello"** to activate recording
4. Speak your text (transcription appears in real-time)
5. Say **"bye"** to pause recording
6. Click **"Stop"** when finished

### Status Indicators

- 🔴 **Recording** (green pulsing) - Actively transcribing your speech
- 🟡 **Waiting** (amber pulsing) - Listening for wake word
- ⚫ **Stopped** (gray) - Not listening

## 🎯 Customize Wake Words

Edit `src/core/config.js`:

```javascript
export const config = {
  deepgramApiKey: 'YOUR_KEY',
  wakeWord: 'hello',      // Change to your preferred wake word
  sleepWord: 'bye',       // Change to your preferred sleep word
  model: 'nova-2',        // Deepgram model
  language: 'en-US',      // Language code
  punctuate: true,
  interimResults: true
};
```

## 🔧 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder. Deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## 🌐 Browser Support

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14.1+
- ✅ Edge 88+

**Requirements:**
- Browser must support WebRTC and Web Audio API
- HTTPS required for microphone access (except localhost)

## 🔐 Security Notes

- **Never commit your API key** to version control
- Use environment variables for production:
  ```javascript
  deepgramApiKey: import.meta.env.VITE_DEEPGRAM_API_KEY
  ```
- Create `.env` file:
  ```
  VITE_DEEPGRAM_API_KEY=your_api_key_here
  ```

## 🛠️ Project Structure

```
speech-wake-module/
├── src/
│   ├── core/
│   │   ├── AudioCapture.js       # Microphone handling
│   │   ├── DeepgramSTT.js        # Deepgram WebSocket client
│   │   ├── SimpleWakeWord.js     # Text-based wake word detection
│   │   └── config.js             # Configuration
│   ├── hooks/
│   │   └── useSpeechModule.js    # Main speech module logic
│   ├── speechModuleDemo.jsx      # UI component
│   ├── speechModuleDemo.css      # Styles
│   └── main.jsx                  # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🐛 Troubleshooting

### Microphone Not Working

- Check browser permissions (Settings → Privacy → Microphone)
- Ensure HTTPS is used (or localhost)
- Verify microphone is not used by another app

### Wake Word Not Detected

- Speak clearly and wait for transcription to appear
- Check console logs for transcript output
- Adjust wake word in `config.js` to something more distinct

### No Transcription Appearing

- Verify Deepgram API key is valid
- Check browser console for WebSocket errors
- Ensure internet connection is stable

### Audio Level Test

The app includes a built-in microphone test. Check console logs after clicking "Start Listening" to see audio levels.

## 📚 Built With

- React 19.2
- Vite 6.3
- Deepgram Speech-to-Text API
- Web Audio API
- WebRTC

## 📄 License

MIT License

## 🔗 Links

- [Deepgram Documentation](https://developers.deepgram.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
