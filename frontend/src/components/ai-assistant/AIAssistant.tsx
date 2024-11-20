import { useEffect, useRef } from 'react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface AIAssistantProps {
  childId?: string | null;
}

export function AIAssistant({ childId = null }: AIAssistantProps) {
  const { messages, isLoading, error, sendMessage } = useAIAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">CerebrHito AI Assistant</h2>
        <p className="text-sm text-gray-600">
          Tu asistente experto en desarrollo infantil
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>¡Hola! ¿En qué puedo ayudarte hoy?</p>
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
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={(text) => sendMessage(text, childId)}
        isLoading={isLoading}
      />
    </div>
  );
}