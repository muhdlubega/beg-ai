import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

export default function ChatWindow({
  source,
  loading,
  conversation,
}: {
  source: string;
  loading: boolean;
  conversation: {
    user: string;
    text?: string;
  }[];
}) {
  const filteredConversation = conversation.filter(
    (msg) => msg.user === "You" || msg.user === source
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, loading]);

  return (
    <div className="border rounded-lg mb-4 h-[60vh] flex flex-col">
      <h2 className="text-2xl font-bold p-4 border-b">{source} Bot</h2>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {filteredConversation.map((msg, index) => (
            <div
              key={index}
              ref={scrollRef}
              className={`p-2 rounded-lg ${
                msg.user === "You"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              } max-w-[80%] text-left`}
            >
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))}

          {loading && (
            <div className="p-2 h-10 rounded-lg bg-muted-foreground animate-pulse max-w-[80%] text-left">
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
