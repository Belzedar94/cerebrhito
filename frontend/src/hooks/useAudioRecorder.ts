import { useState, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setError(null);
      setAudioBlob(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      // Handle data available event
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Handle recording stop
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    error,
  };
}