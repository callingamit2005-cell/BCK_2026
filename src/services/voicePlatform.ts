import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { lifecycleService } from "@/services/lifecycleService";

export type VoicePlatform = "web" | "capacitor" | "unsupported";

export type PlatformVoiceErrorCode =
  | "UNSUPPORTED_BROWSER"
  | "PERMISSION_DENIED"
  | "NO_SPEECH"
  | "AUDIO_CAPTURE"
  | "ABORTED"
  | "TIMEOUT"
  | "RECOGNITION_ERROR";

export interface PlatformVoiceError {
  code: PlatformVoiceErrorCode;
  message: string;
}

export interface PlatformVoiceStartOptions {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: PlatformVoiceError) => void;
}

export interface PlatformVoiceSession {
  stop: () => Promise<void>;
  abort: () => Promise<void>;
  cleanup: () => Promise<void>;
}

const isBrowser = typeof window !== "undefined";

const mapWebError = (error: string | undefined): PlatformVoiceErrorCode => {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "PERMISSION_DENIED";
    case "no-speech":
      return "NO_SPEECH";
    case "audio-capture":
      return "AUDIO_CAPTURE";
    case "aborted":
      return "ABORTED";
    default:
      return "RECOGNITION_ERROR";
  }
};

export const detectVoicePlatform = (): VoicePlatform => {
  if (!isBrowser) return "unsupported";
  if (Capacitor.isNativePlatform()) return "capacitor";
  const ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return ctor ? "web" : "unsupported";
};

export const requestPlatformSpeechPermission = async (): Promise<boolean> => {
  const platform = detectVoicePlatform();
  if (platform === "unsupported") return false;

  if (platform === "capacitor") {
    try {
      const current = await SpeechRecognition.checkPermissions();
      if (current?.speechRecognition === "granted") return true;
      const requested = await SpeechRecognition.requestPermissions();
      return requested?.speechRecognition === "granted";
    } catch {
      return false;
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
};

const startWebSession = async (opts: PlatformVoiceStartOptions): Promise<PlatformVoiceSession | null> => {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  let disposed = false;

  recognition.lang = opts.language;
  recognition.continuous = opts.continuous;
  recognition.interimResults = opts.interimResults;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (disposed) return;
    opts.onStart?.();
  };

  recognition.onresult = (event: any) => {
    if (disposed) return;
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0].transcript ?? "";
      if (event.results[i].isFinal) {
        finalText += ` ${piece}`;
      } else {
        interim += ` ${piece}`;
      }
    }
    if (interim.trim()) opts.onResult(interim.trim(), false);
    if (finalText.trim()) opts.onResult(finalText.trim(), true);
  };

  recognition.onerror = (event: any) => {
    if (disposed) return;
    opts.onError?.({
      code: mapWebError(event?.error),
      message: event?.error || "Voice recognition error.",
    });
  };

  recognition.onend = () => {
    if (disposed) return;
    opts.onEnd?.();
  };

  try {
    recognition.start();
  } catch (error: any) {
    opts.onError?.({
      code: error?.name === "InvalidStateError" ? "ABORTED" : "RECOGNITION_ERROR",
      message: error?.message || "Could not start web recognition.",
    });
    return null;
  }

  const cleanup = async () => {
    if (disposed) return;
    disposed = true;
    try {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    } catch {
      // noop
    }
  };

  return {
    stop: async () => {
      if (disposed) return;
      try {
        recognition.stop();
      } catch {
        // noop
      }
    },
    abort: async () => {
      if (disposed) return;
      try {
        recognition.abort();
      } catch {
        // noop
      }
    },
    cleanup,
  };
};

const startCapacitorSession = async (opts: PlatformVoiceStartOptions): Promise<PlatformVoiceSession | null> => {
  const listeners: Array<{ remove: () => Promise<void> | void }> = [];
  let disposed = false;

  try {
    const partial = await SpeechRecognition.addListener("partialResults", (data: any) => {
      if (disposed) return;
      const text = data?.matches?.[0] ?? "";
      if (!text) return;
      opts.onResult(text, false);
    });
    listeners.push(partial);

    const final = await SpeechRecognition.addListener("results", (data: any) => {
      if (disposed) return;
      const text = data?.matches?.[0] ?? "";
      if (!text) return;
      opts.onResult(text, true);
      opts.onEnd?.();
    });
    listeners.push(final);

    await SpeechRecognition.start({
      language: opts.language,
      maxResults: 1,
      partialResults: true,
      popup: false,
    });
    opts.onStart?.();
  } catch (error: any) {
    const message = String(error?.message || error || "Native speech recognition failed.");
    const lower = message.toLowerCase();
    const code: PlatformVoiceErrorCode = lower.includes("permission")
      ? "PERMISSION_DENIED"
      : lower.includes("no speech")
        ? "NO_SPEECH"
        : lower.includes("aborted")
          ? "ABORTED"
          : lower.includes("timeout")
            ? "TIMEOUT"
            : "RECOGNITION_ERROR";
    opts.onError?.({ code, message });
    for (const l of listeners) {
      try {
        await l.remove();
      } catch {
        // noop
      }
    }
    return null;
  }

  const cleanup = async () => {
    if (disposed) return;
    disposed = true;
    for (const l of listeners) {
      try {
        await l.remove();
      } catch {
        // noop
      }
    }
    try {
      await SpeechRecognition.stop();
    } catch {
      // noop
    }
  };

  return {
    stop: async () => {
      try {
        await SpeechRecognition.stop();
      } catch {
        // noop
      }
      opts.onEnd?.();
    },
    abort: async () => {
      try {
        await SpeechRecognition.stop();
      } catch {
        // noop
      }
      opts.onError?.({ code: "ABORTED", message: "Voice session aborted." });
      opts.onEnd?.();
    },
    cleanup,
  };
};

export const startPlatformListening = async (
  opts: PlatformVoiceStartOptions,
): Promise<PlatformVoiceSession | null> => {
  const platform = detectVoicePlatform();
  if (platform === "unsupported") return null;
  if (platform === "capacitor") return startCapacitorSession(opts);
  return startWebSession(opts);
};

export const addBackgroundListener = (onBackground: () => void): (() => void) => {
  if (!isBrowser) return () => {};

  // 🛡️ [RUNTIME_STABILIZATION] Use centralized lifecycle service
  return lifecycleService.onStateChange((isActive) => {
    if (!isActive) onBackground();
  });
};
