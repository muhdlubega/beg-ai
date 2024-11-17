import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'

interface ChatWindowProps {
  source: string
  loading: boolean
  conversation: {
    user: string
    text?: string
  }[]
}

interface CodeMatch {
  0: string
  1?: string
  2: string
  index: number
  input: string
}

export default function ChatWindow({ source, loading, conversation }: ChatWindowProps) {
  const filteredConversation = conversation.filter(
    (msg) => msg.user === "You" || msg.user === source
  )
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

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
      <h2 className="text-2xl font-bold p-4 border-b">{source} Bot</h2>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {filteredConversation.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                msg.user === "You"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              } max-w-[80%] text-left whitespace-pre-wrap word-wrap break-word`}
            >
              <strong>{msg.user}:</strong> {msg.text && formatResponse(msg.text)}
            </div>
          ))}

          {loading && (
            <div className="p-2 h-10 rounded-lg bg-muted-foreground animate-pulse max-w-[80%] text-left">
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}