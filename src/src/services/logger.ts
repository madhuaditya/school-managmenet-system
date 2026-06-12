import { Directory, File, Paths } from 'expo-file-system';

const LOG_DIRECTORY = new Directory(Paths.document, 'logs');
const LOG_FILE = new File(LOG_DIRECTORY, 'console-errors.jsonl');

const MAX_LOG_FILE_SIZE = 1024 * 1024; // 1 MB

let initialized = false;
let initializationPromise: Promise<void> | null = null;

let originalConsoleLog: typeof console.log | null = null;
let originalConsoleError: typeof console.error | null = null;

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
    if (!LOG_DIRECTORY.exists) {
      LOG_DIRECTORY.create({ intermediates: true });
    }

    if (!LOG_FILE.exists) {
      LOG_FILE.create();
    }
  } catch {
    // ignore
  }
};

const rotateLogIfNeeded = async () => {
  try {
    if (
      LOG_FILE.exists &&
      typeof LOG_FILE.size === 'number' &&
      LOG_FILE.size > MAX_LOG_FILE_SIZE
    ) {
      LOG_FILE.delete();
      LOG_FILE.create();
    }
  } catch {
    // ignore
  }
};

const appendLogLine = async (line: string) => {
  await ensureLogStorage();
  await rotateLogIfNeeded();

  try {
    const existingContent = LOG_FILE.exists
      ? LOG_FILE.text()
      : '';

    LOG_FILE.write(`${existingContent}${line}\n`);
  } catch (error) {
    originalConsoleError?.('Failed to append log:', error);
  }
};

const createLogger = (
  level: 'log' | 'error',
  originalMethod: typeof console.log | typeof console.error | null,
) => {
  return (...args: unknown[]) => {
    originalMethod?.(...args);

    const payload = {
      level,
      timestamp: new Date().toISOString(),
      message: args.map(safeSerialize),
    };

    void appendLogLine(JSON.stringify(payload)).catch((error) => {
      originalConsoleError?.(
        'Failed to persist console log:',
        error,
      );
    });
  };
};

export const initializeConsoleErrorLogger = async () => {
  if (initialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await ensureLogStorage();

      originalConsoleLog = console.log.bind(console);
      originalConsoleError = console.error.bind(console);

      console.log = createLogger('log', originalConsoleLog);
      console.error = createLogger('error', originalConsoleError);

      initialized = true;
    })();
  }

  await initializationPromise;
};

export const getConsoleErrorLogPath = () => LOG_FILE.uri;

export const getLogsContent = async (): Promise<string> => {
  try {
    if (!LOG_FILE.exists) {
      return '';
    }

    return LOG_FILE.text();
  } catch {
    return '';
  }
};

export const clearLogs = async () => {
  try {
    if (LOG_FILE.exists) {
      LOG_FILE.delete();
    }

    LOG_FILE.create();
  } catch (error) {
    originalConsoleError?.('Failed to clear logs:', error);
  }
};