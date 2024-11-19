import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function fileToGenerativePart(file: File) {
  const bytes = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(bytes).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  return {
    inlineData: {
      data: base64,
      mimeType: file.type
    },
  };
}

export async function* getGeminiResponse(prompt: string, files?: File[], context?: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const fullPrompt = context 
      ? `${context}\nUser: ${prompt}`
      : prompt;

    let response;
    if (files && files.length > 0) {
      const generativeParts = await Promise.all(files.map(fileToGenerativePart));
      const imageParts = [fullPrompt, ...generativeParts];
      response = await model.generateContentStream(imageParts);
    } else {
      response = await model.generateContentStream(fullPrompt);
    }
    
    for await (const chunk of response.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    yield 'John is on a short break. Please try again later';
  }
}