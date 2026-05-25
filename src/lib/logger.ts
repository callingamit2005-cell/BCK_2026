const prefix = "[BachatKaro]";

type LogContext = Record<string, unknown>;

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
};

export const logger = {
  info(message: string, context?: LogContext) {
    if (context) {
      console.info(prefix, message, safeStringify(context));
      return;
    }
    console.info(prefix, message);
  },
  warn(message: string, context?: LogContext) {
    if (context) {
      console.warn(prefix, message, safeStringify(context));
      return;
    }
    console.warn(prefix, message);
  },
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(prefix, message, error, context ? safeStringify(context) : "");
  },
};
