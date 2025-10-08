export const config = {
  deepgramApiKey: '272226165d8d5eea138a68836a0762a5cedacede',
  porcupineAccessKey: 'hJrypE5CeXyKKrED00s+LHz8yNphNaS0XppHTE82TGWfsSOJX/YaLg==',
  usePorcupine: true, 
  
  // IMPORTANT: Use absolute path from public folder (no leading dot)
  // Files in public/ are served from root, so use /models/...
  wakeWordModel: '/models/Hi-Siri_en_windows_v3_0_0.ppn',
  
  wakeWord: 'Hi-siri',  
  sleepWord: 'stop',   
  language: 'en-US',
  model: 'nova-2',
  punctuate: true,
  interimResults: true
};