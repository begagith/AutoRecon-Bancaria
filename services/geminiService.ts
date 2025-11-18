import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export const analyzeDiscrepancy = async (
  transaction: Transaction
): Promise<string> => {
  try {
    // Initialize the client with the environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prompt Engineering for Accounting Context
    const prompt = `
      Actúa como un contador auditor experto en conciliaciones bancarias. Analiza la siguiente transacción del extracto bancario que NO aparece en los libros contables de la empresa. Sugiere la causa y el asiento de ajuste.
      
      Detalles de la Transacción:
      - Fecha: ${transaction.date}
      - Descripción del Banco: "${transaction.description}"
      - Referencia: ${transaction.reference}
      - Monto: ${transaction.amount}
      - Tipo: ${transaction.type === 'DEBIT' ? 'DEBIT (Cargo/Salida de dinero del banco)' : 'CREDIT (Abono/Entrada de dinero al banco)'}

      Responde estrictamente con este formato:
      **Posible Causa:** [Causa breve, ej. Comisión bancaria, Intereses, Error]
      **Acción Contable:** [Acción, ej. Registrar Gasto, Registrar Ingreso]
      **Asiento Sugerido:** 
      - Debe: [Nombre de Cuenta Sugerida]
      - Haber: [Nombre de Cuenta Sugerida]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar un análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el servicio de IA. Verifique su API Key.";
  }
};