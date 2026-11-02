import { File } from 'expo-file-system';

export function discardFile(uri?: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
  }
}

export function fileSize(uri: string): number {
  try {
    return new File(uri).size ?? 0;
  } catch {
    return 0;
  }
}
