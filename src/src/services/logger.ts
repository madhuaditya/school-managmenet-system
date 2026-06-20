import { Directory, File, Paths } from 'expo-file-system';

const LOG_DIR = new Directory(Paths.document, 'logs');

const ensureDirectory = async (
  type: 'success' | 'error' | 'warning'
) => {
  try {
    if (!LOG_DIR.exists) {
      LOG_DIR.create({ intermediates: true });
    }

    const typeDir = new Directory(LOG_DIR, type);

    if (!typeDir.exists) {
      typeDir.create({ intermediates: true });
    }

    return typeDir;
  } catch (err) {
    console.error('Failed creating log directory', err);
    throw err;
  }
};

const writeLog = async (
  type: 'success' | 'error' | 'warning',
  message: unknown,
) => {
  try {
    const dir = await ensureDirectory(type);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-');

    const file = new File(
      dir,
      `${type}-${timestamp}.json`
    );

    const payload = {
      type,
      timestamp: new Date().toISOString(),
      data:
        message instanceof Error
          ? {
              name: message.name,
              message: message.message,
              stack: message.stack,
            }
          : message,
    };

    file.create();

    file.write(
      JSON.stringify(payload, null, 2)
    );
    // console.log(`Log written to ${file.uri}` ,JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Failed writing log', err);
  }
};

export const logSuccess = async (
  message: unknown,
) => {
  await writeLog('success', message);
};

export const logError = async (
  message: unknown,
) => {
  // console.error('Logging error:', message);
  await writeLog('error', message);
};

export const logWarning = async (
  message: unknown,
) => {
  await writeLog('warning', message);
};