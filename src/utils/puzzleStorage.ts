import { PuzzleData } from '../types/puzzle';

const LOCAL_STORAGE_KEY_PREFIX = 'reveal_puzzle_';

export async function savePuzzle(puzzle: PuzzleData): Promise<boolean> {
  // Always save to localStorage first for instant local access
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzle.id}`, JSON.stringify(puzzle));
  } catch (e) {
    console.warn('LocalStorage save failed (possibly quota exceeded):', e);
  }

  // Also sync to Express backend
  try {
    const res = await fetch('/api/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(puzzle),
    });
    if (!res.ok) {
      console.warn('Server responded with non-200 for saving puzzle:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving puzzle to server:', err);
    // Local storage is still saved
    return true;
  }
}

export async function fetchPuzzle(puzzleId: string): Promise<PuzzleData | null> {
  // 1. Try server first
  try {
    const res = await fetch(`/api/puzzles/${puzzleId}`);
    if (res.ok) {
      const data = await res.json();
      // Cache locally
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzleId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch puzzle from server:', err);
  }

  // 2. Try localStorage fallback
  try {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzleId}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (err) {
    console.warn('Could not read puzzle from localStorage:', err);
  }

  return null;
}

export function buildPuzzleShareUrl(puzzleId: string): string {
  const origin = window.location.origin;
  return `${origin}/?p=${puzzleId}`;
}

export function buildWhatsAppShareUrl(shareUrl: string): string {
  const message = `I made a photo puzzle for you 🧩\nCan you solve it and reveal the photo? 👀\n${shareUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getShareMessage(shareUrl: string): string {
  return `I made a photo puzzle for you 🧩\nCan you solve it and reveal the photo? 👀\n${shareUrl}`;
}
