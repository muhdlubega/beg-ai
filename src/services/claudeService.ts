import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getClaudeResponse(prompt: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    return response || "No response from Claude.";
  } catch (error) {
    console.error("Claude API Error:", error);
    return "Error fetching response from Claude.";
  }
}
