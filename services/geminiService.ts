import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY eksik.");
    throw new Error("API Key bulunamadı.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeSchedule = async (
  month: string, 
  shifts: string[]
): Promise<string> => {
  try {
    const ai = getAIClient();

    const prompt = `
      Ben bir nöbet usulü çalışanım ve ${month} ayı için nöbet programım şu şekilde:

      ${shifts.length > 0 
        ? `Nöbet günlerim: ${shifts.join(', ')}.` 
        : `Bu ay için henüz nöbetim yok.`
      }

      Lütfen programımın kısa, samimi ve faydalı bir analizini yap:
      1. Toplam nöbet sayısını belirt (0 ise bunu vurgula).
      2. Programın yoğunluğunu değerlendir (boşsa dinlenme fırsatından bahset).
      3. Kısa bir motivasyon cümlesi veya tavsiye ver.

      Tonu pozitif, samimi ve destekleyici olsun.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Program analizi hatası:", error);
    return "Şu anda programını analiz edemiyorum. API anahtarını kontrol et.";
  }
};
