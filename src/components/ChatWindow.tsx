import { ScrollArea } from "@/components/ui/scroll-area"

export default function ChatWindow({
  source,
  conversation,
}: {
  source: string
  conversation: {
    user: string
    text?: string
  }[]
}) {
  return (
    <div className="border rounded-lg mb-4 h-[60vh] flex flex-col">
      <h2 className="text-2xl font-bold p-4 border-b">{source} Bot</h2>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                msg.user === 'You' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
              } max-w-[80%] ${msg.user === 'You' ? 'text-right' : 'text-left'}`}
            >
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}