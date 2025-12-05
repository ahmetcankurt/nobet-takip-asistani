import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeSchedule = async (
  month: string, 
  shifts: string[]
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    // Sort shifts for better context
    const sortedShifts = [...shifts].sort();
    
    const prompt = `
      Ben bir sağlık çalışanıyım/nöbet usulü çalışan biriyim. İşte ${month} ayı için çalışma programım.
      Nöbet tuttuğum günler şunlar: ${sortedShifts.join(', ')}.
      
      Lütfen nöbet programımın Türkçe olarak kısa, samimi ve faydalı bir analizini yap:
      1. Toplam nöbet sayısını belirt.
      2. Peş peşe (blok) nöbetler veya hafta sonu nöbetleri olup olmadığını kontrol et.
      3. Bu iş yüküne göre bana kısa bir motivasyon cümlesi veya sağlık/dinlenme tavsiyesi ver.
      
      Tonu pozitif ve destekleyici tut.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Error analyzing schedule:", error);
    return "Üzgünüm, şu anda programını analiz edemiyorum. Lütfen API anahtarını kontrol et.";
  }
};