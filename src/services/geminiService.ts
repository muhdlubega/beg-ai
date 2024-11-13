import { GoogleGenerativeAI  } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getGeminiResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(prompt);
    return response.response.text() || 'No response from Gemini.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'Error fetching response from Gemini.';
  }
}