import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'

interface CardResponseProps {
  source: string
  response: string
  onSelect: (source: string) => void
}

export default function CardResponse({ source, response, onSelect }: CardResponseProps) {
  const [copied, setCopied] = useState(false)

  const formatResponse = (text: string) => {
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatTextContent(text.slice(lastIndex, match.index)))
      }
      const language = match[1] || ''
      const code = match[2].trim()
      parts.push(
        <div key={match.index} className="relative mt-4">
          <pre className="rounded-md bg-muted p-4">
            <code className={`language-${language} text-sm`}>{code}</code>
          </pre>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          {copied && (
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

  const formatTextContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const numberedListRegex = /^(\d+\.)\s(.+)/
      const match = line.match(numberedListRegex)
      if (match) {
        return (
          <div key={index} className="mt-2">
            <span className="font-semibold">{match[1]}</span> {formatBoldText(match[2])}
          </div>
        )
      }
      return <div key={index}>{formatBoldText(line)}</div>
    })
  }

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <Card 
      className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={() => onSelect(source)}
    >
      <CardHeader>
        <CardTitle>{source}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          {formatResponse(response)}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}