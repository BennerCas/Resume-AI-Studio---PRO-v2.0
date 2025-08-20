

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ResumeData, AiAnalysis, Experience, Education, QualificationAnalysis, CoverLetterStyleSettings } from '../types';

// The user-provided API key is now used directly, simplifying the setup.
const ai = new GoogleGenAI({ apiKey: "AIzaSyDA1Kyftj2oDEic9nBds2taZR6xhCzWISI" });

const handleApiError = (error: unknown): string => {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("429") || ((error as any).cause)?.message?.includes("RESOURCE_EXHAUSTED")) {
            return "Error: Has excedido tu cuota de uso de la API (Error 429). Por favor, revisa tu plan y facturación en Google AI Studio e inténtalo más tarde.";
        }
        if (error.message.includes("500") || error.message.includes("XHR") || error.message.includes("Rpc failed")) {
            return "Error: Hubo un problema de comunicación con el servidor de la IA (Error 500/XHR). Esto puede ser un problema temporal. Por favor, inténtalo de nuevo en unos minutos.";
        }
        if (error.message.includes("API key not valid")) {
            return "Error: La clave de API proporcionada no es válida. Por favor, compruébala en 'Ajustes'.";
        }
        return `Error: ${error.message}`;
    }
    return "Error: Ocurrió un error desconocido al contactar con la IA.";
};

const generateContent = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                topP: 1,
                topK: 1,
                maxOutputTokens: 8192,
            }
        });
        return response.text.trim();
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

const generateJsonContent = async <T,>(prompt: string, responseSchema: any): Promise<T> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Error generating or parsing JSON from Gemini API:", error);
        throw new Error(handleApiError(error));
    }
};

const createBaseContext = (data: ResumeData): string => {
    let context = '';

    if (data.aiAnalysis) {
        context += `
**ANÁLISIS ESTRATÉGICO CLAVE (Usar como guía principal):**
Este es un análisis previo de la compatibilidad del candidato con la oferta. Úsalo como la principal fuente de verdad para generar contenido relevante y enfocado.
- Posición y Encaje: ${data.aiAnalysis.question1}
- Resultados Clave que Demuestran Idoneidad: ${data.aiAnalysis.question2}
- Fortalezas Más Relevantes: ${data.aiAnalysis.question3}
- Potencial Indicado por Logros: ${data.aiAnalysis.question4}
- Resumen de Compatibilidad: ${data.aiAnalysis.qualification.summary}
---
`;
    }

    context += `
Contexto Adicional del Candidato:
- Puesto Deseado: ${data.personal.title}
- Habilidades: ${data.skills}
- Experiencia: ${data.experience.map(e => `${e.title} en ${e.company}`).join(', ')}

Contexto Adicional de la Oferta Laboral:
${data.jobDescription || "No se proporcionó una descripción del puesto."}
---
`;
    return context;
};

const STRICT_OUTPUT_RULE = "\n\n**REGLA CRÍTICA:** Tu respuesta DEBE contener ÚNICAMENTE el texto solicitado. NO incluyas frases introductorias, preámbulos, resúmenes, frases de cortesía, Markdown, asteriscos (*), numerales (#), ni ningún otro formato o texto explicativo. La salida debe ser directa e insertable en un formulario.";

interface CvContent {
    summary: string;
    achievements: string;
    strengths: string;
    skills: string;
    cta: string;
}

