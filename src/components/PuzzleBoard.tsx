import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, PlusCircle, Sparkles, Check, Move, HelpCircle } from 'lucide-react';
import { PuzzleData } from '../types/puzzle';
import { generateSolvableSlidingBoard } from '../utils/imageProcessor';
import { playSlideSound, playSnapSuccessSound, playVictorySound } from '../utils/audio';

interface PuzzleBoardProps {
  puzzle: PuzzleData;
  onCreateAnother: () => void;
  isRecipientView?: boolean;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  puzzle,
  onCreateAnother,
  isRecipientView = true,
}) => {
  const gridSize = puzzle.gridSize;
  const totalSlots = gridSize * gridSize;
  const totalMovableTiles = totalSlots - 1;

  // Board state: board[pos] is the correctIndex of the tile at position pos, or null if empty
  const [board, setBoard] = useState<(number | null)[]>(() => {
    if (puzzle.initialBoard && puzzle.initialBoard.length === totalSlots) {
      return [...puzzle.initialBoard];
    }
    return generateSolvableSlidingBoard(gridSize);
  });

  const [movesCount, setMovesCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [justSnappedIndex, setJustSnappedIndex] = useState<number | null>(null);

  // Measure solved tiles count (excluding empty space)
  const solvedTilesCount = board.filter(
    (tileIndex, pos) => tileIndex !== null && tileIndex === pos
  ).length;

  const progressPercent = Math.round((solvedTilesCount / totalMovableTiles) * 100);

  // Check if puzzle is solved
  useEffect(() => {
    if (solvedTilesCount === totalMovableTiles && !isCompleted) {
      setIsCompleted(true);
      playVictorySound();

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 250);
    }
  }, [solvedTilesCount, totalMovableTiles, isCompleted]);

  // Handle Play Again with new solvable shuffle
  const handlePlayAgain = useCallback(() => {
    const newBoard = generateSolvableSlidingBoard(gridSize);
    setBoard(newBoard);
    setMovesCount(0);
    setIsCompleted(false);
    setJustSnappedIndex(null);
  }, [gridSize]);

  // Move tile at position `fromPos` into the empty space if adjacent
  const moveTileByPosition = useCallback(
    (fromPos: number) => {
      if (isCompleted) return;

      const emptyPos = board.indexOf(null);
      if (emptyPos === -1) return;

      const row = Math.floor(fromPos / gridSize);
      const col = fromPos % gridSize;
      const emptyRow = Math.floor(emptyPos / gridSize);
      const emptyCol = emptyPos % gridSize;

      const isAdjacent =
        Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

      if (!isAdjacent) {
        // Not adjacent: cannot move!
        return;
      }

      const tileIndex = board[fromPos];
      if (tileIndex === null) return;

      // Perform the slide
      const newBoard = [...board];
      newBoard[emptyPos] = tileIndex;
      newBoard[fromPos] = null;

      setBoard(newBoard);
      setMovesCount((m) => m + 1);
      playSlideSound();

      // Check if this tile just landed in its correct position
      if (tileIndex === emptyPos) {
        playSnapSuccessSound();
        setJustSnappedIndex(tileIndex);
        setTimeout(() => {
          setJustSnappedIndex((curr) => (curr === tileIndex ? null : curr));
        }, 600);
      }
    },
    [board, gridSize, isCompleted]
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;
      const emptyPos = board.indexOf(null);
      if (emptyPos === -1) return;

      const emptyRow = Math.floor(emptyPos / gridSize);
      const emptyCol = emptyPos % gridSize;

      let targetPos: number | null = null;
      if (e.key === 'ArrowUp' && emptyRow < gridSize - 1) {
        // Tile below moves up into empty space
        targetPos = (emptyRow + 1) * gridSize + emptyCol;
      } else if (e.key === 'ArrowDown' && emptyRow > 0) {
        // Tile above moves down into empty space
        targetPos = (emptyRow - 1) * gridSize + emptyCol;
      } else if (e.key === 'ArrowLeft' && emptyCol < gridSize - 1) {
        // Tile to the right moves left into empty space
        targetPos = emptyRow * gridSize + (emptyCol + 1);
      } else if (e.key === 'ArrowRight' && emptyCol > 0) {
        // Tile to the left moves right into empty space
        targetPos = emptyRow * gridSize + (emptyCol - 1);
      }

      if (targetPos !== null) {
        e.preventDefault();
        moveTileByPosition(targetPos);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gridSize, isCompleted, moveTileByPosition]);

  // Touch swipe support on board
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isCompleted) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 25) return; // Ignore small taps

    const emptyPos = board.indexOf(null);
    if (emptyPos === -1) return;
    const emptyRow = Math.floor(emptyPos / gridSize);
    const emptyCol = emptyPos % gridSize;

    let targetPos: number | null = null;

    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0 && emptyCol > 0) {
        // Swiped right -> tile on left slides into empty space
        targetPos = emptyRow * gridSize + (emptyCol - 1);
      } else if (dx < 0 && emptyCol < gridSize - 1) {
        // Swiped left -> tile on right slides into empty space
        targetPos = emptyRow * gridSize + (emptyCol + 1);
      }
    } else {
      // Vertical swipe
      if (dy > 0 && emptyRow > 0) {
        // Swiped down -> tile above slides into empty space
        targetPos = (emptyRow - 1) * gridSize + emptyCol;
      } else if (dy < 0 && emptyRow < gridSize - 1) {
        // Swiped up -> tile below slides into empty space
        targetPos = (emptyRow + 1) * gridSize + emptyCol;
      }
    }

    if (targetPos !== null) {
      moveTileByPosition(targetPos);
    }
  };

  // Find empty position to know which tiles are movable
  const emptyPos = board.indexOf(null);
  const emptyRow = emptyPos !== -1 ? Math.floor(emptyPos / gridSize) : -1;
  const emptyCol = emptyPos !== -1 ? emptyPos % gridSize : -1;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center select-none">
      {/* HEADER */}
      <div className="w-full text-center space-y-1 mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center justify-center gap-2">
          <span>🧩 Reveal the Photo</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
          Slide the tiles into number order to reveal the hidden photo piece by piece.
        </p>
      </div>

      {/* PROGRESS BAR & STATS */}
      <div className="w-full max-w-[400px] mb-4 bg-white rounded-2xl border border-neutral-200/80 p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Photo Revealed:
          </span>
          <span className="text-indigo-600 font-extrabold text-sm sm:text-base">
            {solvedTilesCount} / {totalMovableTiles}
          </span>
        </div>

        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200/50 mb-2">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
          <span>Tap any tile next to the empty space</span>
          <span>Moves: {movesCount}</span>
        </div>
      </div>

      {/* SLIDING PUZZLE BOARD */}
      <div className="w-full flex justify-center mb-5">
        <div
          className={`relative aspect-square w-full max-w-[360px] sm:max-w-[420px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 bg-neutral-200 p-1 ${
            isCompleted
              ? 'border-4 border-emerald-500 shadow-emerald-500/25 ring-4 ring-emerald-500/20'
              : 'border-2 border-neutral-300'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {/* Background grid showing empty slot outlines */}
          <div
            className="absolute inset-1 grid gap-1 pointer-events-none"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: totalSlots }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className="w-full h-full rounded-xl bg-neutral-300/40 border border-neutral-300/60 shadow-inner flex items-center justify-center"
              >
                <span className="text-[11px] font-bold text-neutral-400/40">
                  {i === totalSlots - 1 ? ' ' : i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Complete Full Image when 100% Solved */}
          {isCompleted && (
            <img
              src={puzzle.fullImageUrl}
              alt="Complete photograph revealed"
              className="absolute inset-0 w-full h-full object-cover animate-fade-in z-30 pointer-events-none"
            />
          )}

          {/* MOVING TILES LAYER */}
          <div className="relative w-full h-full">
            {puzzle.pieces.map((piece) => {
              // The last piece (index totalSlots - 1) is the empty space in sliding puzzle
              if (piece.correctIndex === totalSlots - 1) return null;

              // Current position of this piece on the board
              const currentPos = board.indexOf(piece.correctIndex);
              if (currentPos === -1) return null;

              const row = Math.floor(currentPos / gridSize);
              const col = currentPos % gridSize;

              // Is this tile currently in its correct position?
              const isCorrect = currentPos === piece.correctIndex;
              const isJustSnapped = justSnappedIndex === piece.correctIndex;

              // Is this tile adjacent to empty space and movable?
              const isMovable =
                !isCompleted &&
                emptyPos !== -1 &&
                Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

              const tileWidthPercent = 100 / gridSize;
              const tileHeightPercent = 100 / gridSize;

              return (
                <div
                  key={piece.id}
                  onClick={() => moveTileByPosition(currentPos)}
                  className={`absolute p-0.5 sm:p-1 transition-all duration-200 ease-out select-none ${
                    isMovable ? 'cursor-pointer hover:scale-[0.98]' : 'cursor-default'
                  }`}
                  style={{
                    width: `${tileWidthPercent}%`,
                    height: `${tileHeightPercent}%`,
                    top: `${row * tileHeightPercent}%`,
                    left: `${col * tileWidthPercent}%`,
                    zIndex: isMovable ? 10 : 5,
                  }}
                >
                  <div
                    className={`relative w-full h-full rounded-xl overflow-hidden shadow-md transition-all duration-300 border ${
                      isCorrect
                        ? 'border-emerald-400/60 ring-2 ring-emerald-500/30'
                        : isMovable
                        ? 'border-indigo-400 hover:ring-2 hover:ring-indigo-400/50'
                        : 'border-neutral-200'
                    }`}
                  >
                    {/* PHOTO SECTION:
                        If isCorrect: Clear photo section
                        If !isCorrect: Blurred photo section */}
                    <img
                      src={isCorrect ? piece.clearDataUrl : piece.blurredDataUrl}
                      alt={`Tile ${piece.number}`}
                      className={`w-full h-full object-cover pointer-events-none transition-all duration-500 ${
                        isCorrect ? 'filter-none scale-100' : 'filter-none'
                      }`}
                      draggable={false}
                    />

                    {/* LARGE NUMBER ON BLURRED TILES ONLY:
                        "No number should be visible after it is revealed.
                         Unsolved tile: Blurred photograph section + number" */}
                    {!isCorrect && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center justify-center min-w-[28px] sm:min-w-[34px] h-7 sm:h-8 px-2 rounded-full bg-black/65 text-white font-black text-sm sm:text-base backdrop-blur-xs shadow-lg border border-white/25">
                          {piece.number}
                        </span>
                      </div>
                    )}

                    {/* Subtle pulse/checkmark on arrival */}
                    {isJustSnapped && isCorrect && (
                      <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center animate-ping-once pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    {/* Subtle movable indicator dot for adjacent tiles */}
                    {isMovable && !isCorrect && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 border border-white shadow-xs pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FINAL STATE CELEBRATION (When completed) */}
      {isCompleted ? (
        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 text-center space-y-4 animate-scale-up z-30">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-1">
            <span className="text-2xl">🎉</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-neutral-900">
              🎉 Photo Revealed!
            </h2>
            <p className="text-sm text-neutral-600">
              You solved the sliding puzzle in {movesCount} moves! The complete photo is now unlocked.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePlayAgain}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3.5 px-4 rounded-xl transition-colors cursor-pointer text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              onClick={onCreateAnother}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4 text-yellow-400" />
              <span>Create Another Puzzle</span>
            </button>
          </div>
        </div>
      ) : (
        /* HELPER INFO */
        <div className="w-full max-w-[420px] text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
            <Move className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tap adjacent tile to slide into empty space</span>
          </div>

          <p className="text-[11px] text-neutral-400">
            Keyboard arrow keys (↑ ↓ ← →) or screen swipe also supported
          </p>
        </div>
      )}
    </div>
  );
};
