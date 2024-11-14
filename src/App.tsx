import { useState } from 'react'
import ChatInput from './components/ChatInput'
import CardResponse from './components/CardResponse'
import ChatWindow from './components/ChatWindow'
import { getMistralResponse } from './services/mistralService'
import { getGeminiResponse } from './services/geminiService'
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function App() {
  const [responses, setResponses] = useState<{source: string, response: string}[]>([])
  const [chatSource, setChatSource] = useState<string>('')
  const [conversation, setConversation] = useState<{user: string, text?: string}[]>([])

  const handleSend = async (message: string) => {
    const [mistral, gemini] = await Promise.all([
      getMistralResponse(message),
      getGeminiResponse(message),
    ])
  
    const newResponses = [
      { source: 'Suzie', response: mistral?.toString() },
      { source: 'John', response: gemini?.toString() },
    ]

    setResponses(newResponses)

    if (chatSource) {
      setConversation(prev => [
        ...prev,
        { user: 'You', text: message },
        { user: chatSource, text: newResponses.find(r => r.source === chatSource)?.response }
      ])
    }
  }

  const handleSelect = (source: string) => {
    setChatSource(source)
    setConversation([
      { user: 'You', text: responses.find((r) => r.source === source)?.response }
    ])
  }

  const handleBack = () => {
    setChatSource('')
    setConversation([])
  }

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex items-center">
      <div className="container mx-auto p-4 max-w-3xl">
        {chatSource ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="mb-4"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ChatWindow source={chatSource} conversation={conversation} />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <>
            <ChatInput onSend={handleSend} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {responses.map((resp) => (
                <CardResponse key={resp.source} {...resp} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}