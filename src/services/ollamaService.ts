import axios from "axios";

export async function getOllamaResponse(prompt: string) {
    const apiKey = import.meta.env.VITE_OLLAMA_API_KEY;
  
    try {
      const response = await axios.post(
        'https://api.ollama.ai/v1/chat',
        {
          prompt,
          max_tokens: 100,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );
      return response.data.message || 'No response from Ollama.';
    } catch (error) {
      console.error('Ollama API Error:', error);
      return 'Error fetching response from Ollama.';
    }
  }
  