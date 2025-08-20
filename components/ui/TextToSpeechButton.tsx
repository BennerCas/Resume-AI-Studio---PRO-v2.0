import React, { useState, useEffect } from 'react';

interface TextToSpeechButtonProps {
  textToSpeak: string;
  className?: string;
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({ textToSpeak, className = '' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = window.speechSynthesis;

  // Cleanup synthesis on component unmount or when text changes
  useEffect(() => {
    return () => {
      if (synth.speaking) {
        synth.cancel();
        setIsSpeaking(false);
      }
    };
  }, [synth, textToSpeak]);
  
  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!textToSpeak) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      if (synth.speaking) {
        synth.cancel(); // Stop any other ongoing speech
      }
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-MX'; // Use a Spanish voice
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
      };
      synth.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const isDisabled = !textToSpeak || !textToSpeak.trim();

  return (
    <button
      type="button"
      onClick={handleToggleSpeech}
      disabled={isDisabled}
      title={isSpeaking ? 'Detener lectura' : 'Leer texto en voz alta'}
      className={`p-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors ${className}`}
    >
      {isSpeaking ? (
        // Stop Icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.563.563 0 019 14.437V9.563z" />
        </svg>

      ) : (
        // Speaker Icon
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
    </button>
  );
};
