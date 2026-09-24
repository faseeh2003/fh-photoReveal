import { PuzzleData, PuzzlePiece } from '../types/puzzle';

export function generatePuzzleId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

/**
 * Loads an image from a File, Blob, or URL string into an HTMLImageElement
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (typeof source === 'string') {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from source'));
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image from reader'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Generates a guaranteed solvable sliding board by performing genuine random sliding moves
 * starting from the solved state.
 */
export function generateSolvableSlidingBoard(
  gridSize: number,
  shuffleMoves: number = 220
): (number | null)[] {
  const totalSlots = gridSize * gridSize;
  // Initially, slot i contains tile i (0 to totalSlots - 2), and last slot has null (empty)
  const board: (number | null)[] = Array.from({ length: totalSlots }, (_, i) =>
    i === totalSlots - 1 ? null : i
  );

  let emptyPos = totalSlots - 1;
  let lastMovedPos = -1;

  for (let m = 0; m < shuffleMoves; m++) {
    const emptyRow = Math.floor(emptyPos / gridSize);
    const emptyCol = emptyPos % gridSize;

    const neighbors: number[] = [];
    if (emptyRow > 0) neighbors.push(emptyPos - gridSize); // Top neighbor
    if (emptyRow < gridSize - 1) neighbors.push(emptyPos + gridSize); // Bottom neighbor
    if (emptyCol > 0) neighbors.push(emptyPos - 1); // Left neighbor
    if (emptyCol < gridSize - 1) neighbors.push(emptyPos + 1); // Right neighbor

    // Avoid immediately reversing the move
    const candidates = neighbors.filter((pos) => pos !== lastMovedPos);
    const pool = candidates.length > 0 ? candidates : neighbors;

    const chosenPos = pool[Math.floor(Math.random() * pool.length)];

    // Slide chosen tile into emptyPos
    board[emptyPos] = board[chosenPos];
    board[chosenPos] = null;
    lastMovedPos = emptyPos;
    emptyPos = chosenPos;
  }

  // Ensure it's not accidentally solved already
  const solvedCount = board.filter((val, idx) => val === idx).length;
  if (solvedCount >= totalSlots - 2) {
    // Perform a few more moves
    return generateSolvableSlidingBoard(gridSize, 50);
  }

  return board;
}

/**
 * Creates blurred and clear image pieces from an uploaded image
 */
export async function createPuzzleFromImage(
  imageSource: File | Blob | string,
  gridSize: number = 4
): Promise<PuzzleData> {
  const img = await loadImage(imageSource);
  const piecesCount = gridSize * gridSize;

  // Standardize the working canvas size (e.g. 640x640)
  const targetSize = 640;
  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = targetSize;
  masterCanvas.height = targetSize;
  const masterCtx = masterCanvas.getContext('2d');
  if (!masterCtx) throw new Error('Could not get canvas context');

  // Center crop the original image into a square
  const minDim = Math.min(img.naturalWidth, img.naturalHeight);
  const srcX = (img.naturalWidth - minDim) / 2;
  const srcY = (img.naturalHeight - minDim) / 2;

  masterCtx.drawImage(
    img,
    srcX,
    srcY,
    minDim,
    minDim,
    0,
    0,
    targetSize,
    targetSize
  );

  const fullImageUrl = masterCanvas.toDataURL('image/jpeg', 0.88);
  const pieceSize = targetSize / gridSize;

  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const correctIndex = row * gridSize + col;
      const pieceNumber = correctIndex + 1;

      // 1. Create Clear Piece
      const clearCanvas = document.createElement('canvas');
      clearCanvas.width = pieceSize;
      clearCanvas.height = pieceSize;
      const clearCtx = clearCanvas.getContext('2d');
      if (!clearCtx) continue;

      clearCtx.drawImage(
        masterCanvas,
        col * pieceSize,
        row * pieceSize,
        pieceSize,
        pieceSize,
        0,
        0,
        pieceSize,
        pieceSize
      );
      const clearDataUrl = clearCanvas.toDataURL('image/jpeg', 0.85);

      // 2. Create Blurred Piece
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = pieceSize;
      blurCanvas.height = pieceSize;
      const blurCtx = blurCanvas.getContext('2d');
      if (!blurCtx) continue;

      // Downscale-upscale box blur fallback for all platforms
      const miniCanvas = document.createElement('canvas');
      const miniDim = Math.max(12, Math.floor(pieceSize / 12));
      miniCanvas.width = miniDim;
      miniCanvas.height = miniDim;
      const miniCtx = miniCanvas.getContext('2d');

      if (miniCtx) {
        miniCtx.imageSmoothingEnabled = true;
        miniCtx.drawImage(
          clearCanvas,
          0,
          0,
          pieceSize,
          pieceSize,
          0,
          0,
          miniDim,
          miniDim
        );

        blurCtx.imageSmoothingEnabled = true;
        if ('filter' in blurCtx) {
          blurCtx.filter = 'blur(6px)';
        }
        blurCtx.drawImage(
          miniCanvas,
          0,
          0,
          miniDim,
          miniDim,
          0,
          0,
          pieceSize,
          pieceSize
        );
        blurCtx.filter = 'none';
      } else {
        blurCtx.filter = 'blur(16px)';
        blurCtx.drawImage(clearCanvas, 0, 0);
      }

      const blurredDataUrl = blurCanvas.toDataURL('image/jpeg', 0.82);

      pieces.push({
        id: `piece-${correctIndex}`,
        correctIndex,
        number: pieceNumber,
        row,
        col,
        blurredDataUrl,
        clearDataUrl,
      });
    }
  }

  const initialBoard = generateSolvableSlidingBoard(gridSize);

  return {
    id: generatePuzzleId(),
    createdAt: Date.now(),
    gridSize,
    piecesCount,
    fullImageUrl,
    pieces,
    initialBoard,
    aspectRatio: 1,
  };
}
