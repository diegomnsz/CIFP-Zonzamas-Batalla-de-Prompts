
import { GoogleGenAI, Type } from "@google/genai";
import { Scenario } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    "Administración y Finanzas", "Cocina", "DAM", "DAW", "ASIR", "Automoción", "Mantenimiento Aeromecánico", "Higiene Bucodental"
  ];

  const cycle = educationalOffer[Math.floor(Math.random() * educationalOffer.length)];

  const prompt = `Actúa como un experto en IA y FP. Genera el RETO número ${challengeNumber} para la semana ${week}.
  
  REGLA CRÍTICA: Los 3 retos (texto, imagen, vídeo) DEBEN tratar sobre el MISMO subtema técnico específico del ciclo "${cycle}".
  
  El contenido debe ser desafiante y fomentar el uso avanzado de prompts.`;

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
    id: `challenge-${challengeNumber}`, 
    week, 
    number: challengeNumber,
    createdAt: new Date().toISOString()
  } as Scenario;
};
