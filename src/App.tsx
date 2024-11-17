import { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";
import Cookies from 'js-cookie';

const COOKIE_NAME = 'chat_history';

export default function App() {
  const [responses, setResponses] = useState<
    { source: string; response: string }[]
  >([]);
  const [chatSource, setChatSource] = useState<string>("");
  const [conversations, setConversations] = useState<{
    [key: string]: { user: string; text?: string }[]
  }>(() => {
    const savedConversations = Cookies.get(COOKIE_NAME);
    return savedConversations ? JSON.parse(savedConversations) : {
      Suzie: [],
      John: [],
    };
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    Cookies.set(COOKIE_NAME, JSON.stringify(conversations));
  }, [conversations]);

  const handleSend = async (message: string) => {
    setLoading(true);
    const initialBotResponses = {
      Suzie: { user: "Suzie", text: "" },
      John: { user: "John", text: "" },
    };

    setConversations((prev) => {
      const newConversations = {
        Suzie: [...prev.Suzie, { user: "You", text: message }, initialBotResponses.Suzie],
        John: [...prev.John, { user: "You", text: message }, initialBotResponses.John],
      };
      return newConversations;
    });

    setResponses([
      { source: "Suzie", response: "" },
      { source: "John", response: "" },
    ]);

    const mistralStream = getMistralResponse(message);
    const geminiStream = getGeminiResponse(message);
    setLoading(false);

    const updateResponse = (source: string, chunk: string) => {
      setResponses((prev) => 
        prev.map((resp) => 
          resp.source === source 
            ? { ...resp, response: resp.response + chunk } 
            : resp
        )
      );

      setConversations((prev) => {
        const newConversations = {
          ...prev,
          [source]: prev[source].map((msg, index) => {
            if (index === prev[source].length - 1 && msg.user === source) {
              return { ...msg, text: (msg.text || "") + chunk };
            }
            return msg;
          }),
        };
        return newConversations;
      });
    };

    const streamResponses = async () => {
      try {
        for await (const chunk of mistralStream) {
          updateResponse("Suzie", chunk as string);
        }
        for await (const chunk of geminiStream) {
          updateResponse("John", chunk);
        }
      } catch (error) {
        console.error("Error in streaming responses:", error);
      }
    };

    streamResponses();
  };

  const handleSelect = (source: string) => {
    setChatSource(source);
    setConversations((prev) => ({...prev, [source]: conversations[source]}));
  };

  const switchBot = () => {
    const newSource = chatSource === "Suzie" ? "John" : "Suzie";
    setChatSource(newSource);
    setConversations((prev) => ({...prev, [newSource]: conversations[newSource]}));
  };

  const clearHistory = () => {
    const emptyConversations = {
      Suzie: [],
      John: [],
    };
    setConversations(emptyConversations);
    Cookies.remove(COOKIE_NAME);
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
            <ChatWindow 
              source={chatSource} 
              conversation={conversations[chatSource]} 
              loading={loading}
              onClearHistory={clearHistory}
            />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <>
              <h1 className="flex mb-2">
                <strong>Beg</strong>
                <TypingText />
              </h1>
            <h6 className="mb-4 text-zinc-400">
              Welcome to Beg.AI. Enter your prompt and select your preferred response
            </h6>
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