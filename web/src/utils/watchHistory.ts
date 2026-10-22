import type { Video } from '../api/types';

export type WatchHistoryItem = {
  videoId: string;
  video: Video;
  watchedAt: number;
  progressSec: number;
  duration: number;
};

const STORAGE_KEY = 'dy:watch_history';
const MAX_HISTORY = 100;

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordWatch(video: Video, progressSec = 0) {
  if (!video || !video.id) return;
  try {
    const history = getWatchHistory();
    const now = Date.now();
    const dur = video.duration || 15;
    const filtered = history.filter((item) => String(item.videoId) !== String(video.id));
    const entry: WatchHistoryItem = {
      videoId: String(video.id),
      video,
      watchedAt: now,
      progressSec: Math.round(progressSec * 10) / 10,
      duration: dur,
    };
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dy:history_updated', { detail: updated }));
  } catch {
    // ignore localStorage errors
  }
}

export function clearWatchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('dy:history_updated', { detail: [] }));
  } catch {
    // ignore
  }
}

export function removeWatchItem(videoId: string) {
  try {
    const history = getWatchHistory();
    const updated = history.filter((item) => String(item.videoId) !== String(videoId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dy:history_updated', { detail: updated }));
  } catch {
    // ignore
  }
}