export const generateAllCvContent = (data: ResumeData): Promise<CvContent> => {
    const prompt = `
${createBaseContext(data)}

Basado en el contexto proporcionado, genera el contenido para las siguientes secciones del CV.

INSTRUCCIONES:
1.  **summary**: Un resumen profesional de 3-4 líneas enfocado en el valor que el candidato puede aportar.
2.  **achievements**: Una lista de 3-4 logros clave cuantificables. Cada logro debe empezar en una nueva línea con un guion ('- ').
3.  **strengths**: Una lista de 4-5 fortalezas clave (habilidades blandas y duras). Cada fortaleza debe empezar en una nueva línea con un guion ('- ').
4.  **skills**: Una lista de habilidades técnicas y blandas relevantes, separadas por comas.
5.  **cta**: Un párrafo de cierre conciso (2-3 líneas) que reitere el valor principal y termine con una llamada a la acción clara y profesional para agendar una conversación.

**REGLA CRÍTICA:** Responde ÚNICAMENTE con el objeto JSON solicitado en el schema. No incluyas ningún texto introductorio, explicaciones o Markdown.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Resumen profesional de 3-4 líneas." },
            achievements: { type: Type.STRING, description: "Lista de logros clave separados por saltos de línea y comenzando con guiones." },
            strengths: { type: Type.STRING, description: "Lista de fortalezas clave separadas por saltos de línea y comenzando con guiones." },
            skills: { type: Type.STRING, description: "Lista de habilidades relevantes separadas por comas." },
            cta: { type: Type.STRING, description: "Párrafo de cierre con llamada a la acción." },
        },
        required: ["summary", "achievements", "strengths", "skills", "cta"],
    };
    
    return generateJsonContent<CvContent>(prompt, responseSchema);
};

// --- Generation Functions ---
export const generateAITitle = (data: ResumeData) => generateContent(`${createBaseContext(data)}\nBasado en el contexto, sugiere un título de puesto conciso y profesional para el candidato.${STRICT_OUTPUT_RULE}`);
export const generateAIDefiningPhrase = (data: ResumeData) => generateContent(`${createBaseContext(data)}\nBasado en el contexto, genera una frase corta (tagline o lema profesional) que defina al candidato.${STRICT_OUTPUT_RULE}`);
export const generateAIExperienceDescription = (data: ResumeData, experienceTitle: string) => generateContent(`${createBaseContext(data)}\nGenera una descripción concisa en 3-4 puntos para el puesto de "${experienceTitle}". Cada punto debe empezar en una nueva línea con un guion ('- '). Enfócate en logros y responsabilidades clave alineados con la oferta laboral.${STRICT_OUTPUT_RULE}`);
export const generateAICta = (data: ResumeData) => generateContent(`${createBaseContext(data)}\nBasado en el contexto, genera un párrafo de cierre de 2-3 líneas para el CV. Debe resumir la propuesta de valor clave del candidato y terminar con una llamada a la acción profesional y directa, invitando a una conversación.${STRICT_OUTPUT_RULE}`);
export const generateAICoverLetter = (data: ResumeData) => {
    const prompt = `
${createBaseContext(data)}

INSTRUCCIONES DETALLADAS PARA LA CARTA DE PRESENTACIÓN:

Tu tarea es escribir una carta de presentación excepcional y altamente persuasiva en español, siguiendo estas instrucciones rigurosamente:

1.  **ESTRUCTURA PROFESIONAL:** La carta debe tener la siguiente estructura clara:
    *   **Introducción:** Comienza dirigiéndote al "Estimado equipo de contratación". Menciona el puesto específico al que se postula ("${data.personal.title}" o similar) y expresa un fuerte y genuino interés en la oportunidad.
    *   **Párrafo de Alineación:** Analiza la "Descripción del Puesto" del contexto. Identifica las 2-3 responsabilidades o requisitos más críticos. Conecta directamente la experiencia y habilidades del candidato con estos puntos. **Integra palabras clave** de la descripción del puesto de forma natural para demostrar una comprensión profunda del rol.
    *   **Párrafo de Impacto:** Destaca uno o dos logros cuantificables de la experiencia del candidato que demuestren su valor. Comienza las frases con **verbos de acción potentes** (ej: Lideré, Implementé, Optimicé, Aumenté) para mostrar iniciativa e impacto.
    *   **Párrafo de Cierre:** Reitera el entusiasmo por el puesto y la empresa. Menciona brevemente por qué el candidato se siente atraído por la misión o los valores de la empresa. Finaliza con una llamada a la acción proactiva, como "Agradezco su tiempo y consideración, y espero con interés la posibilidad de conversar sobre cómo mi experiencia puede beneficiar a su equipo".
    *   **Cierre Formal:** Termina con "Atentamente," seguido en una nueva línea por el nombre del candidato: "${data.personal.name}".

2.  **TONO Y LENGUAJE:**
    *   El tono debe ser profesional, seguro y genuinamente entusiasta.
    *   Evita clichés. Cada frase debe ser específica y aportar valor.

3.  **REGLAS DE SALIDA CRÍTICAS:**
    *   Responde ÚNICAMENTE con el texto completo de la carta de presentación.
    *   No incluyas comentarios, títulos, explicaciones, Markdown, asteriscos, ni ninguna otra cosa que no sea la carta en sí.

Ahora, genera la carta.`;
    return generateContent(prompt);
};

// --- Text Editing Suite Functions ---
const editTextWithInstruction = async (textToEdit: string, instruction: string, context: string): Promise<string> => {
    const prompt = `${context}\n\nINSTRUCCIÓN: ${instruction}\n\nTEXTO A EDITAR:\n---\n${textToEdit}\n---${STRICT_OUTPUT_RULE}`;
    return generateContent(prompt);
};

export const rephraseText = (text: string, data: ResumeData) => 
    editTextWithInstruction(text, "Reformula el siguiente texto para que sea más impactante y profesional. Mejora la claridad y el flujo, pero mantén el significado central y la longitud aproximada.", createBaseContext(data));

export const shortenText = (text: string, data: ResumeData) =>
    editTextWithInstruction(text, "Acorta el siguiente texto, haciéndolo más conciso y directo. Elimina palabras y frases redundantes sin perder información clave o logros.", createBaseContext(data));
    
export const expandText = (text: string, data: ResumeData) =>
    editTextWithInstruction(text, "Expande el siguiente texto. Añade más detalles, contexto o ejemplos, manteniendo un tono profesional y alineado con la descripción del puesto y el perfil del candidato proporcionados.", createBaseContext(data));

export const changeTone = (text: string, tone: string, data: ResumeData) =>
    editTextWithInstruction(text, `Reescribe el siguiente texto para que tenga un tono ${tone}. Adapta el vocabulario y la estructura de las frases en consecuencia.`, createBaseContext(data));

export const fixGrammar = (text: string, data: ResumeData) =>
    editTextWithInstruction(text, "Corrige cualquier error de ortografía, gramática y puntuación en el siguiente texto. Asegúrate de que esté limpio y profesional.", createBaseContext(data));

// --- CV Analysis ---
interface ExtractedCvData {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    summary?: string;
    skills?: string;
    experience?: (Omit<Experience, 'id'>)[];
    education?: (Omit<Education, 'id'>)[];
}

interface CVAnalysisResponse {
    extractedData: ExtractedCvData;
    analysis: AiAnalysis;
}

export const analyzeCVAndJob = (cvText: string, jobDesc: string): Promise<CVAnalysisResponse> => {
    const prompt = `Analiza el siguiente CV y la descripción del puesto. Extrae la información en el formato JSON especificado y proporciona un análisis estratégico.

CV del Candidato:
---
${cvText}
---

Descripción del Puesto:
---
${jobDesc}
---

Tu tarea es:
1.  Extraer los datos del CV en la estructura de 'extractedData'.
2.  Responder a las 4 preguntas de análisis estratégico basándote en la correspondencia entre el CV y la descripción del puesto. Sé conciso y estratégico en tus respuestas.
3.  Proporcionar un análisis de calificación como un objeto JSON con tres claves: 'qualifiedPercentage', 'notQualifiedPercentage', 'overqualifiedPercentage'. Deben ser números que representen un porcentaje y sumar 100. Incluye también una clave 'summary' con una breve explicación de 1-2 frases para tu análisis. Adicionalmente, para cada categoría (cualificado, no cualificado, sobrecualificado), proporciona un argumento conciso en las claves 'qualifiedArgument', 'notQualifiedArgument', y 'overqualifiedArgument' respectivamente, explicando por qué asignaste ese porcentaje.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            extractedData: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    title: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    skills: { type: Type.STRING, description: "Lista de habilidades separadas por coma" },
                    experience: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                company: { type: Type.STRING },
                                date: { type: Type.STRING },
                                description: { type: Type.STRING, description: "Descripción del puesto en viñetas" },
                            },
                        },
                    },
                    education: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                degree: { type: Type.STRING },
                                school: { type: Type.STRING },
                                date: { type: Type.STRING },
                            },
                        },
                    },
                },
            },
            analysis: {
                type: Type.OBJECT,
                properties: {
                    question1: { type: Type.STRING, description: "¿Qué puesto se está buscando exactamente y cómo encaja el candidato?" },
                    question2: { type: Type.STRING, description: "¿Qué resultados concretos del CV demuestran que encaja en el rol?" },
                    question3: { type: Type.STRING, description: "¿Qué habilidades y fortalezas clave del candidato son más relevantes para la oferta?" },
                    question4: { type: Type.STRING, description: "¿Qué logros específicos indican lo que podría conseguir en el futuro en esta empresa?" },
                    qualification: {
                        type: Type.OBJECT,
                        properties: {
                            qualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán cualificado está el candidato." },
                            notQualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán no cualificado está el candidato." },
                            overqualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán sobrecualificado está el candidato." },
                            summary: { type: Type.STRING, description: "Un breve resumen del análisis de calificación." },
                            qualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'cualificado'." },
                            notQualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'no cualificado'." },
                            overqualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'sobrecualificado'." }
                        },
                        required: ["qualifiedPercentage", "notQualifiedPercentage", "overqualifiedPercentage", "summary", "qualifiedArgument", "notQualifiedArgument", "overqualifiedArgument"]
                    }
                },
            },
        },
    };

    return generateJsonContent<CVAnalysisResponse>(prompt, responseSchema);
};

