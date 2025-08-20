import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';
import { ResumeTemplate } from './templates/ResumeTemplate';
import * as geminiService from '../services/geminiService';
import { AiSparkles } from './ui/AiSparkles';

interface ResumePreviewProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  pageContainerRef: React.RefObject<HTMLDivElement>;
  loadingStates: Record<string, boolean>;
  setLoadingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData, setResumeData, pageContainerRef, loadingStates, setLoadingStates }) => {
    const [showCoverLetter, setShowCoverLetter] = useState(true);
    const [isTranslating, setIsTranslating] = useState(false);
    const [pdfRenderData, setPdfRenderData] = useState<ResumeData | null>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copiar a Portapapeles');

    const dataToRender = pdfRenderData || resumeData;

    const generateAndDownloadHtml = (element: HTMLDivElement, fileName: string) => {
        const content = element.innerHTML;
        const svgDefs = document.querySelector('svg[aria-hidden="true"]')?.innerHTML || '';
      
        const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Slab:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem;
            box-sizing: border-box;
        }
        .font-serif { font-family: 'Lora', serif; }
        .font-slab { font-family: 'Roboto Slab', serif; }
        .font-mono { font-family: 'Source Code Pro', monospace; }
        #page-container {
            width: 100%;
        }
        .resume-page {
            background-color: white;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            width: 100%;
            max-width: 8.5in;
            min-height: 11in;
            margin: 1rem auto;
            page-break-after: always;
            position: relative;
        }
        @media print {
           body {
               background-color: white;
               padding: 0;
           }
           .resume-page {
               margin: 0;
               box-shadow: none;
               width: 100%;
               max-width: 100%;
               min-height: 0;
               height: auto;
           }
           .item-wrapper {
               break-inside: avoid;
               page-break-inside: avoid;
           }
           h2, h3, h4 {
               break-after: avoid;
               page-break-after: avoid;
           }
           .resume-page:last-child {
               page-break-after: auto;
           }
        }
    </style>
</head>
<body>
    <svg style="width:0; height:0; position:absolute;" aria-hidden="true" focusable="false">
        <defs>
            ${svgDefs}
        </defs>
    </svg>
    <div id="page-container">${content}</div>
</body>
</html>`;
      
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName.replace(/ /g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    useEffect(() => {
        if (pdfRenderData && pageContainerRef.current) {
            const fileName = `Resume - ${pdfRenderData.personal.name} - ${pdfRenderData.personal.title}`;
            generateAndDownloadHtml(pageContainerRef.current, fileName);
            setPdfRenderData(null); // Restablecer después de la descarga
        }
    }, [pdfRenderData, pageContainerRef]);

    const handleDownloadHtml = () => {
        if (!pageContainerRef.current) return;
        setPdfRenderData(null);
         setTimeout(() => {
            if (!pageContainerRef.current) return;
            const fileName = `CV - ${resumeData.personal.name} - ${resumeData.personal.title}`;
            generateAndDownloadHtml(pageContainerRef.current, fileName);
        }, 0);
    };

    const handleEnglishDownload = async () => {
        setIsTranslating(true);
        try {
            const translatedData = await geminiService.translateResumeData(resumeData);
            setPdfRenderData({ ...translatedData, style: resumeData.style });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Ocurrió un error durante la traducción.");
        } finally {
            setIsTranslating(false);
        }
    };
    
    const handleCopyToClipboard = async () => {
        if (!pageContainerRef.current || !navigator.clipboard.write) {
            alert('Tu navegador no soporta la función de copiar al portapapeles o ha ocurrido un error.');
            return;
        }

        try {
            const htmlContent = pageContainerRef.current.innerHTML;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([clipboardItem]);

            setCopyButtonText('¡Copiado!');
            setTimeout(() => {
                setCopyButtonText('Copiar a Portapapeles');
            }, 2000);

        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            try {
                const content = pageContainerRef.current.innerText;
                await navigator.clipboard.writeText(content);
                 setCopyButtonText('¡Copiado (solo texto)!');
                 setTimeout(() => {
                    setCopyButtonText('Copiar a Portapapeles');
                }, 2000);
            } catch (fallbackError) {
                 console.error('Fallback copy failed:', fallbackError);
                 setCopyButtonText('Error al copiar');
                 setTimeout(() => {
                    setCopyButtonText('Copiar a Portapapeles');
                }, 2000);
            }
        }
    };

    const handleRecalculate = async () => {
        if (!resumeData.aiAnalysis) return;

        setLoadingStates(prev => ({ ...prev, compatibility: true }));
        try {
            const newQualification = await geminiService.recalculateCompatibility(resumeData);
            setResumeData(prev => ({
                ...prev,
                aiAnalysis: {
                    ...prev.aiAnalysis!,
                    qualification: newQualification,
                }
            }));
        } catch (e) {
            console.error("Failed to recalculate compatibility", e);
            alert(e instanceof Error ? e.message : "Hubo un error al recalcular la compatibilidad.");
        } finally {
            setLoadingStates(prev => ({ ...prev, compatibility: false }));
        }
    };

  return (
    <div className="preview-container p-4 sm:p-6 lg:p-8 bg-gray-800/50">
        <div id="preview-area" className="w-full h-full">
            <div className="mt-0 mb-4 flex justify-center items-center flex-wrap gap-4 no-print">
                <button onClick={handleDownloadHtml} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    Descargar HTML
                </button>
                <button onClick={handleEnglishDownload} disabled={isTranslating} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center gap-2 disabled:bg-teal-700 disabled:cursor-wait">
                    <AiSparkles isLoading={isTranslating} className="w-4 h-4" />
                    {isTranslating ? 'Traduciendo...' : 'Descargar en Inglés'}
                </button>
                 <button onClick={handleCopyToClipboard} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                    {copyButtonText}
                </button>
                 {resumeData.aiAnalysis && (
                    <div className="bg-gray-700 text-white py-2 px-4 rounded-md text-sm flex items-center gap-3">
                       <span className="font-medium">Compatibilidad:</span>
                       {loadingStates.compatibility ? (
                            <AiSparkles isLoading={true} className="w-5 h-5" />
                       ) : (
                           <span className="font-bold text-sky-300">{resumeData.aiAnalysis.qualification.qualifiedPercentage}%</span>
                       )}
                       <button onClick={handleRecalculate} disabled={loadingStates.compatibility} title="Recalcular Compatibilidad" className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-600 disabled:cursor-wait disabled:text-gray-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 12A8 8 0 1013 5.23" />
                           </svg>
                       </button>
                    </div>
                )}
                 {resumeData.coverLetter && (
                    <div className="flex items-center">
                        <input
                            id="show-cover-letter"
                            type="checkbox"
                            checked={showCoverLetter}
                            onChange={() => setShowCoverLetter(!showCoverLetter)}
                            className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500"
                        />
                        <label htmlFor="show-cover-letter" className="ml-2 text-sm font-medium text-gray-300">
                           Incluir Carta
                        </label>
                    </div>
                )}
            </div>
            <div id="page-container" ref={pageContainerRef}>
                {dataToRender.coverLetter && showCoverLetter && (
                    <ResumeTemplate data={dataToRender} isCoverLetter={true} />
                )}
                <ResumeTemplate data={dataToRender} />
            </div>
        </div>
    </div>
  );
};