import { useState } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";

export default function App() {
  const [responses, setResponses] = useState<
    { source: string; response: string }[]
  >([]);
  const [chatSource, setChatSource] = useState<string>("");
  const [conversation, setConversation] = useState<
    { user: string; text?: string }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (message: string) => {
    setConversation((prev) => [
      ...prev,
      { user: "You", text: message },
    ]);
  
    setLoading(true);
    const [mistral, gemini] = await Promise.all([
      getMistralResponse(message),
      getGeminiResponse(message),
    ]);
    setLoading(false);

    const newResponses = [
      { source: "Suzie", response: mistral?.toString() },
      { source: "John", response: gemini?.toString() },
    ];

    setResponses(newResponses);

    setConversation((prev) => [
      ...prev,
      { user: "Suzie", text: mistral?.toString() },
      { user: "John", text: gemini?.toString() },
    ]);
  };

  const handleSelect = (source: string) => {
    const botResponse = responses.find((r) => r.source === source)?.response;
    const userMessage = conversation.find((msg) => msg.user === "You")?.text;

    if (!userMessage) return;

    setChatSource(source);
    setConversation([
      { user: "You", text: userMessage },
      { user: source, text: botResponse },
    ]);
  };

  const handleBack = () => {
    setChatSource("");
    setConversation([]);
  };

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center">
      <div className="container mx-auto p-4 max-w-3xl">
        {chatSource ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="mb-4"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ChatWindow source={chatSource} conversation={conversation} loading={loading} />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <>
            <h1 className="flex mb-8">
              <strong>Beg</strong>
              <TypingText />
            </h1>
            <ChatInput onSend={handleSend} />
            {loading ? (
              <div className="flex animate-pulse space-x-4 mt-4">
                <div className="h-64 w-1/2 bg-muted rounded"></div>
                <div className="h-64 w-1/2 bg-muted rounded"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {responses.map((resp) => (
                  <CardResponse
                    key={resp.source}
                    {...resp}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