export const recalculateCompatibility = (data: ResumeData): Promise<QualificationAnalysis> => {
    if (!data.cvInput && !data.summary) {
        return Promise.reject(new Error("No se puede recalcular la compatibilidad sin datos del CV."));
    }
    if (!data.jobDescription) {
        return Promise.reject(new Error("No se puede recalcular la compatibilidad sin una descripción del puesto."));
    }

    const cvText = data.cvInput || `Resumen: ${data.summary}\nHabilidades: ${data.skills}\nExperiencia: ${data.experience.map(e => `${e.title} en ${e.company}: ${e.description}`).join('\n')}`;

    const prompt = `Re-evalúa la compatibilidad basándote en el CV y la descripción del puesto proporcionados. Devuelve únicamente el objeto JSON 'qualification'.

CV del Candidato:
---
${cvText}
---

Descripción del Puesto:
---
${data.jobDescription}
---

Tu única tarea es recalcular y devolver el objeto JSON 'qualification' con los porcentajes de compatibilidad (qualified, notQualified, overqualified), un resumen conciso y los argumentos para cada porcentaje. La suma de los porcentajes debe ser 100.`;

    const qualificationSchema = {
        type: Type.OBJECT,
        properties: {
            qualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán cualificado está el candidato." },
            notQualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán no cualificado está el candidato." },
            overqualifiedPercentage: { type: Type.NUMBER, description: "Porcentaje de cuán sobrecualificado está el candidato." },
            summary: { type: Type.STRING, description: "Un breve resumen del análisis de calificación." },
            qualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'cualificado'." },
            notQualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'no cualificado'." },
            overqualifiedArgument: { type: Type.STRING, description: "Argumento conciso que justifica el porcentaje de 'sobrecualificado'." }
        },
        required: ["qualifiedPercentage", "notQualifiedPercentage", "overqualifiedPercentage", "summary", "qualifiedArgument", "notQualifiedArgument", "overqualifiedArgument"]
    };

    return generateJsonContent<QualificationAnalysis>(prompt, qualificationSchema);
};


