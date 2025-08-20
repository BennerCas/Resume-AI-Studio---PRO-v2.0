import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiSparkles } from './ui/AiSparkles';
import * as geminiService from '../services/geminiService';

declare const Tone: any; // Declare Tone to satisfy TypeScript since it's from a CDN

export const PomodoroWidget: React.FC = () => {
    // State for timer logic
    const [workDuration, setWorkDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [timeLeft, setTimeLeft] = useState(workDuration * 60);
    const [totalTime, setTotalTime] = useState(workDuration * 60);
    const [isPaused, setIsPaused] = useState(true);
    const [currentState, setCurrentState] = useState<'work' | 'break'>('work');

    // State for UI
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#4F46E5');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [textColor, setTextColor] = useState('#111827');
    
    // State for AI feature
    const [suggestion, setSuggestion] = useState('Haz clic en el botón para obtener una sugerencia para tu próximo descanso.');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

    // Refs
    const timerIntervalRef = useRef<number | null>(null);
    const synthRef = useRef<any>(null);

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timeLeft / totalTime) * circumference;

    const updateDisplay = useCallback(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, [timeLeft]);
    
    const resetTimer = useCallback(() => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsPaused(true);
        const newTime = (currentState === 'work' ? workDuration : breakDuration) * 60;
        setTimeLeft(newTime);
        setTotalTime(newTime);
    }, [currentState, workDuration, breakDuration]);

    useEffect(() => {
        resetTimer();
    }, [workDuration, breakDuration, resetTimer]);


    const switchState = useCallback(() => {
        const nextState = currentState === 'work' ? 'break' : 'work';
        setCurrentState(nextState);
        const newTime = (nextState === 'work' ? workDuration : breakDuration) * 60;
        setTimeLeft(newTime);
        setTotalTime(newTime);
    }, [currentState, breakDuration, workDuration]);


    useEffect(() => {
        if (isPaused) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return;
        }

        timerIntervalRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if(synthRef.current) synthRef.current.triggerAttackRelease("C5", "8n");
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    
                    switchState();
                    
                    setTimeout(() => {
                        setIsPaused(false);
                    }, 1000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isPaused, switchState]);

    const handleStartPause = () => {
        if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
            Tone.start();
        }
        if (typeof Tone !== 'undefined' && !synthRef.current) {
            synthRef.current = new Tone.Synth().toDestination();
        }
        setIsPaused(!isPaused);
    };

    const handleGetSuggestion = async () => {
        setIsSuggestionLoading(true);
        setSuggestion('');
        try {
            const result = await geminiService.generatePomodoroSuggestion();
            setSuggestion(result);
        } catch (e) {
            setSuggestion(e instanceof Error ? e.message : 'Error al obtener sugerencia.');
        } finally {
            setIsSuggestionLoading(false);
        }
    };

    return (
        <div id="pomodoro-widget" className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3 no-print">
            <div id="settings-panel" className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl w-72 transition-transform duration-300 ${settingsOpen ? 'scale-100' : 'scale-0'}`}>
                 <h3 className="font-bold text-gray-800 mb-4 text-center">Configuración</h3>
                <div className="space-y-3 mb-5">
                    <div>
                        <label htmlFor="work-duration" className="text-sm font-medium text-gray-600">Trabajo (min)</label>
                        <input type="number" id="work-duration" value={workDuration} onChange={e => setWorkDuration(parseInt(e.target.value) || 25)} className="w-full mt-1 p-2 rounded-md bg-gray-200/50 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black"/>
                    </div>
                    <div>
                        <label htmlFor="break-duration" className="text-sm font-medium text-gray-600">Descanso (min)</label>
                        <input type="number" id="break-duration" value={breakDuration} onChange={e => setBreakDuration(parseInt(e.target.value) || 5)} className="w-full mt-1 p-2 rounded-md bg-gray-200/50 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black"/>
                    </div>
                </div>
                 <div className="grid grid-cols-3 gap-4 items-center text-center mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Principal</label>
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Fondo</label>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Texto</label>
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} />
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3 text-center">Funciones con IA</h4>
                    <button onClick={handleGetSuggestion} disabled={isSuggestionLoading} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-wait">
                        <AiSparkles isLoading={isSuggestionLoading} className="h-4 w-4" /> Sugerir Actividad
                    </button>
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800 min-h-[50px]">
                        {isSuggestionLoading ? <div className="flex items-center justify-center"><div className="loader loader-on-light"></div><span className="ml-2 text-indigo-800">Pensando...</span></div> : suggestion}
                    </div>
                </div>
            </div>

            <div className="relative w-48 h-48 md:w-56 md:h-56">
                <div className="w-full h-full rounded-full shadow-xl flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: bgColor }}>
                    <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-gray-300/50" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle className="transition-all duration-500" strokeWidth="5" strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50"
                            style={{
                                transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
                                strokeDasharray: `${circumference} ${circumference}`,
                                strokeDashoffset: offset,
                                color: primaryColor
                            }}
                        />
                    </svg>
                    <div className="text-center z-10">
                        <span className="text-4xl md:text-5xl font-bold tabular-nums transition-colors duration-300" style={{ color: textColor }}>{updateDisplay()}</span>
                        <p className="text-sm font-medium uppercase tracking-wider transition-colors duration-300 capitalize" style={{ color: textColor }}>{currentState}</p>
                    </div>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex gap-4">
                    <button onClick={handleStartPause} className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 focus:outline-none" style={{ backgroundColor: primaryColor }}>
                        {isPaused ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                    <button onClick={resetTimer} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-gray-100 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 003.5 14" /></svg>
                    </button>
                </div>
            </div>

            <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-gray-100 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${settingsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
    );
};