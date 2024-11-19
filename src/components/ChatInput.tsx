import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => Promise<void>
  value?: string
  onChange?: (value: string) => void
}

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/gif'
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export default function ChatInput({ onSend, value, onChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string>('')
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
      setError('')
    }
  }

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return `File "${file.name}" is not supported. Only JPEG, PNG, WEBP, HEIC, and GIF images are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 4MB size limit.`;
    }
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const errors: string[] = [];
    const validFiles: File[] = [];

    selectedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError('');
    }

    setFiles(validFiles);
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setError('')
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
              <span className="text-sm">{file.name}</span>
              <Trash2 
                className="hover:text-zinc-500 h-4 w-4 cursor-pointer"
                onClick={() => removeFile(index)}
              />
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
          accept={SUPPORTED_MIME_TYPES.join(',')}
        />
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs p-2 rounded whitespace-nowrap">
            Supported: JPEG, PNG, WEBP, HEIC, GIF (max 4MB)
          </div>
        </div>
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