// --- Translation Function ---

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        personal: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Translate the person's name only if it's a common name with a clear English equivalent, otherwise keep the original." },
                title: { type: Type.STRING },
                definingPhrase: { type: Type.STRING },
            },
            required: ['name', 'title', 'definingPhrase'],
        },
        summary: { type: Type.STRING },
        achievements: { type: Type.STRING },
        strengths: { type: Type.STRING },
        skills: { type: Type.STRING, description: "A comma-separated list of translated skills." },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    company: { type: Type.STRING },
                    date: { type: Type.STRING, description: "Do not translate dates." },
                    description: { type: Type.STRING, description: "Description of the job, potentially with bullet points." },
                },
                 required: ['title', 'company', 'date', 'description'],
            },
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    degree: { type: Type.STRING },
                    school: { type: Type.STRING },
                    date: { type: Type.STRING, description: "Do not translate dates." },
                },
                required: ['degree', 'school', 'date'],
            },
        },
        coverLetter: { type: Type.STRING },
        cta: { type: Type.STRING },
    },
     required: ['personal', 'summary', 'achievements', 'strengths', 'skills', 'experience', 'education', 'coverLetter', 'cta'],
};

type TranslatableData = {
    personal: { name: string; title: string; definingPhrase: string; };
    summary: string;
    achievements: string;
    strengths: string;
    skills: string;
    experience: Omit<Experience, 'id'>[];
    education: Omit<Education, 'id'>[];
    coverLetter: string;
    cta: string;
}

