/**
 * Audio recording utility for Thought Buddy
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onRecordingComplete: (audioBlob: Blob) => void;

  constructor(onRecordingComplete: (audioBlob: Blob) => void) {
    this.onRecordingComplete = onRecordingComplete;
  }

  async start() {
    try {
      // Check if we're in a Capacitor environment
      const isCapacitor = (window as any).Capacitor !== undefined;
      
      if (isCapacitor) {
        console.log('Requesting microphone permission in Capacitor app...');
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.onRecordingComplete(audioBlob);
        this.audioChunks = [];
      };

      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Provide helpful error messages based on error type
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        const isCapacitor = (window as any).Capacitor !== undefined;
        if (isCapacitor) {
          throw new Error('Microphone permission denied. Please enable microphone access in your device settings.');
        }
        throw new Error('Microphone permission denied. Please allow microphone access when prompted.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('No microphone found on your device.');
      } else if (err.name === 'NotReadableError') {
        throw new Error('Microphone is already in use by another application.');
      }
      
      throw error;
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      console.log('Recording stopped');
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  get isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const playAudioFromBase64 = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audioData = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioData);
      
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};