import { useState } from 'react';
import ChatInput from './components/ChatInput';
import CardResponse from './components/CardResponse';
import ChatWindow from './components/ChatWindow';
import { getMistralResponse } from './services/mistralService';
// import { getOllamaResponse } from './services/ollamaService';
import { getGeminiResponse } from './services/geminiService';

const App = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [responses, setResponses] = useState<{source: string, response: any}[]>([]);
  const [chatSource, setChatSource] = useState<string>('');
  const [conversation, setConversation] = useState<{user: string, text?: string}[]>([]);

  const handleSend = async (message: string) => {
    const [mistral, gemini] = await Promise.all([
      getMistralResponse(message),
      // getOllamaResponse(message),
      getGeminiResponse(message),
    ]);
  
    setResponses([
      { source: 'Mistral', response: mistral?.toString() },
      // { source: 'Ollama', response: ollama },
      { source: 'Gemini', response: gemini?.toString() },
    ]);
  };

  const handleSelect = (source: string) => {
    setChatSource(source);
    setConversation([{ user: 'You', text: responses.find((r) => r.source === source)?.response }]);
  };

  return (
    <div className="container mx-auto p-4">
      {!chatSource ? (
        <>
          <ChatInput onSend={handleSend} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {responses.map((resp) => (
              <CardResponse key={resp.source} {...resp} onSelect={handleSelect} />
            ))}
          </div>
        </>
      ) : (
        <ChatWindow source={chatSource} conversation={conversation} />
      )}
    </div>
  );
};

export default App;
