import { useEffect, useRef, useState } from 'react';

import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff } from 'lucide-react';

interface AIAssistantProps {
  childId?: string | null;
}

export function AIAssistant({ childId = null }: AIAssistantProps) {
  const { messages, isLoading, error, sendMessage } = useAIAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement voice recognition logic here
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">CerebrHito AI Assistant</h2>
          <p className="text-sm text-gray-600">
            Your expert in child development
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleVoiceInput}
          className={isListening ? 'bg-red-100' : ''}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>Hello! How can I assist you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <ChatInput
        onSendMessage={(text) => sendMessage(text, childId)}
        isLoading={isLoading}
      />
    </div>
  );
}

