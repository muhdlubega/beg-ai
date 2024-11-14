import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({apiKey: import.meta.env.VITE_MISTRAL_API_KEY});

export async function getMistralResponse(prompt: string) {
  try {
    const chatResponse = await mistral.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: prompt }
      ],
    });
    return chatResponse.choices?.[0]?.message.content || "No response from Mistral.";
  } catch (error) {
    console.error("Mistral API Error:", error);
    return "Error fetching response from Mistral.";
  }
}