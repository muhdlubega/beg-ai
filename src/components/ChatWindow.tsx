import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Check, Copy, Pencil, Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "./ui/textarea"

interface ChatWindowProps {
  source: string
  loading: boolean
  conversation: {
    user: string
    text?: string
  }[]
  onClearHistory: () => void
  onEditMessage?: (index: number, text: string) => void
  onSwitchBot?: (index: number) => void
}

interface CodeMatch {
  0: string
  1?: string
  2: string
  index: number
  input: string
}

export default function ChatWindow({ source, loading, conversation, onClearHistory, onEditMessage, onSwitchBot }: ChatWindowProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index)
    setEditText(text)
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus()
      }
    }, 0)
  }

  const handleSubmitEdit = (index: number) => {
    if (editText.trim() && onEditMessage) {
      onEditMessage(index, editText.trim())
    }
    setEditingIndex(null)
    setEditText("")
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditText("")
  }

  useEffect(() => {
    if (scrollAreaRef.current && shouldAutoScroll) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversation, loading, shouldAutoScroll]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;
    setShouldAutoScroll(isAtBottom);
  };

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
        <div key={match.index} className="relative">
          <pre className="rounded-sm border border-white p-4 whitespace-pre-wrap word-wrap break-word">
            <code className={`language-${language} text-sm text-white`}>{code}</code>
          </pre>
          <Button
            variant="outline"
            size="icon"
            className="absolute bg-black top-4 right-4 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(code)
              setCopiedIndex(match!.index)
              setTimeout(() => setCopiedIndex(null), 2000)
            }}
          >
            <Copy color="white" className="h-4 w-4" />
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

  const handleTextAreaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'inherit'
    element.style.height = `${element.scrollHeight}px`
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingIndex !== null) {
        handleCancelEdit()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [editingIndex])

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
        onScroll={handleScroll}
      >
        <div className="space-y-4 p-2">
          {filteredConversation.map((msg, index) => (
            <div key={index}>
              {index === filteredConversation.length - 1 && msg.user === source && loading ? (
                <div className="p-2 h-10 rounded-lg bg-muted-foreground animate-pulse max-w-[80%] text-left" />
              ) : (
                <div className="space-y-2">
                  {editingIndex === index && msg.user === "You" ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Textarea
                          ref={editInputRef as any}
                          value={editText}
                          onChange={(e) => {
                            setEditText(e.target.value)
                            handleTextAreaHeight(e.target)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSubmitEdit(index)
                            }
                          }}
                          className="min-h-[100px] resize-none border-black"
                          placeholder="Edit your message..."
                          onFocus={(e) => handleTextAreaHeight(e.target)}
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSubmitEdit(index)}
                        className="bg-transparent"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="bg-transparent"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`p-2 rounded-lg ${msg.user === "You"
                          ? "bg-muted ml-auto"
                          : "bg-primary text-primary-foreground"
                          } max-w-[80%] text-left whitespace-pre-wrap word-wrap break-word`}
                      >
                        <strong>{msg.user}:</strong> {msg.text && formatResponse(msg.text)}
                      </div>
                      <div className={`flex ${msg.user === "You" ? "justify-end" : "justify-start"}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text || "");
                            setCopiedIndex(index);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="rounded-full bg-transparent"
                        >
                          {copiedIndex === index ? (
                            <span className="text-xs">Copied!</span>
                          ) : (
                            <Copy />
                          )}
                        </Button>
                        {msg.user === "You" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(index, msg.text || "")}
                              className="rounded-full bg-transparent"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSwitchBot && onSwitchBot(index)}
                              className="rounded-full bg-transparent"
                            >
                              <Bot className={`${source === "Suzie" ? "text-cyan-600" : "text-fuchsia-600"}`} />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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