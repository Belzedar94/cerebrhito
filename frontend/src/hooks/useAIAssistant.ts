import { useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseAIAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string, childId?: string | null) => Promise<void>;
  playAudio: (base64Audio: string) => Promise<void>;
}

export function useAIAssistant(): UseAIAssistantReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, childId: string | null = null) => {
    try {
      setError(null);
      setIsLoading(true);

      // Add user message to the list
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send request to backend
      const response = await fetch('/api/ai-assistant/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          childId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to the list
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Play audio response
      await playAudio(data.audio);
    } catch (err) {
      setError((err as Error).message);
      console.error('AI Assistant error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      // Convert base64 to blob
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });

      // Create audio element and play
      const audio = new Audio(URL.createObjectURL(blob));
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Failed to play audio response');
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    playAudio,
  };
}