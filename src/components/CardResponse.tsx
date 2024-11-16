import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CardResponseProps {
  source: string
  response: string
  onSelect: (source: string) => void
}

export default function CardResponse({ source, response, onSelect }: CardResponseProps) {
  const isCodeBlock = response.trim().startsWith('```') && response.trim().endsWith('```')

  const formatResponse = (text: string) => {
    if (isCodeBlock) {
      const code = text.trim().replace(/^```[\w-]*\n/, '').replace(/```$/, '')
      return (
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          <pre className="text-sm">
            <code>{code}</code>
          </pre>
        </ScrollArea>
      )
    }

    const formattedText = text.split('\n').map((line, index) => {
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

    return <div className="text-sm text-muted-foreground">{formattedText}</div>
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
        {formatResponse(response)}
      </CardContent>
    </Card>
  )
}