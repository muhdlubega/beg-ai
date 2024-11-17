import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({apiKey: import.meta.env.VITE_MISTRAL_API_KEY});

export async function* getMistralResponse(prompt: string, files?: File[]) {
  try {
    let content = prompt;
    
    if (files && files.length > 0) {
      const fileDescriptions = await Promise.all(files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          return `[Image: ${file.name}]`;
        }
        const text = await file.text();
        return `[Document Content: ${text}]`;
      }));
      content = `${prompt}\n\nAttached files:\n${fileDescriptions.join('\n')}`;
    }

    const stream = await mistral.chat.stream({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content }
      ],
    });

    for await (const chunk of stream) {
      if (chunk.data.choices[0]?.delta?.content) {
        yield chunk.data.choices[0].delta.content;
      }
    }
  } catch (error) {
    console.error("Mistral API Error:", error);
    yield "Suzie is on a short break. Please try again later";
  }
}