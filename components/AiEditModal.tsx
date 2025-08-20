
import React, { useState } from 'react';
import { AiSparkles } from './ui/AiSparkles';
import { AiEditAction, AiToneOption } from '../types';
import { TextToSpeechButton } from './ui/TextToSpeechButton';

interface AiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newText: string) => void;
  onAction: (action: AiEditAction, tone?: AiToneOption) => void;
  originalText: string;
  suggestedText: string;
  isLoading: boolean;
}

export const AiEditModal: React.FC<AiEditModalProps> = ({ isOpen, onClose, onConfirm, onAction, originalText, suggestedText, isLoading }) => {
  const [showToneOptions, setShowToneOptions] = useState(false);

  if (!isOpen) {
    return null;
  }

  const parseText = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">La IA está pensando...</p>;
    return text.split('\n').map((line, i) => <p key={i}>{line || <br />}</p>);
  }

  const handleToneClick = (tone: AiToneOption) => {
    onAction('tone', tone);
    setShowToneOptions(false);
  }

  const actionButtons: { label: string, action: AiEditAction }[] = [
      { label: 'Reescribir', action: 'rephrase' },
      { label: 'Acortar', action: 'shorten' },
      { label: 'Expandir', action: 'expand' },
      { label: 'Corregir', action: 'grammar' },
  ];
  
  const toneOptions: AiToneOption[] = ['Professional', 'Enthusiastic', 'Formal', 'Concise'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 no-print backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-700 shadow-2xl shadow-sky-900/20 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-sky-400">Asistente de Edición IA</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            {/* Original Text */}
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 flex flex-col">
                <h3 className="font-semibold text-lg text-gray-400 mb-2">Original</h3>
                <div className="text-sm text-gray-300 prose prose-sm max-w-none prose-invert prose-p:my-1 overflow-y-auto">
                    {parseText(originalText)}
                </div>
            </div>
            {/* Suggested Text */}
            <div className="bg-gray-900/50 p-4 rounded-md border border-sky-700 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-sky-400">Sugerencia</h3>
                    <TextToSpeechButton textToSpeak={suggestedText} />
                </div>
                <div className="text-sm text-white prose prose-sm max-w-none prose-invert prose-p:my-1 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <AiSparkles isLoading={true} className="w-10 h-10" />
                        </div>
                    ) : (
                        parseText(suggestedText)
                    )}
                </div>
            </div>
        </div>

        <div className="pt-4 space-y-4">
             <div className="flex flex-wrap items-center justify-center gap-2">
                 {actionButtons.map(({label, action}) => (
                    <button key={action} onClick={() => onAction(action)} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-indigo-800 disabled:cursor-wait">
                        {label}
                    </button>
                 ))}
                 <div className="relative">
                     <button onClick={() => setShowToneOptions(!showToneOptions)} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-indigo-800 disabled:cursor-wait">
                         Cambiar Tono
                     </button>
                     {showToneOptions && (
                         <div className="absolute bottom-full mb-2 w-32 bg-gray-700 rounded-md shadow-lg z-10">
                            {toneOptions.map(tone => (
                                <button key={tone} onClick={() => handleToneClick(tone)} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-indigo-500">
                                    {tone}
                                </button>
                            ))}
                         </div>
                     )}
                 </div>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={onClose} type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Cancelar</button>
              <button onClick={() => onConfirm(suggestedText)} type="button" disabled={isLoading || !suggestedText} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-sky-800 disabled:cursor-not-allowed">
                Usar esta Versión
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};