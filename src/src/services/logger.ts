import { Directory, File, Paths } from 'expo-file-system';

const LOG_DIRECTORY = new Directory(Paths.document, 'logs');
const LOG_FILE = new File(LOG_DIRECTORY, 'console-errors.jsonl');
const MAX_LOG_FILE_SIZE = 1024 * 1024;

let initialized = false;
let originalConsoleLog: typeof console.log | null = null;
let originalConsoleError: typeof console.error | null = null;
let initializationPromise: Promise<void> | null = null;

const safeSerialize = (value: unknown) => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const ensureLogStorage = async () => {
  try {
    LOG_DIRECTORY.create();
  } catch {
    // Directory may already exist.
  }
};

const rotateLogIfNeeded = async () => {
  if (LOG_FILE.exists && (LOG_FILE.size ?? 0) > MAX_LOG_FILE_SIZE) {
    LOG_FILE.delete();
  }
};

const appendLogLine = async (line: string) => {
  await ensureLogStorage();
  await rotateLogIfNeeded();

  const existing = LOG_FILE.exists ? LOG_FILE.text() : '';
  await LOG_FILE.write(`${existing}${line}\n`);
};

const createLogger = (level: 'log' | 'error', originalMethod: typeof console.log | typeof console.error | null) => {
  return (...args: unknown[]) => {
    originalMethod?.(...args);

    const payload = {
      level,
      timestamp: new Date().toISOString(),
      message: args.map(safeSerialize),
    };

    void appendLogLine(JSON.stringify(payload)).catch((error) => {
      originalConsoleError?.('Failed to persist console log:', error);
    });
  };
};

export const initializeConsoleErrorLogger = async () => {
  if (initialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      originalConsoleLog = console.log.bind(console);
      originalConsoleError = console.error.bind(console);

      console.log = createLogger('log', originalConsoleLog);
      console.error = createLogger('error', originalConsoleError);

      initialized = true;
    })();
  }

  await initializationPromise;
};

export const getConsoleErrorLogPath = () => LOG_FILE;