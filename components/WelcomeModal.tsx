import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 no-print backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl border border-gray-700 shadow-2xl shadow-sky-900/20 text-center flex flex-col items-center">
        <svg className="h-12 w-12 text-sky-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <h1 className="text-3xl font-bold font-slab text-white mb-2">Bienvenido a Resume AI Studio - PRO</h1>
        <p className="text-gray-400 font-semibold mb-6">BY BRAINMARK LAB | DIGITALMAKERS</p>

        <div className="text-left space-y-4 text-gray-300 mb-6">
            <p>Esta herramienta te guiará para crear un CV y una carta de presentación de alto impacto usando IA. Sigue estos pasos:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong className="text-sky-400">Paso 1: Análisis Inicial.</strong> Pega la descripción del puesto y tu CV actual para que la IA analice tu compatibilidad y te dé una ventaja estratégica.</li>
                <li><strong className="text-sky-400">Paso 2: Genera Contenido.</strong> Usa los botones de IA ✨ para generar o mejorar el contenido de cada sección de tu CV y carta de presentación.</li>
                <li><strong className="text-sky-400">Paso 3: Diseña y Descarga.</strong> Personaliza el diseño de tu CV, elige plantillas, colores y fuentes. Finalmente, descarga el resultado en formato HTML.</li>
            </ul>
        </div>

        <p className="text-xs text-yellow-400 mb-6">Esta es una herramienta gratuita y queda prohibida su venta.</p>
        
        <button 
          onClick={onClose} 
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-md btn-glow transition-transform transform hover:scale-105"
        >
          Comenzar a Crear
        </button>
      </div>
    </div>
  );
};
