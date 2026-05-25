import {
  detectVoicePlatform,
  requestPlatformSpeechPermission,
  startPlatformListening,
  type PlatformVoiceErrorCode,
  type PlatformVoiceSession,
} from "@/services/voicePlatform";

export type VoicePermissionState = "idle" | "requesting" | "granted" | "denied";

export type VoiceErrorCode =
  | "UNSUPPORTED_BROWSER"
  | "PERMISSION_DENIED"
  | "NO_SPEECH"
  | "AUDIO_CAPTURE"
  | "ABORTED"
  | "TIMEOUT"
  | "DUPLICATE_START"
  | "RECOGNITION_ERROR";

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
}

export interface VoiceStartOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: VoiceError) => void;
}

export interface VoiceSession {
  stop: () => void;
  abort: () => void;
  cleanup: () => void;
}

const PERMISSION_KEY = "voice-permission-state";

const FILLER_WORDS = [
  "please",
  "plz",
  "uh",
  "um",
  "actually",
  "basically",
  "just",
  "about",
  "around",
  "for",
  "rupees",
  "rs",
  "rupee",
  "only",
  "ka",
  "ke",
  "ki",
  "mein",
  "me",
];

const CURRENCY_NORMALIZATION: Array<[RegExp, string]> = [
  [/\brupees?\b/gi, ""],
  [/\brs\.?\b/gi, ""],
  [/₹/g, ""],
  [/\b(\d+)\s*k\b/gi, "$1000"],
  [/\b(\d+)\s*lakh\b/gi, "$100000"],
];

let activeSession: PlatformVoiceSession | null = null;
let isStarting = false;

const isBrowser = typeof window !== "undefined";

const normalizeLanguage = (language?: string): string => {
  if (!language) return "en-IN";
  const lower = language.toLowerCase();
  const map: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    or: "or-IN",
    as: "as-IN",
  };
  return map[lower] ?? "en-IN";
};

export const getPermissionState = (): VoicePermissionState => {
  if (!isBrowser) return "idle";
  const stored = window.localStorage.getItem(PERMISSION_KEY);
  if (stored === "granted" || stored === "denied") return stored;
  return "idle";
};

const setPermissionState = (state: VoicePermissionState) => {
  if (!isBrowser) return;
  if (state === "granted" || state === "denied") {
    window.localStorage.setItem(PERMISSION_KEY, state);
  }
};

export const preprocessTranscript = (raw: string): string => {
  let text = raw.toLowerCase().trim();
  for (const [pattern, replacement] of CURRENCY_NORMALIZATION) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/[^\p{L}\p{N}\s.]/gu, " ");
  text = text
    .split(/\s+/)
    .filter((w) => w && !FILLER_WORDS.includes(w))
    .join(" ")
    .trim();
  return text;
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!isBrowser) return false;
  const allowed = await requestPlatformSpeechPermission();
  if (allowed) {
    setPermissionState("granted");
    return true;
  }
  if (detectVoicePlatform() === "unsupported") {
    return false;
  }
  if (!allowed) {
    setPermissionState("denied");
  }
  return false;
};

export const stopListening = () => {
  if (!activeSession) return;
  const session = activeSession;
  activeSession = null;
  void session.stop();
};

export const abortListening = () => {
  if (!activeSession) return;
  const session = activeSession;
  activeSession = null;
  void session.abort();
};

export const startListening = async (opts: VoiceStartOptions): Promise<VoiceSession | null> => {
  const platform = detectVoicePlatform();
  if (platform === "unsupported") {
    opts.onError?.({
      code: "UNSUPPORTED_BROWSER",
      message: "Voice recognition is not supported on this device.",
    });
    return null;
  }

  if (isStarting) {
    opts.onError?.({
      code: "DUPLICATE_START",
      message: "Voice is already starting. Please wait a moment.",
    });
    return null;
  }
  isStarting = true;

  try {
    if (activeSession) {
      await activeSession.cleanup();
      activeSession = null;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      opts.onError?.({
        code: "PERMISSION_DENIED",
        message: "Microphone permission denied.",
      });
      return null;
    }

    const session = await startPlatformListening({
      language: normalizeLanguage(opts.language),
      continuous: opts.continuous ?? true,
      interimResults: opts.interimResults ?? true,
      onStart: () => opts.onStart?.(),
      onResult: (rawText, isFinal) => {
        const processed = preprocessTranscript(rawText);
        if (!processed) return;
        opts.onResult(processed, isFinal);
      },
      onEnd: () => {
        activeSession = null;
        opts.onEnd?.();
      },
      onError: (error: { code: PlatformVoiceErrorCode; message: string }) => {
        const code = error.code as VoiceErrorCode;
        if (code === "PERMISSION_DENIED") {
          setPermissionState("denied");
        }
        opts.onError?.({
          code,
          message: error.message,
        });
      },
    });

    if (!session) {
      opts.onError?.({
        code: "RECOGNITION_ERROR",
        message: "Could not start voice recognition.",
      });
      return null;
    }

    activeSession = session;
    return {
      stop: () => {
        void session.stop();
      },
      abort: () => {
        void session.abort();
      },
      cleanup: () => {
        void session.cleanup();
      },
    };
  } finally {
    isStarting = false;
  }
};
