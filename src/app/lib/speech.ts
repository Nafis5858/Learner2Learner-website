import type { TranscriptLine } from "./realtime";

type SpeechRecognitionCtor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

export function createSpeechCapture(options: {
  speakerId: string;
  speakerName: string;
  onLine: (line: TranscriptLine) => void;
}) {
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let running = false;
  let lastFinal = "";

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = result[0]?.transcript?.trim();
      if (!result.isFinal || !text || text === lastFinal) continue;
      lastFinal = text;
      options.onLine({
        speakerId: options.speakerId,
        speakerName: options.speakerName,
        isYou: true,
        text,
      });
    }
  };

  recognition.onend = () => {
    if (running) {
      try {
        recognition.start();
      } catch {
        running = false;
      }
    }
  };

  recognition.onerror = () => {
    running = false;
  };

  return {
    start() {
      running = true;
      recognition.start();
    },
    stop() {
      running = false;
      recognition.stop();
    },
  };
}
