import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true
});

export async function getOpenAIResponse(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
    });
    return response.choices[0]?.message || "No response from OpenAI.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Error fetching response from OpenAI.";
  }
}
