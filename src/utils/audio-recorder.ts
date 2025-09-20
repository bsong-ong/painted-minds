/**
 * Audio recording utility for CBT Assistant
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