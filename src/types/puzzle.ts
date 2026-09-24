export interface PuzzlePiece {
  id: string;
  correctIndex: number; // 0 to N^2 - 1
  number: number;       // 1 to N^2
  row: number;
  col: number;
  blurredDataUrl: string;
  clearDataUrl: string;
}

export interface PuzzleData {
  id: string;
  createdAt: number;
  gridSize: number;     // 3, 4, 5, 6
  piecesCount: number;  // 9, 16, 25, 36
  fullImageUrl: string;
  pieces: PuzzlePiece[];
  initialBoard?: (number | null)[];
  aspectRatio: number;
}
