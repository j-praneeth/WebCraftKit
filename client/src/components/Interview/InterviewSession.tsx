import React, { useEffect, useState } from 'react';
import { SpeechService } from '../../utils/speech';

interface InterviewSessionProps {
  // Add any props you need
}

const InterviewSession: React.FC<InterviewSessionProps> = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Initialize speech synthesis when component mounts
    SpeechService.init();
    return () => {
      // Clean up speech synthesis when component unmounts
      SpeechService.stop();
    };
  }, []);

  const speakQuestion = async (text: string) => {
    try {
      SpeechService.speak(
        text,
        () => console.log("Started speaking"),
        () => console.log("Finished speaking"),
        (error) => console.error("Speech error:", error)
      );
    } catch (error) {
      console.error('Failed to speak:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    SpeechService.stop();
    setIsSpeaking(false);
  };

  const pauseSpeaking = () => {
    SpeechService.pause();
    setIsSpeaking(false);
  };

  const resumeSpeaking = () => {
    SpeechService.resume();
    setIsSpeaking(true);
  };

  const checkSpeaking = () => {
    setIsSpeaking(SpeechService.isSpeaking());
  };

  return (
    <div className="interview-session">
      {/* Your existing JSX */}
    </div>
  );
};

export default InterviewSession; 