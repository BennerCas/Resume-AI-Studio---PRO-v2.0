import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ResumeData } from './types';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { PomodoroWidget } from './components/PomodoroWidget';
import { WelcomeModal } from './components/WelcomeModal';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
        const savedData = localStorage.getItem('resumeData');
        return savedData ? JSON.parse(savedData) : INITIAL_RESUME_DATA;
    } catch (error) {
        console.error("Error loading data from localStorage", error);
        return INITIAL_RESUME_DATA;
    }
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    localStorage.setItem('hasSeenWelcomeModal', 'true');
    setShowWelcomeModal(false);
  };
  
  const handleSave = useCallback(() => {
    try {
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
        alert('¡Progreso guardado!');
    } catch (error) {
        console.error("Error saving data to localStorage", error);
        alert('Error al guardar el progreso.');
    }
  }, [resumeData]);

  const handleLoad = useCallback(() => {
    try {
        const savedData = localStorage.getItem('resumeData');
        if (savedData) {
            setResumeData(JSON.parse(savedData));
            alert('¡Progreso cargado!');
        } else {
            alert('No se encontraron datos guardados.');
        }
    } catch (error) {
        console.error("Error loading data from localStorage", error);
        alert('Error al cargar el progreso.');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo y empezar de nuevo?')) {
        setResumeData(INITIAL_RESUME_DATA);
        localStorage.removeItem('resumeData');
        localStorage.removeItem('hasSeenWelcomeModal'); // Also reset welcome modal
    }
  }, []);

  return (
    <>
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} />}
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 no-print border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <svg className="h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="ml-3 text-2xl font-bold font-slab text-white">Resume AI Studio - PRO</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} title="Guardar Progreso" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002 2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    </button>
                    <button onClick={handleLoad} title="Cargar Progreso" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button onClick={handleReset} title="Reiniciar Formulario" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-2" style={{ height: 'calc(100vh - 4rem)' }}>
        <ResumeForm
            resumeData={resumeData}
            setResumeData={setResumeData}
            loadingStates={loadingStates}
            setLoadingStates={setLoadingStates}
        />
        <ResumePreview 
            resumeData={resumeData}
            setResumeData={setResumeData}
            pageContainerRef={pageContainerRef}
            loadingStates={loadingStates}
            setLoadingStates={setLoadingStates}
        />
      </main>
      <PomodoroWidget />
    </>
  );
};

export default App;