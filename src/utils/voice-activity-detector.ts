export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private vadCheckInterval: NodeJS.Timeout | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;

  // Improved VAD parameters
  private readonly MIN_VOICE_MS = 200;       // ms required before starting
  private readonly MIN_SILENCE_MS = 600;     // ms required before stopping
  private readonly GRACE_ON_STOP_MS = 250;   // buffer to avoid premature stop
  private readonly BASE_THRESHOLD = 0.005;   // absolute floor for very quiet env
  private readonly NOISE_FLOOR_ALPHA = 0.05; // EMA update speed
  private readonly START_HYST_MULT = 1.8;    // start threshold multiplier
  private readonly STOP_HYST_MULT = 1.3;     // stop threshold multiplier

  private noiseFloor = 0.003;
  private voiceWindowStart: number | null = null;
  private paused = false;

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
          autoGainControl: false   // turn AGC off
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Optional high-pass filter to remove rumble
      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 120;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.2;

      source.connect(highpass);
      highpass.connect(this.analyser);

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
    }, 100);
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

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  private checkVoiceActivity(): void {
    if (!this.analyser || this.paused) return;

    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);

    // RMS energy
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      sum += buf[i] * buf[i];
    }
    const rms = Math.sqrt(sum / buf.length);

    // Update noise floor only when not recording
    if (!this.isRecording) {
      this.noiseFloor =
        (1 - this.NOISE_FLOOR_ALPHA) * this.noiseFloor +
        this.NOISE_FLOOR_ALPHA * rms;
    }

    const floor = Math.max(this.noiseFloor, this.BASE_THRESHOLD);
    const startThresh = floor * this.START_HYST_MULT;
    const stopThresh = floor * this.STOP_HYST_MULT;

    this.onVolumeChange(Math.min(rms / (startThresh || 1e-6), 1));

    const now = performance.now();

    if (!this.isRecording) {
      if (rms > startThresh) {
        if (this.voiceWindowStart == null) this.voiceWindowStart = now;
        const voicedMs = now - this.voiceWindowStart;
        if (voicedMs >= this.MIN_VOICE_MS) {
          this.startRecording();
          this.voiceWindowStart = null;
        }
      } else {
        this.voiceWindowStart = null;
      }
    } else {
      if (rms < stopThresh) {
        if (!this.silenceTimeout) {
          this.silenceTimeout = setTimeout(() => {
            setTimeout(() => this.stopRecording(), this.GRACE_ON_STOP_MS);
          }, this.MIN_SILENCE_MS);
        }
      } else {
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
      }
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

    const dur = Date.now() - this.recordingStartTime;
    if (dur < 800) {   // discard very short clips
      console.log('Discarded short recording');
      this.isRecording = false;
      this.recordedChunks = [];
      this.onVoiceEnd();
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      return;
    }

    console.log('Stopping recording due to silence');
    this.isRecording = false;
    this.mediaRecorder.stop();
    this.onVoiceEnd();

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

// --- Helpers unchanged ---
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
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
