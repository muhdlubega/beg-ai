import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({apiKey: import.meta.env.VITE_MISTRAL_API_KEY});

export async function* getMistralResponse(prompt: string) {
  try {
    const stream = await mistral.chat.stream({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: prompt }
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