import { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";
import Cookies from 'js-cookie';
import { Bot, HousePlug, LogIn, LogOut } from "lucide-react";
import { ContentChunk } from "@mistralai/mistralai/models/components";
import { supabase } from "./lib/supaBaseClient";
import { User } from "@supabase/supabase-js";

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
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      Cookies.remove(COOKIE_NAME)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    Cookies.set(COOKIE_NAME, JSON.stringify(conversations));
  }, [conversations]);

  const handleSend = async (message: string, files?: File[], context?: string) => {
    if (chatSource) {
      setLoading(true);
      setConversations((prev) => ({
        ...prev,
        [chatSource]: [
          ...prev[chatSource],
          { user: "You", text: message },
          { user: chatSource, text: "" }
        ],
      }));

      const stream = chatSource === "Suzie"
        ? getMistralResponse(message, files, context)
        : getGeminiResponse(message, files, context);

      try {
        const streamIterator = stream[Symbol.asyncIterator]();
        const firstChunk = await streamIterator.next();
        setLoading(false);

        if (!firstChunk.done) {
          setConversations((prev) => ({
            ...prev,
            [chatSource]: prev[chatSource].map((msg, index) => {
              if (index === prev[chatSource].length - 1 && msg.user === chatSource) {
                return { ...msg, text: (msg.text || "") + firstChunk.value };
              }
              return msg;
            }),
          }));
        }

        for await (const chunk of stream) {
          if (chunk === firstChunk.value) continue;
          setConversations((prev) => ({
            ...prev,
            [chatSource]: prev[chatSource].map((msg, index) => {
              if (index === prev[chatSource].length - 1 && msg.user === chatSource) {
                return { ...msg, text: (msg.text || "") + chunk };
              }
              return msg;
            }),
          }));
        }
      } catch (error) {
        console.error("Error in streaming response:", error);
        setLoading(false);
      }
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

      const mistralStream = getMistralResponse(message, files);
      const geminiStream = getGeminiResponse(message, files);

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

  const handleEditMessage = (source: string, index: number, newText: string) => {
    const contextMessages = conversations[source]
      .slice(0, index)
      .map(msg => `${msg.user}: ${msg.text}`)
      .join('\n');

    setConversations((prev) => {
      const messagesUpToEdit = prev[source].slice(0, index);
      return {
        ...prev,
        [source]: messagesUpToEdit
      };
    });

    handleSend(newText, undefined, contextMessages);
  };

  const handleStreamResponse = async (stream: AsyncGenerator<string | ContentChunk[], void, unknown>, source: string) => {
    try {
      setLoading(true);
      const streamIterator = stream[Symbol.asyncIterator]();
      const firstChunk = await streamIterator.next();
      setLoading(false);

      if (!firstChunk.done) {
        setConversations((prev) => ({
          ...prev,
          [source]: prev[source].map((msg, index) => {
            if (index === prev[source].length - 1 && msg.user === source) {
              return { ...msg, text: (msg.text || "") + firstChunk.value };
            }
            return msg;
          }),
        }));
      }

      for await (const chunk of stream) {
        if (chunk === firstChunk.value) continue;
        setConversations((prev) => ({
          ...prev,
          [source]: prev[source].map((msg, index) => {
            if (index === prev[source].length - 1 && msg.user === source) {
              return { ...msg, text: (msg.text || "") + chunk };
            }
            return msg;
          }),
        }));
      }
    } catch (error) {
      console.error("Error in streaming response:", error);
      setLoading(false);
    }
  };

  const handleSwitchBot = (source: string, index: number) => {
    const newSource = source === "Suzie" ? "John" : "Suzie";
    const messageToSwitch = conversations[source][index].text;

    setChatSource(newSource);

    if (messageToSwitch) {
      setConversations((prev) => ({
        ...prev,
        [newSource]: [...prev[newSource], { user: "You", text: messageToSwitch }, { user: newSource, text: "" }]
      }));

      const stream = newSource === "Suzie"
        ? getMistralResponse(messageToSwitch)
        : getGeminiResponse(messageToSwitch);

      handleStreamResponse(stream, newSource);
    }
  };

  const saveConversation = async (source: string, messages: any[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .upsert({
          user_id: user.id,
          chat_source: source,
          messages: messages
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const formattedConversations = data.reduce((acc, conv) => ({
          ...acc,
          [conv.chat_source]: conv.messages
        }), {
          Suzie: [],
          John: [],
        });

        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (chatSource) {
        saveConversation(chatSource, conversations[chatSource]);
      } else {
        saveConversation('Suzie', conversations.Suzie);
        saveConversation('John', conversations.John);
      }
    }
  }, [conversations, user]);

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center">
      <div className="absolute top-4 right-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">{user.email}</span>
            <Button
              onClick={handleLogout}
              className="bg-primary"
            >
              <LogOut
                className="w-4 h-4"
              />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleLogin}
            className="bg-primary"
          >
            <LogIn
              className="w-4 h-4"
            />
          </Button>
        )}
      </div>
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
              onEditMessage={(index, newText) => handleEditMessage(chatSource, index, newText)}
              onSwitchBot={(index) => handleSwitchBot(chatSource, index)}
            />
            <ChatInput onSend={handleSend}
              value={inputText}
              onChange={setInputText} />
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