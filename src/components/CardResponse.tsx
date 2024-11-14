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
        <p className="text-sm text-muted-foreground">
          {typeof response === 'string' ? response : JSON.stringify(response)}
        </p>
      </CardContent>
    </Card>
  )
}