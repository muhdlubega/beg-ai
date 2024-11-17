import { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";
import Cookies from 'js-cookie';
import { Bot, HousePlug } from "lucide-react";

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
    if (chatSource) {
    } else {
      setLoading(true);

      setConversations((prev) => ({
        ...prev,
        Suzie: [...prev.Suzie, { user: "You", text: message }, { user: "Suzie", text: "" }],
        John: [...prev.John, { user: "You", text: message }, { user: "John", text: "" }],
      }));

      setResponses([
        { source: "Suzie", response: "" },
        { source: "John", response: "" },
      ]);

      const mistralStream = getMistralResponse(message);
      const geminiStream = getGeminiResponse(message);

      const [mistralIterator, geminiIterator] = [
        mistralStream[Symbol.asyncIterator](),
        geminiStream[Symbol.asyncIterator](),
      ];

      try {
        const [firstMistral, firstGemini] = await Promise.all([
          mistralIterator.next(),
          geminiIterator.next(),
        ]);
        setLoading(false);

        if (!firstMistral.done) {
          setResponses((prev) =>
            prev.map((resp) =>
              resp.source === "Suzie"
                ? { ...resp, response: resp.response + firstMistral.value }
                : resp
            )
          );
          setConversations((prev) => ({
            ...prev,
            Suzie: prev.Suzie.map((msg, index) => {
              if (index === prev.Suzie.length - 1 && msg.user === "Suzie") {
                return { ...msg, text: (msg.text || "") + firstMistral.value };
              }
              return msg;
            }),
          }));
        }

        if (!firstGemini.done) {
          setResponses((prev) =>
            prev.map((resp) =>
              resp.source === "John"
                ? { ...resp, response: resp.response + firstGemini.value }
                : resp
            )
          );
          setConversations((prev) => ({
            ...prev,
            John: prev.John.map((msg, index) => {
              if (index === prev.John.length - 1 && msg.user === "John") {
                return { ...msg, text: (msg.text || "") + firstGemini.value };
              }
              return msg;
            }),
          }));
        }

        for await (const chunk of mistralStream) {
          if (chunk === firstMistral.value) continue;
          setResponses((prev) =>
            prev.map((resp) =>
              resp.source === "Suzie"
                ? { ...resp, response: resp.response + chunk }
                : resp
            )
          );
          setConversations((prev) => ({
            ...prev,
            Suzie: prev.Suzie.map((msg, index) => {
              if (index === prev.Suzie.length - 1 && msg.user === "Suzie") {
                return { ...msg, text: (msg.text || "") + chunk };
              }
              return msg;
            }),
          }));
        }

        for await (const chunk of geminiStream) {
          if (chunk === firstGemini.value) continue;
          setResponses((prev) =>
            prev.map((resp) =>
              resp.source === "John"
                ? { ...resp, response: resp.response + chunk }
                : resp
            )
          );
          setConversations((prev) => ({
            ...prev,
            John: prev.John.map((msg, index) => {
              if (index === prev.John.length - 1 && msg.user === "John") {
                return { ...msg, text: (msg.text || "") + chunk };
              }
              return msg;
            }),
          }));
        }
      } catch (error) {
        console.error("Error in streaming responses:", error);
        setLoading(false);
      }
    }
  };

  const handleSelect = (source: string) => {
    setChatSource(source);
    setConversations((prev) => ({ ...prev, [source]: conversations[source] }));
  };

  const switchBot = () => {
    const newSource = chatSource === "Suzie" ? "John" : "Suzie";
    setChatSource(newSource);
    setConversations((prev) => ({ ...prev, [newSource]: conversations[newSource] }));
  };

  const clearHistory = (source: string) => {
    setConversations((prev) => ({
      ...prev,
      [source]: [],
    }));
    Cookies.set(COOKIE_NAME, JSON.stringify({
      ...conversations,
      [source]: [],
    }));
  };

  const hasSavedConversations = () => {
    return conversations.Suzie.length > 0 || conversations.John.length > 0;
  };

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center">
      <div className="container h-full mx-auto p-4 max-w-5xl">
        {chatSource ? (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <HousePlug
                className="cursor-pointer hover:text-zinc-500"
                onClick={() => setChatSource("")}
              />
              <Button
                variant="outline"
                onClick={switchBot}
                className="flex items-center gap-2"
              >
                <Bot className={`${chatSource === 'Suzie' ? 'text-cyan-600' : 'text-fuchsia-600'} h-4 w-4`} />
                [Confabulate]: {chatSource === "Suzie" ? "John" : "Suzie"}
              </Button>
            </div>
            <ChatWindow
              source={chatSource}
              conversation={conversations[chatSource]}
              loading={loading}
              onClearHistory={() => clearHistory(chatSource)}
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
            {hasSavedConversations() && responses.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  {conversations.Suzie.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleSelect("Suzie")}
                    >
                      <Bot className="text-fuchsia-600 h-4 w-4" />
                      [Recommence]: Suzie
                    </Button>
                  )}
                  {conversations.John.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleSelect("John")}
                    >
                      <Bot className="text-cyan-600 h-4 w-4" />
                      [Recommence]: John
                    </Button>
                  )}
              </div>
            ) : null}
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