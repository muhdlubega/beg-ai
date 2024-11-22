import { useState, useEffect } from "react";
import ChatInput from "./components/ChatInput";
import CardResponse from "./components/CardResponse";
import ChatWindow from "./components/ChatWindow";
import { getMistralResponse } from "./services/mistralService";
import { getGeminiResponse } from "./services/geminiService";
import { Button } from "@/components/ui/button";
import TypingText from "./components/TypingText";
import Cookies from 'js-cookie';
import { Bot, HousePlug, LogIn, LogOut, Menu } from "lucide-react";
// import { ContentChunk } from "@mistralai/mistralai/models/components";
import { supabase } from "./lib/supaBaseClient";
import { User } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";

const COOKIE_NAME = 'chat_history';

export default function App() {
  const [responses, setResponses] = useState<
    { source: string; response: string }[]
  >([]);
  const [chatSource, setChatSource] = useState<string>("");
  const [conversations, setConversations] = useState<{
    [key: string]: { user: string; text?: string }[];
  }>({
    Suzie: [],
    John: [],
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      window.location.reload();
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
          { user: "You", text: message, files },
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
        Suzie: [...prev.Suzie, { user: "You", text: message, files }, { user: "Suzie", text: "" }],
        John: [...prev.John, { user: "You", text: message, files }, { user: "John", text: "" }],
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

  const clearHistory = () => {
    // setConversations((prev) => ({
    //   ...prev,
    //   [source]: [],
    // }));
    // Cookies.set(COOKIE_NAME, JSON.stringify({
    //   ...conversations,
    //   [source]: [],
    // }));
    setConversations((prev) => ({ ...prev, [chatSource]: [] }));
  };

  const hasSavedConversations = () => {
    return conversations.Suzie.length > 0 || conversations.John.length > 0;
  };

  const handleEditMessage = (index: number, newText: string) => {
    // const contextMessages = conversations[source]
    //   .slice(0, index)
    //   .map(msg => `${msg.user}: ${msg.text}`)
    //   .join('\n');

    // setConversations((prev) => {
    //   const messagesUpToEdit = prev[source].slice(0, index);
    //   return {
    //     ...prev,
    //     [source]: messagesUpToEdit
    //   };
    // });

    // handleSend(newText, undefined, contextMessages);

    setConversations((prev) => {
      const updatedMessages = [...prev[chatSource]];
      updatedMessages[index].text = newText;
      return { ...prev, [chatSource]: updatedMessages };
    });
  };

  // const handleStreamResponse = async (stream: AsyncGenerator<string | ContentChunk[], void, unknown>, source: string) => {
  //   try {
  //     setLoading(true);
  //     const streamIterator = stream[Symbol.asyncIterator]();
  //     const firstChunk = await streamIterator.next();
  //     setLoading(false);

  //     if (!firstChunk.done) {
  //       setConversations((prev) => ({
  //         ...prev,
  //         [source]: prev[source].map((msg, index) => {
  //           if (index === prev[source].length - 1 && msg.user === source) {
  //             return { ...msg, text: (msg.text || "") + firstChunk.value };
  //           }
  //           return msg;
  //         }),
  //       }));
  //     }

  //     for await (const chunk of stream) {
  //       if (chunk === firstChunk.value) continue;
  //       setConversations((prev) => ({
  //         ...prev,
  //         [source]: prev[source].map((msg, index) => {
  //           if (index === prev[source].length - 1 && msg.user === source) {
  //             return { ...msg, text: (msg.text || "") + chunk };
  //           }
  //           return msg;
  //         }),
  //       }));
  //     }
  //   } catch (error) {
  //     console.error("Error in streaming response:", error);
  //     setLoading(false);
  //   }
  // };

  const handleSwitchBot = (index: number) => {
    // const newSource = source === "Suzie" ? "John" : "Suzie";
    // const messageToSwitch = conversations[source][index].text;

    // setChatSource(newSource);

    // if (messageToSwitch) {
    //   setConversations((prev) => ({
    //     ...prev,
    //     [newSource]: [...prev[newSource], { user: "You", text: messageToSwitch }, { user: newSource, text: "" }]
    //   }));

    //   const stream = newSource === "Suzie"
    //     ? getMistralResponse(messageToSwitch)
    //     : getGeminiResponse(messageToSwitch);

    //   handleStreamResponse(stream, newSource);
    // }

    const newSource = chatSource === "Suzie" ? "John" : "Suzie";
    const switchedMessage = conversations[chatSource][index]?.text || "";
    createNewChat(newSource);
    setConversations((prev) => ({
      ...prev,
      [newSource]: [...prev[newSource], { user: "You", text: switchedMessage }],
    }));
  };

  const createChatName = (botName: string) => {
    const count = Object.keys(conversations).filter((name) => name.startsWith(botName)).length + 1;
    return `${botName} #${count}`;
  };

  const createNewChat = (botName: string) => {
    const newChatName = createChatName(botName);
    setConversations((prev) => ({
      ...prev,
      [newChatName]: [],
    }));
    setChatSource(newChatName);
    setIsSidebarOpen(false);
  };

  const saveConversation = async (source: string, messages: any[]) => {
    if (!user) return;

    try {
      const serializedMessages = await Promise.all(messages.map(async (msg) => {
        if (!msg.files) return msg;

        const serializedFiles = await Promise.all(msg.files.map(async (file: File) => {
          if (file instanceof File) {
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('chat-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) throw uploadError;

            const { data } = await supabase.storage
              .from('chat-images')
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            return {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified,
              path: filePath,
              url: data?.signedUrl || null
            };
          }
          return file;
        }));

        return {
          ...msg,
          files: serializedFiles
        };
      }));

      const { error } = await supabase
        .from('conversations')
        .upsert({
          user_id: user.id,
          chat_source: source,
          messages: serializedMessages
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
        .from("conversations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data) {
        const formattedConversations = data.reduce((acc, conv) => {
          acc[conv.chat_source] = conv.messages || [];
          return acc;
        }, {});
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
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
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Menu className="absolute top-6 left-5 h-5 w-5 cursor-pointer" />
        </SheetTrigger>
        <SheetContent className="[&>button]:hidden" side="left">
          <SheetHeader>
            <SheetTitle>[Discourse]:</SheetTitle>
            <SheetDescription>Start a new or manage current ones</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {Object.keys(conversations).map((chatName) => (
              <Button
                key={chatName}
                variant="outline"
                onClick={() => {
                  setChatSource(chatName);
                  setIsSidebarOpen(false);
                }}
                className="w-full justify-between"
              >
                {chatName}
                <Bot className={`${chatName.startsWith("Suzie") ? "text-fuchsia-600" : "text-cyan-600"} h-4 w-4`} />
              </Button>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="default"
                onClick={() => createNewChat("Suzie")}
                className="w-full bg-fuchsia-600"
              >
                <Bot className="h-4 w-4" />
                [Construct]: Suzie
              </Button>
              <Button
                variant="default"
                onClick={() => createNewChat("John")}
                className="w-full bg-cyan-600"
              >
                <Bot className="h-4 w-4" />
                [Construct]: John
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
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
            <div className="flex items-center space-x-2 mb-4 mt-10">
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
                [Confabulate]: {chatSource.startsWith("Suzie") ? "John" : "Suzie"}
              </Button>
            </div>
            <ChatWindow
              source={chatSource}
              conversation={conversations[chatSource]}
              loading={loading}
              onClearHistory={() => clearHistory()}
              onEditMessage={(index, newText) => handleEditMessage(index, newText)}
              onSwitchBot={(index) => handleSwitchBot(index)}
            />
            <ChatInput onSend={handleSend}
              value={inputText}
              onChange={setInputText} />
          </>
        ) : (
          <>
            <h1 className={`${responses.length > 0 ? 'mt-10' : 'mt-0'} flex mb-2`}>
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