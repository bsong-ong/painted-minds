/**
 * Audio utility functions for Gemini live audio
 */

export const createBlob = (pcmData: Float32Array): Blob => {
  // Convert Float32Array to Int16Array for PCM16 format
  const int16Array = new Int16Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  return new Blob([int16Array.buffer], { type: 'audio/pcm' }) as any;
};

export const decode = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const decodeAudioData = async (
  arrayBuffer: ArrayBuffer,
  audioContext: AudioContext,
  sampleRate: number,
  channels: number
): Promise<AudioBuffer> => {
  // For PCM data, we need to create the AudioBuffer manually
  const int16Array = new Int16Array(arrayBuffer);
  const float32Array = new Float32Array(int16Array.length);
  
  // Convert Int16 to Float32
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  
  const audioBuffer = audioContext.createBuffer(channels, float32Array.length, sampleRate);
  audioBuffer.copyToChannel(float32Array, 0);
  
  return audioBuffer;
};