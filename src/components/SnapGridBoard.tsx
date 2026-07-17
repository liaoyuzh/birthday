'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { MappedPixel } from '../utils/pixelation';
import {
  GridDimensions,
  GridCell,
  getOptimalCellSize,
  pointerToGridCell,
} from '../utils/gridSnapUtils';
import { drawBoard } from '../utils/boardDrawUtils';

interface SnapGridBoardProps {
  patternGrid: MappedPixel[][];
  gridDimensions: GridDimensions;
  placedGrid: (string | null)[][];
  showGhost: boolean;
  fusionMap?: number[][] | null;
  hidden?: boolean;
  highlightColor?: string | null;
  onPointerUp: (clientX: number, clientY: number) => void;
  boardRef?: React.RefObject<HTMLDivElement | null>;
  hoverOverlayRef?: React.RefObject<HTMLDivElement | null>;
}

const SnapGridBoard: React.FC<SnapGridBoardProps> = ({
  patternGrid,
  gridDimensions,
  placedGrid,
  showGhost,
  fusionMap = null,
  hidden = false,
  highlightColor = null,
  onPointerUp,
  boardRef: externalBoardRef,
  hoverOverlayRef: externalHoverRef,
}) => {
  const internalBoardRef = useRef<HTMLDivElement>(null);
  const internalHoverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = externalBoardRef ?? internalBoardRef;
  const hoverOverlayRef = externalHoverRef ?? internalHoverRef;
  const cellSize = getOptimalCellSize(gridDimensions);
  const boardWidth = gridDimensions.N * cellSize;
  const boardHeight = gridDimensions.M * cellSize;

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      onPointerUp(e.clientX, e.clientY);
    },
    [onPointerUp]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawBoard(ctx, patternGrid, placedGrid, cellSize, gridDimensions, {
      showGhost: fusionMap ? false : showGhost,
      fusionMap,
      showGrid: !fusionMap || fusionMap.some((row) => row.some((f) => f < 0.95)),
      highlightColor,
    });
  }, [patternGrid, placedGrid, showGhost, fusionMap, cellSize, gridDimensions, highlightColor]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    board.addEventListener('touchmove', preventScroll, { passive: false });
    return () => board.removeEventListener('touchmove', preventScroll);
  }, [boardRef]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={boardRef}
        className="relative touch-none select-none rounded-lg overflow-hidden shadow-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
        style={{ width: boardWidth, height: boardHeight }}
        onPointerUp={handlePointerUp}
        onPointerLeave={(e) => onPointerUp(e.clientX, e.clientY)}
      >
        <canvas
          ref={canvasRef}
          width={boardWidth}
          height={boardHeight}
          className="block"
          style={{ visibility: hidden ? 'hidden' : 'visible' }}
        />
        <div
          ref={hoverOverlayRef}
          className="absolute pointer-events-none ring-2 ring-blue-500 ring-inset z-10"
          style={{ display: 'none' }}
        />
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        网格 {gridDimensions.N} × {gridDimensions.M} · 每格 {cellSize}px
      </p>
    </div>
  );
};

export function getBoardGridCell(
  clientX: number,
  clientY: number,
  boardElement: HTMLDivElement,
  gridDimensions: GridDimensions
): GridCell | null {
  const rect = boardElement.getBoundingClientRect();
  const cellSize = getOptimalCellSize(gridDimensions);
  return pointerToGridCell(clientX, clientY, rect, cellSize, gridDimensions);
}

export function updateHoverOverlay(
  overlay: HTMLDivElement | null,
  cell: GridCell | null,
  cellSize: number
) {
  if (!overlay) return;
  if (!cell) {
    overlay.style.display = 'none';
    return;
  }
  overlay.style.display = 'block';
  overlay.style.left = `${cell.col * cellSize}px`;
  overlay.style.top = `${cell.row * cellSize}px`;
  overlay.style.width = `${cellSize}px`;
  overlay.style.height = `${cellSize}px`;
}

export default React.memo(SnapGridBoard);