export const translateResumeData = async (data: ResumeData): Promise<ResumeData> => {
    const dataToTranslate: TranslatableData = {
        personal: {
            name: data.personal.name,
            title: data.personal.title,
            definingPhrase: data.personal.definingPhrase,
        },
        summary: data.summary,
        achievements: data.achievements,
        strengths: data.strengths,
        skills: data.skills,
        experience: data.experience.map(({ id, ...rest }) => rest),
        education: data.education.map(({ id, ...rest }) => rest),
        coverLetter: data.coverLetter,
        cta: data.cta,
    };

    const prompt = `Translate the text fields in the following JSON object from Spanish to English.
- Only translate the string values. Do not alter the keys.
- Do not translate proper nouns like most company names or people's names unless they have a common English equivalent.
- Preserve the original JSON structure exactly as specified in the schema.
- For text fields that contain bullet points (lines starting with '- '), maintain this formatting in the translated output.
- Return ONLY the translated JSON object.

JSON to translate:
${JSON.stringify(dataToTranslate, null, 2)}
`;

    const translatedSubset = await generateJsonContent<TranslatableData>(prompt, translationSchema);

    // Reconstruct the full ResumeData object by merging translated fields into the original data.
    const translatedData: ResumeData = {
        ...data,
        personal: {
            ...data.personal,
            name: translatedSubset.personal.name || data.personal.name,
            title: translatedSubset.personal.title || data.personal.title,
            definingPhrase: translatedSubset.personal.definingPhrase || data.personal.definingPhrase,
        },
        summary: translatedSubset.summary || data.summary,
        achievements: translatedSubset.achievements || data.achievements,
        strengths: translatedSubset.strengths || data.strengths,
        skills: translatedSubset.skills || data.skills,
        experience: data.experience.map((originalExp, index) => ({
            ...originalExp,
            ...(translatedSubset.experience[index] || {}),
        })),
        education: data.education.map((originalEdu, index) => ({
            ...originalEdu,
            ...(translatedSubset.education[index] || {}),
        })),
        coverLetter: translatedSubset.coverLetter || data.coverLetter,
        cta: translatedSubset.cta || data.cta,
    };
    return translatedData;
};

export const generatePomodoroSuggestion = (): Promise<string> => {
    const prompt = "Sugiere una actividad creativa y corta (de 1 a 2 frases) para hacer en un descanso de 5 minutos para refrescar la mente. Sé directo y amigable.";
    return generateContent(prompt);
};