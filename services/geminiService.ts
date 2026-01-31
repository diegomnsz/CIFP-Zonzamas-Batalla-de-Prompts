
import { GoogleGenAI, Type } from "@google/genai";
import { Scenario } from "../types";

// IMPORTANTE: En producción real, esto debería ser una variable de entorno.
// Como lo vas a subir a un servidor estático vía FileZilla, puedes poner tu clave aquí 
// O usar import.meta.env.VITE_API_KEY si usas un archivo .env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MULTI_CHALLENGE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mainTopic: { type: Type.STRING, description: "Tema general del área" },
    subTopic: { type: Type.STRING, description: "Subtema específico que une los 3 retos" },
    educationalCycle: { type: Type.STRING, description: "Ciclo formativo vinculado" },
    challenges: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "requirements"]
        },
        image: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "requirements"]
        },
        video: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "requirements"]
        }
      },
      required: ["text", "image", "video"]
    }
  },
  required: ["mainTopic", "subTopic", "educationalCycle", "challenges"]
};

export const generateWeeklyChallenge = async (week: number, challengeNumber: number): Promise<Scenario> => {
  const educationalOffer = [
    "Administración y Finanzas", "Cocina", "DAM", "DAW", "ASIR", "Automoción", "Mantenimiento Aeromecánico", "Higiene Bucodental", "Turismo", "Energías Renovables"
  ];

  const cycle = educationalOffer[Math.floor(Math.random() * educationalOffer.length)];

  const prompt = `Actúa como un experto en IA y Formación Profesional. Genera el RETO número ${challengeNumber} para la semana ${week}.
  
  CONTEXTO: CIFP Zonzamas (Lanzarote). 
  CICLO FORMATIVO: "${cycle}".
  
  REGLA CRÍTICA: Debes crear 3 retos (texto, imagen, vídeo) que giren en torno a un MISMO subtema técnico real y actual de ese ciclo. 
  Los retos deben ser realistas, divertidos y fomentar el uso de prompts complejos.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: MULTI_CHALLENGE_SCHEMA,
    },
  });

  const data = JSON.parse(response.text.trim());
  return { 
    ...data, 
    id: `challenge-${challengeNumber}-${Date.now()}`, 
    week, 
    number: challengeNumber,
    createdAt: new Date().toISOString()
  } as Scenario;
};
