import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, Experience, Education, AiEditAction, AiToneOption, StyleSettings, PersonalDetails, ContactInfo, CoverLetterStyleSettings } from '../types';
import { LAYOUT_OPTIONS, PREDEFINED_THEMES } from '../constants';
import * as geminiService from '../services/geminiService';
import * as pexelsService from '../services/pexelsService';
import * as scraperService from '../services/scraperService';
import { AiSparkles } from './ui/AiSparkles';
import { AiEditModal } from './AiEditModal';
import { TextToSpeechButton } from './ui/TextToSpeechButton';

interface ResumeFormProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  loadingStates: Record<string, boolean>;
  setLoadingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const SectionWrapper: React.FC<{ title: string, children: React.ReactNode, className?: string, headerContent?: React.ReactNode }> = ({ title, children, className, headerContent }) => (
    <div className={`mb-6 ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-sky-400">{title}</h2>
            <div>{headerContent}</div>
        </div>
        <div className="p-4 border border-gray-700 rounded-md bg-gray-900/50 space-y-4">
            {children}
        </div>
    </div>
);

const AiButton: React.FC<{ onClick: () => void, title: string, disabled?: boolean, isLoading?: boolean, className?: string }> = ({ onClick, title, disabled, isLoading: externalLoading, className }) => {
    const [isLoading, setIsLoading] = useState(false);
    const loading = externalLoading !== undefined ? externalLoading : isLoading;

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await onClick();
        } catch (error) {
            alert(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button type="button" onClick={handleClick} disabled={loading || disabled} title={title} className={`p-1.5 bg-blue-800 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors ${className}`}>
            <AiSparkles isLoading={loading} className="h-4 w-4" />
        </button>
    );
};


const FormInput: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string, name: string, className?: string }> = ({ label, name, ...props }) => (
    <div>
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
        <input id={name} name={name} {...props} className={`w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none ${props.className}`} />
    </div>
);

const FormTextarea: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, name: string, rows?: number, aiAction?: () => void, aiLoading?: boolean }> = ({ label, name, aiAction, aiLoading, ...props }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={name} className="block text-sm font-medium text-gray-300">{label}</label>
          {aiAction && <AiButton onClick={aiAction} title={`Generar ${label} con IA`} isLoading={aiLoading}/>}
        </div>
        <textarea id={name} name={name} {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
    </div>
);

const FormSelect: React.FC<{ label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, name: string }> = ({ label, name, ...props }) => (
     <div>
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
        <select id={name} name={name} {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
    </div>
);


export const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData, setResumeData, loadingStates, setLoadingStates }) => {
    const [activeMenu, setActiveMenu] = useState('inicio');
    const [imageSearchQuery, setImageSearchQuery] = useState('');
    const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
    const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);
    
    // AI Edit Modal State
    const [isAiEditModalOpen, setIsAiEditModalOpen] = useState(false);
    const [aiEditModalContent, setAiEditModalContent] = useState({ originalText: '', suggestedText: '' });
    const [isAiEditLoading, setIsAiEditLoading] = useState(false);
    
    const aiEditCallbackRef = useRef<{ onConfirm: (newText: string) => void } | null>(null);

    // Debounce for image search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (imageSearchQuery) {
                handleImageSearch();
            } else {
                setImageSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [imageSearchQuery]);
    
    const handleInputChange = (field: keyof ResumeData, value: any) => {
        setResumeData(prev => ({...prev, [field]: value}));
    };

    const handlePersonalDetailChange = useCallback((field: keyof PersonalDetails, value: any) => {
         setResumeData(prev => ({
            ...prev,
            personal: { ...prev.personal, [field]: value }
        }));
    }, [setResumeData]);

    const handleContactInfoChange = (field: keyof PersonalDetails, subField: keyof ContactInfo, value: string) => {
        setResumeData(prev => ({
            ...prev,
            personal: {
                ...prev.personal,
                [field]: {
                    ...(prev.personal[field as keyof PersonalDetails] as ContactInfo),
                    [subField]: value,
                }
            }
        }));
    };

    const handleStyleChange = useCallback(<T extends keyof StyleSettings>(field: T, value: StyleSettings[T]) => {
         setResumeData(prev => ({
            ...prev,
            style: { ...prev.style, [field]: value }
        }));
    }, [setResumeData]);

    const handleCoverLetterStyleChange = useCallback(<T extends keyof CoverLetterStyleSettings>(field: T, value: CoverLetterStyleSettings[T]) => {
         setResumeData(prev => ({
            ...prev,
            coverLetterStyle: { ...prev.coverLetterStyle, [field]: value }
        }));
    }, [setResumeData]);
    
    const handleExperienceChange = useCallback((id: string, field: keyof Experience, value: string) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }));
    }, [setResumeData]);

    const handleEducationChange = useCallback((id: string, field: keyof Education, value: string) => {
        setResumeData(prev => ({
            ...prev,
            education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
        }));
    }, [setResumeData]);

    const addExperience = useCallback(() => {
        setResumeData(prev => ({ ...prev, experience: [...prev.experience, { id: crypto.randomUUID(), title: '', company: '', date: '', description: '' }] }));
    }, [setResumeData]);
    
    const removeExperience = useCallback((id: string) => {
        setResumeData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
    }, [setResumeData]);
    
    const addEducation = useCallback(() => {
        setResumeData(prev => ({ ...prev, education: [...prev.education, { id: crypto.randomUUID(), degree: '', school: '', date: '' }] }));
    }, [setResumeData]);
    
    const removeEducation = useCallback((id: string) => {
        setResumeData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
    }, [setResumeData]);

    const handleAIGenerate = async (field: keyof ResumeData | `experience.description.${string}`, generator: () => Promise<string>) => {
        setLoadingStates(prev => ({ ...prev, [field.toString()]: true }));
        try {
            const result = await generator();
            if (typeof field === 'string' && field.startsWith('experience.description')) {
                const id = field.split('.')[2];
                handleExperienceChange(id, 'description', result);
            } else {
                 setResumeData(prev => ({ ...prev, [field as keyof ResumeData]: result }));
            }
        } catch (e) {
            console.error(`Error generating ${field}`, e);
            alert(e instanceof Error ? e.message : `Failed to generate ${field}`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [field.toString()]: false }));
        }
    };
    
    const openAiEditModal = (originalText: string, onConfirm: (newText: string) => void) => {
        aiEditCallbackRef.current = { onConfirm };
        setAiEditModalContent({ originalText, suggestedText: '' });
        setIsAiEditModalOpen(true);
    };

    const handleAiEdit = async (action: AiEditAction, tone?: AiToneOption) => {
        setIsAiEditLoading(true);
        setAiEditModalContent(prev => ({ ...prev, suggestedText: '' }));
        try {
            const { originalText } = aiEditModalContent;
            let result: string;
            switch (action) {
                case 'rephrase': result = await geminiService.rephraseText(originalText, resumeData); break;
                case 'shorten': result = await geminiService.shortenText(originalText, resumeData); break;
                case 'expand': result = await geminiService.expandText(originalText, resumeData); break;
                case 'grammar': result = await geminiService.fixGrammar(originalText, resumeData); break;
                case 'tone': result = await geminiService.changeTone(originalText, tone!, resumeData); break;
                default: throw new Error('Unknown AI edit action');
            }
            setAiEditModalContent(prev => ({ ...prev, suggestedText: result }));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'AI edit failed');
        } finally {
            setIsAiEditLoading(false);
        }
    };
    
    const handleAnalyzeCv = async () => {
        if (!resumeData.jobDescription || !resumeData.cvInput) {
            alert("Por favor, proporciona la descripción del puesto y el texto de tu CV actual.");
            return;
        }
        setLoadingStates(prev => ({ ...prev, initialAnalysis: true }));
        try {
            const result = await geminiService.analyzeCVAndJob(resumeData.cvInput, resumeData.jobDescription);
            
            setResumeData(prev => ({
                ...prev,
                personal: {
                    ...prev.personal,
                    name: result.extractedData.name || prev.personal.name,
                    title: result.extractedData.title || prev.personal.title,
                    email: { value: result.extractedData.email || prev.personal.email.value, link: `mailto:${result.extractedData.email}` },
                    phone: { value: result.extractedData.phone || prev.personal.phone.value, link: `tel:${result.extractedData.phone}` },
                    linkedin: { value: result.extractedData.linkedin || prev.personal.linkedin.value, link: result.extractedData.linkedin || '' },
                },
                summary: result.extractedData.summary || prev.summary,
                skills: result.extractedData.skills || prev.skills,
                experience: result.extractedData.experience?.map(e => ({ ...e, id: crypto.randomUUID() })) || prev.experience,
                education: result.extractedData.education?.map(e => ({ ...e, id: crypto.randomUUID() })) || prev.education,
                aiAnalysis: result.analysis,
            }));
            setActiveMenu('analisis');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'An error occurred during analysis.');
        } finally {
            setLoadingStates(prev => ({ ...prev, initialAnalysis: false }));
        }
    };
    
    const handleImageSearch = async () => {
        setIsImageSearchLoading(true);
        try {
            const results = await pexelsService.searchPexels(imageSearchQuery);
            setImageSearchResults(results);
        } catch (e) {
            console.error("Image search failed", e);
        } finally {
            setIsImageSearchLoading(false);
        }
    };
    
    const handleScrapeUrl = async (type: 'job' | 'cv') => {
        const url = type === 'job' ? resumeData.jobDescriptionUrl : resumeData.cvInputUrl;
        if (!url) return;
        
        const loadingKey = type === 'job' ? 'scrapingJob' : 'scrapingCv';
        setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
        try {
            const content = await scraperService.fetchUrlContent(url);
            if (content) {
                const fieldToUpdate = type === 'job' ? 'jobDescription' : 'cvInput';
                handleInputChange(fieldToUpdate, content);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
        }
    };
    
    const handleGenerateAllContent = async () => {
        setLoadingStates(prev => ({ ...prev, allContent: true }));
        try {
            const result = await geminiService.generateAllCvContent(resumeData);
            setResumeData(prev => ({
                ...prev,
                summary: result.summary,
                achievements: result.achievements,
                strengths: result.strengths,
                skills: result.skills,
                cta: result.cta
            }));
        } catch (e) {
            console.error('Error generating all content', e);
            alert(e instanceof Error ? e.message : 'Failed to generate content');
        } finally {
            setLoadingStates(prev => ({ ...prev, allContent: false }));
        }
    };

    const menuItems = [
        { id: 'inicio', label: 'Inicio' },
        { id: 'analisis', label: 'Análisis IA', disabled: !resumeData.aiAnalysis },
        { id: 'personal', label: 'Personal' },
        { id: 'contenido', label: 'Contenido' },
        { id: 'diseno', label: 'Diseño CV' },
        { id: 'diseno_carta', label: 'Diseño Carta' },
        { id: 'carta', label: 'Carta' },
    ];
    
    const renderContent = () => {
        switch (activeMenu) {
            case 'inicio': return (
                <SectionWrapper title="1. Análisis Inicial con IA">
                    <p className="text-sm text-gray-400 mb-4">
                        Pega la descripción del puesto y tu CV actual para que la IA realice un análisis de compatibilidad. Esto desbloqueará el "Termómetro de Compatibilidad" y potenciará las sugerencias de la IA en los siguientes pasos.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormTextarea label="Descripción del Puesto" name="jobDescription" value={resumeData.jobDescription} onChange={e => handleInputChange('jobDescription', e.target.value)} rows={8} />
                             <div className="flex gap-2 mt-2">
                                <FormInput label="" name="jobDescriptionUrl" type="url" placeholder="O pega una URL para extraer el texto" value={resumeData.jobDescriptionUrl} onChange={e => handleInputChange('jobDescriptionUrl', e.target.value)} />
                                <button type="button" onClick={() => handleScrapeUrl('job')} disabled={loadingStates.scrapingJob} className="self-end p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-500">
                                    <AiSparkles isLoading={loadingStates.scrapingJob} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <FormTextarea label="Tu CV Actual (Texto Plano)" name="cvInput" value={resumeData.cvInput} onChange={e => handleInputChange('cvInput', e.target.value)} rows={8} />
                            <div className="flex gap-2 mt-2">
                                <FormInput label="" name="cvInputUrl" type="url" placeholder="O pega una URL (ej. LinkedIn)" value={resumeData.cvInputUrl} onChange={e => handleInputChange('cvInputUrl', e.target.value)} />
                                <button type="button" onClick={() => handleScrapeUrl('cv')} disabled={loadingStates.scrapingCv} className="self-end p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-500">
                                    <AiSparkles isLoading={loadingStates.scrapingCv} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <button onClick={handleAnalyzeCv} disabled={loadingStates.initialAnalysis || !resumeData.jobDescription || !resumeData.cvInput} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-md btn-glow disabled:bg-sky-800 disabled:cursor-not-allowed disabled:shadow-none">
                            {loadingStates.initialAnalysis ? "Analizando..." : "Analizar con IA"}
                        </button>
                    </div>
                </SectionWrapper>
            );
            case 'analisis': return resumeData.aiAnalysis && (
                 <SectionWrapper title="Termómetro de Compatibilidad y Análisis Estratégico">
                     <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-sky-300 mb-2">Termómetro de Compatibilidad</h3>
                        <div className="w-full bg-gray-700 rounded-full h-6 flex overflow-hidden">
                            <div className="bg-green-500 h-6 text-xs font-medium text-green-900 text-center p-1 leading-none rounded-l-full" style={{ width: `${resumeData.aiAnalysis.qualification.qualifiedPercentage}%` }}>
                                {resumeData.aiAnalysis.qualification.qualifiedPercentage > 10 ? `${resumeData.aiAnalysis.qualification.qualifiedPercentage}%` : ''}
                            </div>
                            <div className="bg-red-500 h-6 text-xs font-medium text-red-900 text-center p-1 leading-none" style={{ width: `${resumeData.aiAnalysis.qualification.notQualifiedPercentage}%` }}>
                                {resumeData.aiAnalysis.qualification.notQualifiedPercentage > 10 ? `${resumeData.aiAnalysis.qualification.notQualifiedPercentage}%` : ''}
                            </div>
                             <div className="bg-yellow-500 h-6 text-xs font-medium text-yellow-900 text-center p-1 leading-none rounded-r-full" style={{ width: `${resumeData.aiAnalysis.qualification.overqualifiedPercentage}%` }}>
                                {resumeData.aiAnalysis.qualification.overqualifiedPercentage > 10 ? `${resumeData.aiAnalysis.qualification.overqualifiedPercentage}%` : ''}
                            </div>
                        </div>
                         <div className="flex justify-between text-xs mt-1 px-1">
                             <span className="text-green-400">Cualificado</span>
                             <span className="text-red-400">No Cualificado</span>
                             <span className="text-yellow-400">Sobrecualificado</span>
                         </div>
                         <div className="mt-4 space-y-2 text-sm">
                            <p><strong className="text-green-400">Argumento Cualificado:</strong> {resumeData.aiAnalysis.qualification.qualifiedArgument}</p>
                            <p><strong className="text-red-400">Argumento No Cualificado:</strong> {resumeData.aiAnalysis.qualification.notQualifiedArgument}</p>
                            <p><strong className="text-yellow-400">Argumento Sobrecualificado:</strong> {resumeData.aiAnalysis.qualification.overqualifiedArgument}</p>
                         </div>
                    </div>
                     <div className="mt-4 bg-gray-800 p-4 rounded-lg space-y-3 text-sm">
                         <h3 className="text-lg font-semibold text-sky-300 mb-2">Análisis Estratégico</h3>
                         <p><strong>Puesto y Encaje:</strong> {resumeData.aiAnalysis.question1}</p>
                         <p><strong>Resultados Clave:</strong> {resumeData.aiAnalysis.question2}</p>
                         <p><strong>Fortalezas Relevantes:</strong> {resumeData.aiAnalysis.question3}</p>
                         <p><strong>Potencial Futuro:</strong> {resumeData.aiAnalysis.question4}</p>
                    </div>
                 </SectionWrapper>
            );
            case 'personal': return (
                <SectionWrapper title="2. Detalles Personales">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Nombre Completo" name="name" value={resumeData.personal.name} onChange={e => handlePersonalDetailChange('name', e.target.value)} />
                        <div className="flex items-end gap-2">
                             <FormInput label="Título del Puesto" name="title" value={resumeData.personal.title} onChange={e => handlePersonalDetailChange('title', e.target.value)} className="flex-grow"/>
                             <AiButton onClick={() => handleAIGenerate('personal.title' as any, () => geminiService.generateAITitle(resumeData))} title="Generar Título con IA" isLoading={loadingStates['personal.title']}/>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <FormInput label="Lema / Frase Definitoria" name="definingPhrase" value={resumeData.personal.definingPhrase} onChange={e => handlePersonalDetailChange('definingPhrase', e.target.value)} placeholder="Ej: Especialista en marketing digital impulsado por datos" className="flex-grow" />
                         <AiButton onClick={() => handleAIGenerate('personal.definingPhrase' as any, () => geminiService.generateAIDefiningPhrase(resumeData))} title="Generar Lema con IA" isLoading={loadingStates['personal.definingPhrase']} />
                    </div>
                    <FormInput label="LinkedIn (URL Completa)" name="linkedin" value={resumeData.personal.linkedin.value} onChange={e => { handleContactInfoChange('linkedin', 'value', e.target.value); handleContactInfoChange('linkedin', 'link', e.target.value); }} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormInput label="Teléfono 1" name="phone1" value={resumeData.personal.phone.value} onChange={e => { handleContactInfoChange('phone', 'value', e.target.value); handleContactInfoChange('phone', 'link', `tel:${e.target.value}`); }} />
                       <FormInput label="Teléfono 2" name="phone2" value={resumeData.personal.phone2.value} onChange={e => { handleContactInfoChange('phone2', 'value', e.target.value); handleContactInfoChange('phone2', 'link', `tel:${e.target.value}`); }} />
                       <FormInput label="Email 1" name="email1" type="email" value={resumeData.personal.email.value} onChange={e => { handleContactInfoChange('email', 'value', e.target.value); handleContactInfoChange('email', 'link', `mailto:${e.target.value}`); }} />
                       <FormInput label="Email 2" name="email2" type="email" value={resumeData.personal.email2.value} onChange={e => { handleContactInfoChange('email2', 'value', e.target.value); handleContactInfoChange('email2', 'link', `mailto:${e.target.value}`); }} />
                    </div>
                </SectionWrapper>
            );
             case 'contenido': return (
                <>
                    <SectionWrapper 
                        title="3. Contenido del CV"
                        headerContent={
                             <button onClick={handleGenerateAllContent} disabled={loadingStates.allContent} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:bg-indigo-800">
                                <AiSparkles isLoading={loadingStates.allContent} className="w-4 h-4" />
                                {loadingStates.allContent ? 'Generando...' : 'Generar Contenido'}
                            </button>
                        }
                    >
                         <div className="relative">
                            <FormTextarea label="Resumen Profesional" name="summary" value={resumeData.summary} onChange={e => handleInputChange('summary', e.target.value)} rows={5} />
                            <div className="absolute top-0 right-0 flex items-center gap-1">
                                <TextToSpeechButton textToSpeak={resumeData.summary} />
                                <AiButton onClick={() => openAiEditModal(resumeData.summary, (newText) => handleInputChange('summary', newText))} title="Editar con Asistente IA" />
                            </div>
                         </div>
                          <div className="relative">
                            <FormTextarea label="Logros Clave" name="achievements" value={resumeData.achievements} onChange={e => handleInputChange('achievements', e.target.value)} rows={5} placeholder="- Aumenté las ventas en un 20%..."/>
                            <div className="absolute top-0 right-0 flex items-center gap-1">
                                <TextToSpeechButton textToSpeak={resumeData.achievements} />
                                <AiButton onClick={() => openAiEditModal(resumeData.achievements, (newText) => handleInputChange('achievements', newText))} title="Editar con Asistente IA" />
                            </div>
                         </div>
                          <div className="relative">
                            <FormTextarea label="Fortalezas Clave" name="strengths" value={resumeData.strengths} onChange={e => handleInputChange('strengths', e.target.value)} rows={5} placeholder="- Liderazgo de equipos..."/>
                            <div className="absolute top-0 right-0 flex items-center gap-1">
                                <TextToSpeechButton textToSpeak={resumeData.strengths} />
                                <AiButton onClick={() => openAiEditModal(resumeData.strengths, (newText) => handleInputChange('strengths', newText))} title="Editar con Asistente IA" />
                            </div>
                         </div>
                         <div className="relative">
                            <FormTextarea label="Habilidades" name="skills" value={resumeData.skills} onChange={e => handleInputChange('skills', e.target.value)} rows={3} placeholder="HTML, CSS, JavaScript, React, Liderazgo..."/>
                            <div className="absolute top-0 right-0 flex items-center gap-1">
                                <TextToSpeechButton textToSpeak={resumeData.skills} />
                                <AiButton onClick={() => openAiEditModal(resumeData.skills, (newText) => handleInputChange('skills', newText))} title="Editar con Asistente IA" />
                            </div>
                        </div>
                        <div className="relative">
                            <FormTextarea 
                                label="Cierre / Llamada a la Acción" 
                                name="cta" 
                                value={resumeData.cta} 
                                onChange={e => handleInputChange('cta', e.target.value)} 
                                rows={3} 
                                placeholder="Con mi experiencia en... estoy seguro de que puedo aportar valor. Me encantaría conversar sobre cómo mis habilidades pueden beneficiar a su equipo."
                                aiAction={() => handleAIGenerate('cta', () => geminiService.generateAICta(resumeData))}
                                aiLoading={loadingStates.cta}
                            />
                             <div className="absolute top-0 right-10 flex items-center gap-1">
                                <TextToSpeechButton textToSpeak={resumeData.cta} />
                                <AiButton onClick={() => openAiEditModal(resumeData.cta, (newText) => handleInputChange('cta', newText))} title="Editar con Asistente IA" />
                            </div>
                        </div>
                    </SectionWrapper>
                    <SectionWrapper title="Experiencia Laboral" headerContent={<button onClick={addExperience} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md">+</button>}>
                        {resumeData.experience.map((exp, index) => (
                            <div key={exp.id} className="p-3 bg-gray-800/70 rounded-md border border-gray-700 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <FormInput label="Puesto" name={`exp-title-${index}`} value={exp.title} onChange={e => handleExperienceChange(exp.id, 'title', e.target.value)} />
                                    <FormInput label="Empresa" name={`exp-company-${index}`} value={exp.company} onChange={e => handleExperienceChange(exp.id, 'company', e.target.value)} />
                                    <FormInput label="Fechas" name={`exp-date-${index}`} value={exp.date} onChange={e => handleExperienceChange(exp.id, 'date', e.target.value)} placeholder="Ej: Ene 2020 - Presente" />
                                </div>
                                <div className="relative">
                                    <FormTextarea label="Descripción" name={`exp-desc-${index}`} value={exp.description} onChange={e => handleExperienceChange(exp.id, 'description', e.target.value)} rows={4} aiAction={() => handleAIGenerate(`experience.description.${exp.id}`, () => geminiService.generateAIExperienceDescription(resumeData, exp.title))} aiLoading={loadingStates[`experience.description.${exp.id}`]} />
                                     <div className="absolute top-0 right-10 flex items-center gap-1">
                                        <TextToSpeechButton textToSpeak={exp.description} />
                                        <AiButton onClick={() => openAiEditModal(exp.description, (newText) => handleExperienceChange(exp.id, 'description', newText))} title="Editar con Asistente IA" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button onClick={() => removeExperience(exp.id)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md">Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </SectionWrapper>
                    <SectionWrapper title="Educación" headerContent={<button onClick={addEducation} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md">+</button>}>
                       {resumeData.education.map((edu, index) => (
                           <div key={edu.id} className="p-3 bg-gray-800/70 rounded-md border border-gray-700 space-y-3">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                   <FormInput label="Título / Grado" name={`edu-degree-${index}`} value={edu.degree} onChange={e => handleEducationChange(edu.id, 'degree', e.target.value)} />
                                   <FormInput label="Institución" name={`edu-school-${index}`} value={edu.school} onChange={e => handleEducationChange(edu.id, 'school', e.target.value)} />
                                   <FormInput label="Fechas" name={`edu-date-${index}`} value={edu.date} onChange={e => handleEducationChange(edu.id, 'date', e.target.value)} />
                               </div>
                               <div className="text-right">
                                   <button onClick={() => removeEducation(edu.id)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md">Eliminar</button>
                               </div>
                           </div>
                       ))}
                   </SectionWrapper>
                </>
            );
             case 'diseno': return (
                <SectionWrapper title="4. Diseño y Estilo del CV">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Diseño de Plantilla" name="layout" value={resumeData.style.layout} onChange={e => handleStyleChange('layout', e.target.value as StyleSettings['layout'])}>
                            {LAYOUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </FormSelect>
                         <FormSelect label="Tema Predefinido" name="theme" value="" onChange={e => { const theme = PREDEFINED_THEMES.find(t => t.name === e.target.value); if (theme) setResumeData(prev => ({...prev, style: {...prev.style, ...theme.styles}}))}}>
                             <option value="">Selecciona un tema...</option>
                            {PREDEFINED_THEMES.map(theme => <option key={theme.name} value={theme.name}>{theme.name}</option>)}
                        </FormSelect>
                    </div>
                    <FormInput label="Foto de Perfil (URL)" name="profilePictureUrl" value={resumeData.style.profilePictureUrl} onChange={e => handleStyleChange('profilePictureUrl', e.target.value)} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center p-3 bg-gray-800/70 rounded-md border border-gray-700">
                        <label className="flex flex-col items-center gap-1 text-sm">Color Hoja<input type="color" value={resumeData.style.sheetColor} onChange={e => handleStyleChange('sheetColor', e.target.value)} /></label>
                        <label className="flex flex-col items-center gap-1 text-sm">Color Texto<input type="color" value={resumeData.style.textColor} onChange={e => handleStyleChange('textColor', e.target.value)} /></label>
                        <label className="flex flex-col items-center gap-1 text-sm">Color Borde<input type="color" value={resumeData.style.borderColor} onChange={e => handleStyleChange('borderColor', e.target.value)} /></label>
                        <label className="flex flex-col items-center gap-1 text-sm">Título Sección<input type="color" value={resumeData.style.sectionTitleColor} onChange={e => handleStyleChange('sectionTitleColor', e.target.value)} /></label>
                        <label className="flex flex-col items-center gap-1 text-sm">Fondo Skill<input type="color" value={resumeData.style.skillBackgroundColor} onChange={e => handleStyleChange('skillBackgroundColor', e.target.value)} /></label>
                        <label className="flex flex-col items-center gap-1 text-sm">Texto Skill<input type="color" value={resumeData.style.skillTextColor} onChange={e => handleStyleChange('skillTextColor', e.target.value)} /></label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Fondo de Encabezado" name="headerBackgroundType" value={resumeData.style.headerBackgroundType} onChange={e => handleStyleChange('headerBackgroundType', e.target.value as 'color' | 'image')}>
                            <option value="color">Color</option>
                            <option value="image">Imagen</option>
                        </FormSelect>
                        {resumeData.style.headerBackgroundType === 'color' && (
                            <div className="flex items-end gap-2">
                                <label className="flex flex-col items-center gap-1 text-sm">Color Encabezado<input type="color" value={resumeData.style.headerColor} onChange={e => handleStyleChange('headerColor', e.target.value)} /></label>
                            </div>
                        )}
                    </div>
                     {resumeData.style.headerBackgroundType === 'image' && (
                        <div>
                             <FormInput label="Buscar imagen de fondo" name="imageSearch" type="text" placeholder="Ej: abstract technology background" value={imageSearchQuery} onChange={e => setImageSearchQuery(e.target.value)} />
                             {isImageSearchLoading && <p className="text-sm text-center">Buscando...</p>}
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto">
                                {imageSearchResults.map(url => (
                                    <img key={url} src={url} onClick={() => handleStyleChange('headerImageUrl', url)} className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-75" />
                                ))}
                             </div>
                        </div>
                     )}

                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                         <FormSelect label="Fuente del Texto" name="fontFamily" value={resumeData.style.fontFamily} onChange={e => handleStyleChange('fontFamily', e.target.value)}>
                            <option value="Inter">Inter (Sans-serif)</option>
                            <option value="Lora">Lora (Serif)</option>
                            <option value="Roboto Slab">Roboto Slab (Slab Serif)</option>
                            <option value="Source Code Pro">Source Code Pro (Monospace)</option>
                        </FormSelect>
                         <FormSelect label="Forma Foto Perfil" name="profilePictureShape" value={resumeData.style.profilePictureShape} onChange={e => handleStyleChange('profilePictureShape', e.target.value as 'circle' | 'square' | 'brush')}>
                            <option value="circle">Círculo</option>
                            <option value="square">Cuadrado</option>
                            <option value="brush">Pincelada</option>
                        </FormSelect>
                          <FormSelect label="Posición Foto Perfil" name="profilePicturePosition" value={resumeData.style.profilePicturePosition} onChange={e => handleStyleChange('profilePicturePosition', e.target.value as 'left' | 'center' | 'right')}>
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                        </FormSelect>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Tamaño Foto Perfil: {resumeData.style.profilePictureSize}px</label>
                        <input type="range" min="64" max="256" step="8" value={resumeData.style.profilePictureSize} onChange={e => handleStyleChange('profilePictureSize', parseInt(e.target.value))} className="w-full" />
                    </div>
                </SectionWrapper>
            );
            case 'diseno_carta': return (
                <SectionWrapper title="Diseño Carta de Presentación">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <FormSelect label="Fuente del Texto" name="coverLetterFontFamily" value={resumeData.coverLetterStyle.fontFamily} onChange={e => handleCoverLetterStyleChange('fontFamily', e.target.value)}>
                            <option value="Inter">Inter (Sans-serif)</option>
                            <option value="Lora">Lora (Serif)</option>
                            <option value="Roboto Slab">Roboto Slab (Slab Serif)</option>
                            <option value="Source Code Pro">Source Code Pro (Monospace)</option>
                        </FormSelect>
                        <label className="flex flex-col items-center gap-1 text-sm">Color Texto<input type="color" value={resumeData.coverLetterStyle.textColor} onChange={e => handleCoverLetterStyleChange('textColor', e.target.value)} /></label>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-300">Tamaño de Fuente: {resumeData.coverLetterStyle.fontSize}pt</label>
                        <input type="range" min="8" max="16" step="1" value={resumeData.coverLetterStyle.fontSize} onChange={e => handleCoverLetterStyleChange('fontSize', parseInt(e.target.value))} className="w-full" />
                    </div>
                </SectionWrapper>
            );
            case 'carta': return (
                <SectionWrapper title="5. Carta de Presentación">
                    <div className="relative">
                        <FormTextarea label="Contenido de la Carta" name="coverLetter" value={resumeData.coverLetter} onChange={e => handleInputChange('coverLetter', e.target.value)} rows={20} aiAction={() => handleAIGenerate('coverLetter', () => geminiService.generateAICoverLetter(resumeData))} aiLoading={loadingStates.coverLetter}/>
                         <div className="absolute top-0 right-10 flex items-center gap-1">
                            <TextToSpeechButton textToSpeak={resumeData.coverLetter} />
                            <AiButton onClick={() => openAiEditModal(resumeData.coverLetter, (newText) => handleInputChange('coverLetter', newText))} title="Editar con Asistente IA" />
                        </div>
                    </div>
                </SectionWrapper>
            );
            default: return null;
        }
    }

    return (
        <div className="form-container flex bg-gray-900">
             <aside className="w-48 bg-gray-900/80 p-4 border-r border-gray-700/50 flex flex-col space-y-2">
                 {menuItems.map(item => (
                     <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        disabled={item.disabled}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeMenu === item.id 
                                ? 'bg-sky-500 text-white' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {item.label}
                    </button>
                 ))}
             </aside>
            <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderContent()}
                <footer className="mt-8 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
                    <details className="group mb-4">
                        <summary className="flex items-center justify-between font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer list-none">
                            <span>Cómo funciona esta herramienta</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div className="mt-2 pl-2 space-y-1 text-gray-400">
                            <p><strong className="text-sky-400">Paso 1: Análisis Inicial.</strong> Pega la descripción del puesto y tu CV actual para que la IA analice tu compatibilidad y te dé una ventaja estratégica.</p>
                            <p><strong className="text-sky-400">Paso 2: Genera Contenido.</strong> Usa los botones de IA ✨ para generar o mejorar el contenido de cada sección de tu CV y carta de presentación.</p>
                            <p><strong className="text-sky-400">Paso 3: Diseña y Descarga.</strong> Personaliza el diseño de tu CV, elige plantillas, colores y fuentes. Finalmente, descarga el resultado en formato HTML.</p>
                        </div>
                    </details>
                    <div className="text-center">
                        <p className="font-semibold">BY BRAINMARK LAB | DIGITALMAKERS &copy; 2025</p>
                        <p className="mt-1 text-yellow-400">Esta es una herramienta gratuita y queda prohibida su venta.</p>
                    </div>
                </footer>
            </div>
             <AiEditModal
                isOpen={isAiEditModalOpen}
                onClose={() => setIsAiEditModalOpen(false)}
                onConfirm={(newText) => {
                    if (aiEditCallbackRef.current) {
                        aiEditCallbackRef.current.onConfirm(newText);
                    }
                    setIsAiEditModalOpen(false);
                }}
                onAction={handleAiEdit}
                originalText={aiEditModalContent.originalText}
                suggestedText={aiEditModalContent.suggestedText}
                isLoading={isAiEditLoading}
            />
        </div>
    );
};