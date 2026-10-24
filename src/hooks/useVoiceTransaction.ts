import { useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;
type VoiceError = 'permission' | 'unavailable' | 'noSpeech' | 'failed' | null;
type VoiceStatus = 'idle' | 'starting' | 'listening' | 'processing';

export function useVoiceTransaction(visible: boolean) {
  const moduleRef = useRef<SpeechModule | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const subscriptionsRef = useRef<Array<{ remove: () => void }>>([]);
  const transcriptRef = useRef('');
  const hasFinalRef = useRef(false);
  const hasErrorRef = useRef(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<VoiceError>(null);

  const removeListeners = () => {
    subscriptionsRef.current.forEach((subscription) => subscription.remove());
    subscriptionsRef.current = [];
  };

  const abort = () => {
    try { moduleRef.current?.abort(); } catch { /* The recognizer may already be closed. */ }
    removeListeners();
    moduleRef.current = null;
    setStatus('idle');
  };

  useEffect(() => {
    if (!visible) {
      abort();
      setTranscript('');
      setFinalTranscript('');
      setError(null);
    }
    return () => {
      try { moduleRef.current?.abort(); } catch { /* Ignore an already closed session. */ }
      removeListeners();
      moduleRef.current = null;
    };
  }, [visible]);

  const start = async (locale: string) => {
    if (status !== 'idle') return;
    setStatus('starting');
    setError(null);
    setTranscript('');
    setFinalTranscript('');
    transcriptRef.current = '';
    hasFinalRef.current = false;
    hasErrorRef.current = false;
    try {
      if (!requireOptionalNativeModule('ExpoSpeechRecognition')) {
        setError('unavailable');
        setStatus('idle');
        return;
      }
      // Lazy import keeps Expo Go usable; speech recognition needs a new native build.
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
      if (!visibleRef.current) { setStatus('idle'); return; }
      moduleRef.current = ExpoSpeechRecognitionModule;
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!visibleRef.current) { setStatus('idle'); return; }
      if (!permission.granted) {
        setError('permission');
        setStatus('idle');
        return;
      }
      removeListeners();
      subscriptionsRef.current = [
        ExpoSpeechRecognitionModule.addListener('start', () => setStatus('listening')),
        ExpoSpeechRecognitionModule.addListener('result', (event) => {
          const heard = event.results[0]?.transcript?.trim();
          if (!heard) return;
          transcriptRef.current = heard;
          setTranscript(heard);
          if (event.isFinal) {
            hasFinalRef.current = true;
            setFinalTranscript(heard);
          }
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event) => {
          if (event.error === 'aborted') return;
          hasErrorRef.current = true;
          setError(event.error === 'no-speech' ? 'noSpeech' : event.error === 'not-allowed' ? 'permission' : 'failed');
          setStatus('idle');
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => {
          if (!hasFinalRef.current && transcriptRef.current) setFinalTranscript(transcriptRef.current);
          if (!transcriptRef.current && !hasErrorRef.current) setError('noSpeech');
          setStatus('idle');
          removeListeners();
          moduleRef.current = null;
        }),
      ];
      ExpoSpeechRecognitionModule.start({ lang: locale, interimResults: true, continuous: false });
    } catch {
      removeListeners();
      moduleRef.current = null;
      setStatus('idle');
      setError('unavailable');
    }
  };

  const stop = () => {
    if (status !== 'listening') return;
    setStatus('processing');
    try { moduleRef.current?.stop(); }
    catch { setStatus('idle'); setError('failed'); }
  };

  return { status, transcript, finalTranscript, error, start, stop, abort };
}
