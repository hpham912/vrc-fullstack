import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { Language } from '../../context/LanguageContext.tsx';

// Shared text-to-speech. One hook for the whole app — any screen that
// needs to read something aloud uses this (directly, or through the
// shared ReadAloudButton), instead of each screen wiring up its own
// speech code.
//
// Why a native plugin: the browser Web Speech API (speechSynthesis)
// is unreliable inside the app's WebView — voices load late (or not
// at all), and on iOS it stays silent when the silent switch is on.
// The Capacitor Text-to-Speech plugin speaks through the phone's
// native engine (AVSpeechSynthesizer on iOS, Android TextToSpeech),
// so it works in the app and plays even with the silent switch on
// (category 'playback'). On the web it falls back to speechSynthesis.
//
// Language: pass 'vi' to read Vietnamese, 'en' to read English. The
// ReadAloudButton defaults to the app's current language, so it reads
// English when English is selected and Vietnamese when Vietnamese is
// selected. Vietnamese needs a Vietnamese voice on the device — iOS
// and Android both ship one, but it may need downloading in the
// phone's Settings (Accessibility > Spoken Content > Voices on iOS;
// Google TTS on Android) before it speaks Vietnamese.

// BCP 47 tag the device's TTS voice expects.
const bcpLang = (language: Language) => (language === 'vi' ? 'vi-VN' : 'en-US');

// Web Speech voices load asynchronously — getVoices() is empty until
// the browser fires voiceschanged, and an utterance with no voice
// silently never speaks. Wait for that event (max 1s) and pick the
// best voice for the language. Returns null when no matching voice
// exists; the caller still speaks (the browser picks a default).
const loadWebVoice = (language: Language): Promise<SpeechSynthesisVoice | null> => {
  return new Promise((resolve) => {
    const prefix = language === 'vi' ? 'vi' : 'en';
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) || null;
    };
    const immediate = pickVoice();
    if (immediate) {
      resolve(immediate);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(pickVoice());
    };
    const timer = window.setTimeout(finish, 1000);
    const onVoicesChanged = () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      finish();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  });
};

export const useReadAloud = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  const stop = useCallback(async () => {
    speakingRef.current = false;
    setIsSpeaking(false);
    // Native plugin.
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop();
      } catch {
        // Plugin not synced yet (needs `npx cap sync` on the Mac) —
        // nothing to stop.
      }
    }
    // Web Speech.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    async (text: string, language: Language) => {
      const cleanText = text.trim();
      if (!cleanText) return false;
      // Stop anything currently playing first, so a new read never
      // talks over the old one.
      await stop();
      const targetLang = bcpLang(language);
      // Native app: the Capacitor Text-to-Speech plugin.
      if (Capacitor.isNativePlatform()) {
        try {
          speakingRef.current = true;
          setIsSpeaking(true);
          await TextToSpeech.speak({
            text: cleanText,
            lang: targetLang,
            rate: 0.9,
            category: 'playback',
          });
          speakingRef.current = false;
          setIsSpeaking(false);
          return true;
        } catch {
          // Plugin not synced yet — fall through to Web Speech.
          speakingRef.current = false;
          setIsSpeaking(false);
        }
      }
      // Browser (and native fallback): Web Speech API.
      if ('speechSynthesis' in window) {
        const voice = await loadWebVoice(language);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang;
        utterance.rate = 0.9;
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          speakingRef.current = false;
          setIsSpeaking(false);
        };
        utterance.onerror = () => {
          speakingRef.current = false;
          setIsSpeaking(false);
        };
        speakingRef.current = true;
        setIsSpeaking(true);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      }
      return false;
    },
    [stop],
  );

  // Stop speaking when the screen using this hook unmounts, so audio
  // never keeps playing after the user leaves the tab.
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { isSpeaking, speak, stop };
};
