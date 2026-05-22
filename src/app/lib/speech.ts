import type { TranscriptLine } from "./realtime";

type SpeechRecognitionCtor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
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
  recognition.maxAlternatives = 3;

  let running = false;
  let lastFinal = "";
  let restartTimer: number | null = null;

  const startRecognition = () => {
    if (!running) return;
    try {
      recognition.start();
    } catch {
      restartTimer = window.setTimeout(startRecognition, 500);
    }
  };

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
    if (running) restartTimer = window.setTimeout(startRecognition, 250);
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      running = false;
    }
  };

  return {
    start() {
      running = true;
      startRecognition();
    },
    stop() {
      running = false;
      if (restartTimer) window.clearTimeout(restartTimer);
      recognition.stop();
    },
  };
}
