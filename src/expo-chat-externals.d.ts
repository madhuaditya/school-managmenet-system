declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name?: string;
    mimeType?: string | null;
  }

  export interface DocumentPickerResult {
    canceled: boolean;
    assets?: DocumentPickerAsset[];
  }

  export function getDocumentAsync(options?: {
    multiple?: boolean;
    type?: string | string[];
    copyToCacheDirectory?: boolean;
  }): Promise<DocumentPickerResult>;
}

declare module 'socket.io-client' {
  export interface Socket {
    connected: boolean;
    removeAllListeners(): this;
    on(event: string, listener: (...args: any[]) => void): this;
    disconnect(): this;
    connect(): this;
    timeout(ms: number): this;
    emit(event: string, ...args: any[]): this;
  }

  export function io(url: string, options?: Record<string, unknown>): Socket;
}
