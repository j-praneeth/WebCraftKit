interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Required for speech synthesis
interface SpeechSynthesisUtterance extends EventTarget {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  onstart: (ev: Event) => void;
  onend: (ev: Event) => void;
  onerror: (ev: Event) => void;
  onpause: (ev: Event) => void;
  onresume: (ev: Event) => void;
  onboundary: (ev: Event) => void;
  onmark: (ev: Event) => void;
}

interface SpeechSynthesisVoice {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
}

interface SpeechSynthesis {
  pending: boolean;
  speaking: boolean;
  paused: boolean;
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
  getVoices(): SpeechSynthesisVoice[];
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}