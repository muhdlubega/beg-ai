import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Trash2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => Promise<void>
  value?: string
  onChange?: (value: string) => void
}

export default function ChatInput({ onSend, value, onChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputValue = value !== undefined ? value : message
  const handleMessageChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue)
    } else {
      setMessage(newValue)
    }
  }

  const handleSend = () => {
    if (inputValue.trim() || files.length > 0) {
      onSend(inputValue, files)
      handleMessageChange('')
      setFiles([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
              <span className="text-sm">{file.name}</span>
              <Trash2 className="hover:text-zinc-500 h-4 w-4"
                onClick={() => removeFile(index)} />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          type="text"
          className="flex-1"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
}