export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private vadCheckInterval: NodeJS.Timeout | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;
  
  // VAD parameters
  private readonly SILENCE_THRESHOLD = 0.01; // Volume threshold for silence
  private readonly SILENCE_DURATION = 1500; // Ms of silence before stopping
  private readonly MIN_RECORDING_DURATION = 500; // Minimum recording time
  
  private recordingStartTime = 0;
  private onRecordingComplete: (audioBlob: Blob) => void;
  private onVoiceStart: () => void;
  private onVoiceEnd: () => void;
  private onVolumeChange: (volume: number) => void;

  constructor(
    onRecordingComplete: (audioBlob: Blob) => void,
    onVoiceStart: () => void = () => {},
    onVoiceEnd: () => void = () => {},
    onVolumeChange: (volume: number) => void = () => {}
  ) {
    this.onRecordingComplete = onRecordingComplete;
    this.onVoiceStart = onVoiceStart;
    this.onVoiceEnd = onVoiceEnd;
    this.onVolumeChange = onVolumeChange;
  }

  async initialize(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      // Initialize MediaRecorder for actual recording
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        this.onRecordingComplete(audioBlob);
      };

      console.log('Voice Activity Detector initialized');
    } catch (error) {
      console.error('Error initializing VAD:', error);
      throw error;
    }
  }

  startListening(): void {
    if (!this.analyser || this.vadCheckInterval) return;

    console.log('Starting voice activity detection...');
    
    this.vadCheckInterval = setInterval(() => {
      this.checkVoiceActivity();
    }, 100); // Check every 100ms
  }

  stopListening(): void {
    if (this.vadCheckInterval) {
      clearInterval(this.vadCheckInterval);
      this.vadCheckInterval = null;
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    console.log('Stopped voice activity detection');
  }

  private checkVoiceActivity(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedVolume = average / 255;
    
    this.onVolumeChange(normalizedVolume);

    const isVoiceDetected = normalizedVolume > this.SILENCE_THRESHOLD;

    if (isVoiceDetected && !this.isRecording) {
      this.startRecording();
    } else if (!isVoiceDetected && this.isRecording) {
      // Voice stopped, start silence timer
      if (!this.silenceTimeout) {
        this.silenceTimeout = setTimeout(() => {
          const recordingDuration = Date.now() - this.recordingStartTime;
          if (recordingDuration >= this.MIN_RECORDING_DURATION) {
            this.stopRecording();
          }
        }, this.SILENCE_DURATION);
      }
    } else if (isVoiceDetected && this.isRecording && this.silenceTimeout) {
      // Voice resumed, cancel silence timer
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  private startRecording(): void {
    if (!this.mediaRecorder || this.isRecording) return;

    console.log('Voice detected - starting recording');
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.recordedChunks = [];
    
    this.mediaRecorder.start();
    this.onVoiceStart();
  }

  private stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) return;

    console.log('Stopping recording due to silence');
    this.isRecording = false;
    
    this.mediaRecorder.stop();
    this.onVoiceEnd();

    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  dispose(): void {
    this.stopListening();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
  }

  get isActivelyRecording(): boolean {
    return this.isRecording;
  }
}

// Helper function to convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

// Helper function to play audio from base64
export const playAudioFromBase64 = async (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to play audio'));
      };
      
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};