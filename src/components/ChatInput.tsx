import { useState } from 'react';

const ChatInput = ({ onSend }: {onSend: (message: string) => Promise<void>}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="p-4 flex">
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend} className="ml-2 p-2 bg-blue-500 text-white rounded">
        Send
      </button>
    </div>
  );
};

export default ChatInput;
