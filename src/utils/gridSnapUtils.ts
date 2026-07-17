export interface GridDimensions {
  N: number;
  M: number;
}

export interface GridCell {
  row: number;
  col: number;
}

const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 40;
const MAX_BOARD_WIDTH = 640;
const MAX_BOARD_HEIGHT = 560;

export function getOptimalCellSize(gridDimensions: GridDimensions): number {
  const byWidth = MAX_BOARD_WIDTH / gridDimensions.N;
  const byHeight = MAX_BOARD_HEIGHT / gridDimensions.M;
  const size = Math.min(byWidth, byHeight, MAX_CELL_SIZE);
  return Math.max(MIN_CELL_SIZE, Math.floor(size));
}

export function pointerToGridCell(
  clientX: number,
  clientY: number,
  boardRect: DOMRect,
  cellSize: number,
  gridDimensions: GridDimensions
): GridCell | null {
  const x = clientX - boardRect.left;
  const y = clientY - boardRect.top;

  if (x < 0 || y < 0 || x >= boardRect.width || y >= boardRect.height) {
    return null;
  }

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (col < 0 || col >= gridDimensions.N || row < 0 || row >= gridDimensions.M) {
    return null;
  }

  return { row, col };
}
