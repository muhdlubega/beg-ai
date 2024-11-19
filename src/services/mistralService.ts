import { Mistral } from '@mistralai/mistralai';

type TextContent = {
  type: 'text';
  text: string;
}

type ImageContent = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

type ContentPart = TextContent | ImageContent;

type MistralMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
};

const mistral = new Mistral({ apiKey: import.meta.env.VITE_MISTRAL_API_KEY });

export async function* getMistralResponse(
  prompt: string,
  files?: File[],
  context?: string,
) {
  try {
    let messages: MistralMessage[] = [];
    if (context) {
      const contextLines = context.split('\n');
      for (const line of contextLines) {
        const [role, ...contentParts] = line.split(': ');
        const messageContent = contentParts.join(': ');

        messages.push({
          role: role.toLowerCase() === 'you' ? 'user' : 'assistant',
          content: messageContent
        });
      }
    }

    if (files && files.length > 0) {
      const content: ContentPart[] = [
        { type: 'text', text: prompt }
      ];

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const base64Data = await fileToBase64(file);
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type,
              data: base64Data
            }
          });
        }
      }

      messages.push({
        role: 'user',
        content
      } as MistralMessage);
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    const stream = await mistral.chat.stream({
      model: 'mistral-large-latest',
      messages: messages as any,
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}