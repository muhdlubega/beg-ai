import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Copy, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChatWindowProps {
  source: string
  loading: boolean
  conversation: {
    user: string
    text?: string
  }[]
  onClearHistory: () => void
}

interface CodeMatch {
  0: string
  1?: string
  2: string
  index: number
  input: string
}

export default function ChatWindow({ source, loading, conversation, onClearHistory }: ChatWindowProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  let scrollTimeout: NodeJS.Timeout;

  useEffect(() => {
    if (scrollAreaRef.current && !isUserScrolling) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversation, loading, isUserScrolling]);

  const handleUserInteraction = () => {
    setIsUserScrolling(true);
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };
  
  useEffect(() => {
    return () => {
      clearTimeout(scrollTimeout);
    };
  }, []);

  const filteredConversation = conversation.filter(
    (msg) => msg.user === "You" || msg.user === source
  )

  const handleDelete = () => {
    onClearHistory();
    setShowDeleteDialog(false);
  };

  const formatResponse = (text: string) => {
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: CodeMatch | null

    while ((match = codeBlockRegex.exec(text) as CodeMatch | null) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatTextContent(text.slice(lastIndex, match.index)))
      }
      const language = match[1] || ''
      const code = match[2].trim()
      parts.push(
        <div key={match.index} className="relative mt-4">
          <pre className="rounded-md bg-muted p-4 whitespace-pre-wrap word-wrap break-word">
            <code className={`language-${language} text-sm`}>{code}</code>
          </pre>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(code)
              setCopiedIndex(match!.index)
              setTimeout(() => setCopiedIndex(null), 2000)
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          {copiedIndex === match.index && (
            <span className="absolute top-2 right-12 text-xs text-muted-foreground">
              Copied!
            </span>
          )}
        </div>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(formatTextContent(text.slice(lastIndex)))
    }

    return <div className="space-y-4">{parts}</div>
  }

  const formatTextContent = (text: string): React.ReactNode[] => {
    return text.split('\n').map((line, index) => {
      const numberedListRegex = /^(\d+\.)\s(.+)/
      const match = line.match(numberedListRegex)
      if (match) {
        return (
          <div key={index} className="mt-2 whitespace-pre-wrap word-wrap break-word">
            <span className="font-semibold">{match[1]}</span> {formatBoldText(match[2])}
          </div>
        )
      }
      return <div key={index} className="whitespace-pre-wrap word-wrap break-word">{formatBoldText(line)}</div>
    })
  }

  const formatBoldText = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className="border rounded-lg mb-4 h-[77vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-2 items-center">
          <h2 className="text-2xl font-bold">{source} Bot</h2>
          <Bot className={source === 'John' ? 'text-cyan-600' : 'text-fuchsia-600'} />
        </div>
        <Button
          size="icon"
          variant='ghost'
          onClick={() => setShowDeleteDialog(true)}
          className="h-8 w-8 bg-transparent hover:text-destructive"
        >
          <Trash2 color="black" className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-grow p-4"
        onTouchStart={handleUserInteraction}
        onMouseDown={handleUserInteraction}
        onWheel={handleUserInteraction}
        >
        <div className="space-y-4">
          {filteredConversation.map((msg, index) => (
            <>
              {
                index === filteredConversation.length - 1 && msg.user === source && loading ? (
                  <div className="p-2 h-10 rounded-lg bg-muted-foreground animate-pulse max-w-[80%] text-left">
                  </div>) : (
                  <div
                    key={index}
                    className={`p-2 rounded-lg ${msg.user === "You"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                      } max-w-[80%] text-left whitespace-pre-wrap word-wrap break-word`}
                  >
                    <strong>{msg.user}:</strong> {msg.text && formatResponse(msg.text)}
                  </div>)
              }
            </>

          ))}
        </div>
      </ScrollArea>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your chat history? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              color="black"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}