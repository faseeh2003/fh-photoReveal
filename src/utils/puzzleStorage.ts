import { PuzzleData } from '../types/puzzle';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY_PREFIX = 'reveal_puzzle_';

export async function savePuzzle(puzzle: PuzzleData): Promise<boolean> {
  // Keep a local copy for the creator, but Supabase is the shared source of truth.
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzle.id}`, JSON.stringify(puzzle));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  const { error } = await supabase
    .from('puzzles')
    .insert({
      id: puzzle.id,
      image_url: puzzle.fullImageUrl,
      grid_size: puzzle.gridSize,
      tiles: puzzle,
    });

  if (error) {
    console.error('Supabase save failed:', error);
    return false;
  }

  return true;
}

export async function fetchPuzzle(puzzleId: string): Promise<PuzzleData | null> {
  // Shared cloud copy first.
  try {
    const { data, error } = await supabase
      .from('puzzles')
      .select('tiles')
      .eq('id', puzzleId)
      .maybeSingle();

    if (!error && data?.tiles) {
      const puzzle = data.tiles as PuzzleData;
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzleId}`, JSON.stringify(puzzle));
      } catch {}
      return puzzle;
    }

    if (error) console.warn('Supabase fetch failed:', error);
  } catch (err) {
    console.warn('Could not fetch puzzle from Supabase:', err);
  }

  // Local fallback for puzzles created on this device.
  try {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${puzzleId}`);
    if (local) return JSON.parse(local);
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
