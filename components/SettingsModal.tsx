import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 no-print backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4 border border-gray-700 shadow-2xl shadow-sky-900/20" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400">Ajustes</h2>
        
        <div>
          <label htmlFor="api-key-input" className="block mb-2 text-sm font-medium text-gray-300">Clave de API de Gemini</label>
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            placeholder="Introduce tu clave de API aquí"
          />
          <p className="mt-2 text-xs text-gray-400">
            Puedes obtener tu clave de API desde <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Google AI Studio</a>. Tu clave se guarda localmente en tu navegador.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button onClick={onClose} type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Cancelar</button>
          <button onClick={handleSave} type="button" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};