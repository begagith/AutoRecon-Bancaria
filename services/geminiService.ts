import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export const analyzeDiscrepancy = async (
  transaction: Transaction,
  apiKey: string
): Promise<string> => {
  if (!apiKey) return "Clave API no configurada.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Based on the transaction details, suggest a reason for the discrepancy
    const prompt = `
      Actúa como un contador auditor experto. Analiza la siguiente transacción bancaria no conciliada y sugiere un posible motivo y el asiento contable de ajuste.
      
      Transacción:
      Fecha: ${transaction.date}
      Descripción: ${transaction.description}
      Monto: ${transaction.amount}
      Tipo: ${transaction.type === 'DEBIT' ? 'Cargo (Salida)' : 'Abono (Entrada)'}
      Fuente: ${transaction.source}

      Responde brevemente en español con:
      1. Posible Causa (ej. Comisión bancaria, Cheque en tránsito, Error de dedo).
      2. Acción Recomendada.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar un análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el servicio de IA.";
  }
};
