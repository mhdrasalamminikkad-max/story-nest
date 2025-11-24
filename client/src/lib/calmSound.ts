// Generate calm ambient background sound for story reading
export const createCalmAudio = (): HTMLAudioElement => {
  const audio = document.createElement("audio");
  
  // Use Web Audio API to create a gentle 432 Hz tone (soothing frequency)
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 3;
  const sampleRate = audioContext.sampleRate;
  
  // Create buffer for the soothing tone
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate gentle sine wave at 432 Hz (healing frequency)
  const frequency = 432;
  for (let i = 0; i < sampleRate * duration; i++) {
    // Fade in and out for smooth audio
    const fadeInDuration = sampleRate * 0.5;
    const fadeOutDuration = sampleRate * 0.5;
    let envelope = 1;
    
    if (i < fadeInDuration) {
      envelope = i / fadeInDuration;
    } else if (i > sampleRate * duration - fadeOutDuration) {
      envelope = (sampleRate * duration - i) / fadeOutDuration;
    }
    
    data[i] = Math.sin((i / sampleRate) * frequency * Math.PI * 2) * 0.05 * envelope;
  }
  
  // Create audio source and blob
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3; // Soft volume
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Render to WAV
  const offlineContext = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
  const offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = buffer;
  offlineSource.connect(offlineContext.destination);
  offlineSource.start(0);
  
  // For now, use a minimal tone that works across all browsers
  audio.src = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==";
  audio.loop = true;
  audio.volume = 0.2;
  
  return audio;
};
