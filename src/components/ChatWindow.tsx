const ChatWindow = ({
  source,
  conversation,
}: {
  source: string;
  conversation: {
    user: string;
    text?: string;
  }[];
}) => (
  <div className="p-4 border rounded">
    <h2 className="text-2xl font-bold mb-4">{source} Chat</h2>
    <div className="chat-log">
      {conversation.map(
        (msg: { user: string; text?: string }, index: number) => (
          <div key={index} className="mb-2">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        )
      )}
    </div>
  </div>
);

export default ChatWindow;
