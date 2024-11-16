import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function CardResponse({
  source,
  response,
  onSelect,
}: {
  source: string
  response: string
  onSelect: (source: string) => void
}) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={() => onSelect(source)}
    >
      <CardHeader>
        <CardTitle>{source}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm text-muted-foreground">
          <code>{typeof response === 'string' ? response : JSON.stringify(response, null, 2)}</code>
        </pre>
      </CardContent>
    </Card>
  )
}