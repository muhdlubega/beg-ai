import { useState } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";

export default function App() {
  const [responses, setResponses] = useState<
    { source: string; response: string }[]
  >([]);
  const [chatSource, setChatSource] = useState<string>("");
  const [conversations, setConversations] = useState<{
    [key: string]: { user: string; text?: string }[]
  }>({
    Suzie: [],
    John: [],
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (message: string) => {
    setConversations((prev) => ({
      Suzie: [...prev.Suzie, { user: "You", text: message }],
      John: [...prev.John, { user: "You", text: message }],
    }));

    setLoading(true);
    setResponses([
      { source: "Suzie", response: "" },
      { source: "John", response: "" },
    ]);

    const mistralStream = getMistralResponse(message);
    const geminiStream = getGeminiResponse(message);

    const updateResponse = (source: string, chunk: string) => {
      setResponses((prev) => 
        prev.map((resp) => 
          resp.source === source 
            ? { ...resp, response: resp.response + chunk } 
            : resp
        )
      );

      setConversations((prev) => ({
        ...prev,
        [source]: [
          ...prev[source].slice(0, -1),
          { user: source, text: prev[source][prev[source].length - 1].text + chunk }
        ],
      }));
    };

    const streamResponses = async () => {
      for await (const chunk of mistralStream) {
        updateResponse("Suzie", chunk as string);
      }
      for await (const chunk of geminiStream) {
        updateResponse("John", chunk);
      }
      setLoading(false);
    };

    streamResponses();
  };

  const handleSelect = (source: string) => {
    setChatSource(source);
    setConversations((prev) => ({...prev, [source]: conversations[source]}))
  };

  const switchBot = () => {
    const newSource = chatSource === "Suzie" ? "John" : "Suzie";
    setChatSource(newSource);
    setConversations((prev) => ({...prev, [newSource]: conversations[newSource]}))
  };

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center">
      <div className="container h-full mx-auto p-4 max-w-5xl">
        {chatSource ? (
          <>
            <Button
              variant="outline"
              className="mb-4"
              onClick={switchBot}
            >
              Ask {chatSource === "Suzie" ? "John" : "Suzie"} instead
            </Button>
            <ChatWindow source={chatSource} conversation={conversations[chatSource]} loading={loading} />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <>
            <h1 className="flex mb-2">
              <strong>Beg</strong>
              <TypingText />
            </h1>
            <h6 className="mb-4 text-zinc-400">Welcome to Beg.AI. Enter your prompt and select your preferred response</h6>
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