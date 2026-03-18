export function safeStorageGet<T = Record<string, unknown>>(keys: string[]): Promise<T>;
export function safeStorageSet(items: Record<string, unknown>): Promise<void>;
export function safeStorageRemove(keys: string[]): Promise<void>;
