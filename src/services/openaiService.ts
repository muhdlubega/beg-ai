import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true
});

export async function getOpenAIResponse(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message || "No response from OpenAI.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Error fetching response from OpenAI.";
  }
}
