import { Mistral } from '@mistralai/mistralai';

type ContentPart = {
  type: 'text';
  text: string;
} | {
  type: 'image_url';
  image_url: string;
};

type MistralMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
};

const mistral = new Mistral({ apiKey: import.meta.env.VITE_MISTRAL_API_KEY });

async function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function* getMistralResponse(
  prompt: string,
  files?: File[],
  context?: string,
  source: string = 'Suzie'
) {
  try {
    const messages: MistralMessage[] = [];

    if (context) {
      const contextLines = context.split('\n');
      for (const line of contextLines) {
        const [role, ...contentParts] = line.split(': ');
        const messageContent = contentParts.join(': ');

        if (role.toLowerCase() === 'you') {
          messages.push({
            role: 'user',
            content: messageContent
          });
        } else if (role === source) {
          messages.push({
            role: 'assistant',
            content: messageContent
          });
        }
      }
    }

    if (files && files.length > 0) {
      const content: ContentPart[] = [
        {
          type: 'text',
          text: prompt
        }
      ];

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const base64DataUrl = await fileToBase64DataUrl(file);
          content.push({
            type: 'image_url',
            image_url: base64DataUrl
          });
        }
      }

      messages.push({
        role: 'user',
        content
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    const stream = await mistral.chat.stream({
      model: 'pixtral-12b-2409',
      messages: messages as any,
      maxTokens: 2048,
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