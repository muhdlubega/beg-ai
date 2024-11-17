import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

async function fileToGenerativePart(file: File) {
  const bytes = await file.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(bytes).toString('base64'),
      mimeType: file.type
    },
  };
}

export async function* getGeminiResponse(prompt: string, files?: File[]) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    let response;
    if (files && files.length > 0) {
      const generativeParts = await Promise.all(files.map(fileToGenerativePart));
      const imageParts = [prompt, ...generativeParts];
      response = await model.generateContentStream(imageParts);
    } else {
      response = await model.generateContentStream(prompt);
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