import type { FocusFolderOut } from '@/lib/focusTypes';

export interface FolderOption {
  id: number;
  label: string;
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function flattenFolders(folders: FocusFolderOut[], prefix = ''): FolderOption[] {
  return folders.flatMap((folder) => {
    const label = prefix ? `${prefix} / ${folder.name}` : folder.name;
    return [
      { id: folder.id, label },
      ...flattenFolders(folder.children ?? [], label),
    ];
  });
}

export function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}
