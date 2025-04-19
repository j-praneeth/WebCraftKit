// Speech synthesis utility functions
export class SpeechService {
  private static synthesis: SpeechSynthesis = window.speechSynthesis;
  private static voice: SpeechSynthesisVoice | null = null;
  private static speaking: boolean = false;
  private static initialized: boolean = false;

  /**
   * Initialize the speech service and select the best available voice
   */
  static async init(): Promise<void> {
    if (this.initialized) return;
    
    // Get available voices
    const voices = this.synthesis.getVoices();
    
    // If no voices available, wait for voiceschanged event
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          this.synthesis.removeEventListener('voiceschanged', handler);
          resolve();
        };
        this.synthesis.addEventListener('voiceschanged', handler);
      });
    }

    // Select the first available voice
    const availableVoices = this.synthesis.getVoices();
    this.voice = availableVoices[0] || null;
    
    if (this.voice) {
      console.log('Selected voice:', this.voice.name);
      this.initialized = true;
    } else {
      console.warn('No voices available');
    }
  }

  /**
   * Speak the given text
   */
  static async speak(
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void, 
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      // Ensure initialization
      if (!this.initialized) {
        await this.init();
      }

      // If already speaking, stop current speech
      if (this.speaking) {
        this.stop();
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use selected voice or default
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      // Set basic properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Add event listeners
      utterance.onstart = () => {
        this.speaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.speaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (event) => {
        this.speaking = false;
        console.error('Speech synthesis error:', event);
        if (onError) onError(event.error);
      };

      // Start speaking
      this.synthesis.speak(utterance);

    } catch (error) {
      this.speaking = false;
      console.error('Speech synthesis error:', error);
      if (onError) onError(error instanceof Error ? error.message : 'Speech synthesis failed');
    }
  }

  /**
   * Stop current speech
   */
  static stop(): void {
    this.synthesis.cancel();
    this.speaking = false;
  }

  /**
   * Check if currently speaking
   */
  static isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Reset the speech service
   */
  static reset(): void {
    this.stop();
    this.initialized = false;
    this.voice = null;
  }
} 