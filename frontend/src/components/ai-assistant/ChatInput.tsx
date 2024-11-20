import { useState, useRef } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    error: recordingError,
  } = useAudioRecorder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      await onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
      {recordingError && (
        <div className="mb-2 text-sm text-red-600">{recordingError}</div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="flex-1 resize-none rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          rows={1}
          disabled={isLoading || isRecording}
        />
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`rounded-full p-2 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          <MicrophoneIcon
            className={`h-6 w-6 ${isRecording ? 'text-white' : 'text-gray-600'}`}
          />
        </button>
        <button
          type="submit"
          className="rounded-full bg-primary p-2 text-white hover:bg-primary-dark disabled:opacity-50"
          disabled={isLoading || !message.trim()}
        >
          <SendIcon className="h-6 w-6" />
        </button>
      </div>
    </form>
  );
}

function MicrophoneIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function SendIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}