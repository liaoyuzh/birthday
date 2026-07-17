'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MappedPixel } from '../../utils/pixelation';
import { getColorKeyByHex, ColorSystem } from '../../utils/colorSystemUtils';
import BeadInventoryPanel, { DragSource } from '../../components/BeadInventoryPanel';
import SnapGridBoard, {
  getBoardGridCell,
  updateHoverOverlay,
} from '../../components/SnapGridBoard';
import IroningOverlay from '../../components/IroningOverlay';
import {
  ORGANIZE_STORAGE_KEYS,
  BeadInventory,
  buildInventoryFromColorCounts,
  createEmptyPlacedGrid,
  getTotalInventoryCount,
  getPlacedCount,
  isPatternCell,
} from '../../utils/organizeModeUtils';
import { GridCell, getOptimalCellSize } from '../../utils/gridSnapUtils';

interface DragState {
  source: DragSource;
  pointerId: number;
}

interface PaintStrokeState {
  pointerId: number;
  mode: 'place' | 'erase';
  lastRow: number;
  lastCol: number;
}

interface BoardState {
  inventory: BeadInventory;
  placedGrid: (string | null)[][];
}

/** Bresenham line so fast pointer moves still visit every crossed cell. */
function cellsAlongLine(r0: number, c0: number, r1: number, c1: number): GridCell[] {
  const cells: GridCell[] = [];
  let row = r0;
  let col = c0;
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dr - dc;

  while (true) {
    cells.push({ row, col });
    if (row === r1 && col === c1) break;
    const e2 = 2 * err;
    if (e2 > -dc) {
      err -= dc;
      row += sr;
    }
    if (e2 < dr) {
      err += dr;
      col += sc;
    }
  }
  return cells;
}

function applyStrokeCell(
  board: BoardState,
  cell: GridCell,
  mode: 'place' | 'erase',
  placeColor: string | null
): BoardState {
  if (mode === 'place') {
    if (!placeColor) return board;
    if ((board.inventory[placeColor] ?? 0) <= 0) return board;
    if (board.placedGrid[cell.row]?.[cell.col]) return board;
    return applyDrop(board, { type: 'inventory', color: placeColor }, cell);
  }

  const existing = board.placedGrid[cell.row]?.[cell.col];
  if (!existing) return board;
  return applyDrop(
    board,
    {
      type: 'grid',
      color: existing,
      fromRow: cell.row,
      fromCol: cell.col,
    },
    null
  );
}

function applyDrop(
  board: BoardState,
  source: DragSource,
  targetCell: GridCell | null
): BoardState {
  const color = source.color.toUpperCase();
  const nextPlaced = board.placedGrid.map((row) => [...row]);
  const nextInv = { ...board.inventory };

  if (source.type === 'grid' && source.fromRow !== undefined && source.fromCol !== undefined) {
    nextPlaced[source.fromRow][source.fromCol] = null;
  }

  if (!targetCell) {
    if (source.type === 'grid') {
      nextInv[color] = (nextInv[color] ?? 0) + 1;
    }
    return { inventory: nextInv, placedGrid: nextPlaced };
  }

  const { row, col } = targetCell;
  const existing = nextPlaced[row][col];

  if (source.type === 'grid' && source.fromRow === row && source.fromCol === col) {
    nextPlaced[row][col] = color;
    return { inventory: nextInv, placedGrid: nextPlaced };
  }

  if (!existing) {
    nextPlaced[row][col] = color;
    if (source.type === 'inventory') {
      nextInv[color] = Math.max(0, (nextInv[color] ?? 0) - 1);
    }
    return { inventory: nextInv, placedGrid: nextPlaced };
  }

  if (source.type === 'grid' && source.fromRow !== undefined && source.fromCol !== undefined) {
    nextPlaced[source.fromRow][source.fromCol] = existing;
    nextPlaced[row][col] = color;
  }

  return { inventory: nextInv, placedGrid: nextPlaced };
}

export default function OrganizeModePage() {
  const [patternGrid, setPatternGrid] = useState<MappedPixel[][] | null>(null);
  const [gridDimensions, setGridDimensions] = useState<{ N: number; M: number } | null>(null);
  const [colorSystem, setColorSystem] = useState<ColorSystem>('MARD');
  const [boardState, setBoardState] = useState<BoardState>({ inventory: {}, placedGrid: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [selectedPlaceColor, setSelectedPlaceColor] = useState<string | null>(null);
  const [showGhost, setShowGhost] = useState(true);
  const [totalBeads, setTotalBeads] = useState(0);
  const [isIroning, setIsIroning] = useState(false);
  const [fusionMap, setFusionMap] = useState<number[][] | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const hoverOverlayRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const paintStrokeRef = useRef<PaintStrokeState | null>(null);
  const lastHoverRef = useRef<GridCell | null>(null);
  const boardStateRef = useRef(boardState);
  const gridDimensionsRef = useRef(gridDimensions);
  const colorSystemRef = useRef(colorSystem);
  const fusionMapRef = useRef(fusionMap);
  const isIroningRef = useRef(isIroning);
  const selectedPlaceColorRef = useRef(selectedPlaceColor);

  boardStateRef.current = boardState;
  gridDimensionsRef.current = gridDimensions;
  colorSystemRef.current = colorSystem;
  fusionMapRef.current = fusionMap;
  isIroningRef.current = isIroning;
  selectedPlaceColorRef.current = selectedPlaceColor;

  useEffect(() => {
    const savedPixelData = localStorage.getItem(ORGANIZE_STORAGE_KEYS.pixelData);
    const savedGridDimensions = localStorage.getItem(ORGANIZE_STORAGE_KEYS.gridDimensions);
    const savedColorCounts = localStorage.getItem(ORGANIZE_STORAGE_KEYS.colorCounts);
    const savedColorSystem = localStorage.getItem(ORGANIZE_STORAGE_KEYS.colorSystem);

    if (!savedPixelData || !savedGridDimensions || !savedColorCounts) {
      window.location.href = '/index.html';
      return;
    }

    try {
      const pixelData = JSON.parse(savedPixelData) as MappedPixel[][];
      const dimensions = JSON.parse(savedGridDimensions) as { N: number; M: number };
      const parsedColorCounts = JSON.parse(savedColorCounts) as Record<
        string,
        { count: number; color: string }
      >;

      const beadInventory = buildInventoryFromColorCounts(parsedColorCounts);

      setPatternGrid(pixelData);
      setGridDimensions(dimensions);
      setBoardState({
        inventory: beadInventory,
        placedGrid: createEmptyPlacedGrid(dimensions.M, dimensions.N),
      });
      setColorSystem((savedColorSystem as ColorSystem) || 'MARD');
      setTotalBeads(getTotalInventoryCount(beadInventory));
    } catch {
      window.location.href = '/index.html';
    }
  }, []);

  const hideDragUi = useCallback(() => {
    const ghost = ghostRef.current;
    if (ghost) ghost.style.display = 'none';
    updateHoverOverlay(hoverOverlayRef.current, null, 0);
    lastHoverRef.current = null;
  }, []);

  const finalizeDrop = useCallback(
    (clientX: number, clientY: number) => {
      const dragState = dragStateRef.current;
      const dimensions = gridDimensionsRef.current;
      const board = boardRef.current;

      if (!dragState || !dimensions || !board) {
        dragStateRef.current = null;
        setIsDragging(false);
        hideDragUi();
        return;
      }

      const targetCell = getBoardGridCell(clientX, clientY, board, dimensions);
      setBoardState((prev) => applyDrop(prev, dragState.source, targetCell));
      dragStateRef.current = null;
      setIsDragging(false);
      hideDragUi();
    },
    [hideDragUi]
  );

  const handleToggleSelectColor = useCallback((hex: string) => {
    if (fusionMapRef.current || isIroningRef.current) return;
    const normalized = hex.toUpperCase();
    setSelectedPlaceColor((prev) => (prev === normalized ? null : normalized));
  }, []);

  const endPaintStroke = useCallback(() => {
    paintStrokeRef.current = null;
    setIsPainting(false);
  }, []);

  /** Apply place/erase to cells, syncing boardStateRef so multi-cell strokes stay correct. */
  const applyPaintCells = useCallback(
    (cells: GridCell[], mode: 'place' | 'erase') => {
      if (cells.length === 0) return;

      let next = boardStateRef.current;
      const placeColor = selectedPlaceColorRef.current;
      let changed = false;

      for (const cell of cells) {
        const updated = applyStrokeCell(next, cell, mode, placeColor);
        if (updated !== next) {
          next = updated;
          changed = true;
        }
        if (
          mode === 'place' &&
          placeColor &&
          (next.inventory[placeColor] ?? 0) <= 0
        ) {
          setSelectedPlaceColor(null);
          endPaintStroke();
          break;
        }
      }

      if (!changed) return;
      boardStateRef.current = next;
      setBoardState(next);
    },
    [endPaintStroke]
  );

  const startPaintStroke = useCallback(
    (cell: GridCell, pointerId: number, mode: 'place' | 'erase') => {
      paintStrokeRef.current = {
        pointerId,
        mode,
        lastRow: cell.row,
        lastCol: cell.col,
      };
      setIsPainting(true);
      applyPaintCells([cell], mode);
    },
    [applyPaintCells]
  );

  useEffect(() => {
    if (!isPainting) return;

    const onMove = (e: PointerEvent) => {
      const stroke = paintStrokeRef.current;
      const board = boardRef.current;
      const dimensions = gridDimensionsRef.current;
      if (!stroke || e.pointerId !== stroke.pointerId || !board || !dimensions) return;
      if ((e.buttons & 1) === 0) {
        endPaintStroke();
        return;
      }

      const cell = getBoardGridCell(e.clientX, e.clientY, board, dimensions);
      if (!cell) return;
      if (cell.row === stroke.lastRow && cell.col === stroke.lastCol) return;

      const path = cellsAlongLine(stroke.lastRow, stroke.lastCol, cell.row, cell.col);
      // Skip the origin cell — already painted on pointerdown / previous move.
      const newCells = path.slice(1);
      stroke.lastRow = cell.row;
      stroke.lastCol = cell.col;
      if (newCells.length > 0) applyPaintCells(newCells, stroke.mode);
    };

    const onUp = (e: PointerEvent) => {
      const stroke = paintStrokeRef.current;
      if (!stroke || e.pointerId !== stroke.pointerId) return;
      endPaintStroke();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isPainting, applyPaintCells, endPaintStroke]);

  const handleStartDrag = useCallback(
    (source: DragSource, pointerId: number, clientX: number, clientY: number) => {
      if (fusionMapRef.current || isIroningRef.current) return;
      if (source.type === 'inventory') {
        const count = boardStateRef.current.inventory[source.color.toUpperCase()] ?? 0;
        if (count <= 0) return;
      }

      const dimensions = gridDimensionsRef.current;
      if (!dimensions) return;

      const cellSize = getOptimalCellSize(dimensions);
      const ghost = ghostRef.current;
      const color = source.color;

      dragStateRef.current = { source, pointerId };
      setIsDragging(true);

      if (ghost) {
        const size = cellSize * 0.8;
        ghost.style.display = 'block';
        ghost.style.width = `${size}px`;
        ghost.style.height = `${size}px`;
        ghost.style.transform = `translate(${clientX - size * 0.5}px, ${clientY - size * 0.5}px)`;
        const bead = ghost.querySelector('[data-bead]') as HTMLElement | null;
        const label = ghost.querySelector('[data-label]') as HTMLElement | null;
        if (bead) bead.style.backgroundColor = color;
        if (label) label.textContent = getColorKeyByHex(color, colorSystemRef.current);
      }

      const board = boardRef.current;
      if (board) {
        const cell = getBoardGridCell(clientX, clientY, board, dimensions);
        lastHoverRef.current = cell;
        updateHoverOverlay(hoverOverlayRef.current, cell, cellSize);
      }
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      const dimensions = gridDimensionsRef.current;
      if (!dragState || e.pointerId !== dragState.pointerId || !dimensions) return;

      const ghost = ghostRef.current;
      if (ghost) {
        const size = parseFloat(ghost.style.width) || getOptimalCellSize(dimensions) * 0.8;
        ghost.style.transform = `translate(${e.clientX - size * 0.5}px, ${e.clientY - size * 0.5}px)`;
      }

      const board = boardRef.current;
      if (!board) return;

      const cellSize = getOptimalCellSize(dimensions);
      const cell = getBoardGridCell(e.clientX, e.clientY, board, dimensions);
      const last = lastHoverRef.current;
      if (cell?.row !== last?.row || cell?.col !== last?.col) {
        lastHoverRef.current = cell;
        updateHoverOverlay(hoverOverlayRef.current, cell, cellSize);
      }
    };

    const onUp = (e: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      finalizeDrop(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, finalizeDrop]);

  const handleReset = () => {
    if (!gridDimensions) return;
    const savedColorCounts = localStorage.getItem(ORGANIZE_STORAGE_KEYS.colorCounts);
    if (!savedColorCounts) return;
    const parsed = JSON.parse(savedColorCounts);
    setFusionMap(null);
    setIsIroning(false);
    setSelectedPlaceColor(null);
    setBoardState({
      inventory: buildInventoryFromColorCounts(parsed),
      placedGrid: createEmptyPlacedGrid(gridDimensions.M, gridDimensions.N),
    });
  };

  const handleIronComplete = useCallback((map: number[][]) => {
    setFusionMap(map);
    setIsIroning(false);
  }, []);

  const handleIron = () => {
    if (getPlacedCount(boardStateRef.current.placedGrid) === 0 || isIroning) return;
    setSelectedPlaceColor(null);
    setFusionMap(null);
    setIsIroning(true);
  };

  const handleAutoFill = () => {
    if (!patternGrid || !gridDimensions) return;

    const newPlaced = boardState.placedGrid.map(row => [...row]);
    const newInventory: BeadInventory = { ...boardState.inventory };

    const targetColor = selectedPlaceColor;

    for (let row = 0; row < gridDimensions.M; row++) {
      for (let col = 0; col < gridDimensions.N; col++) {
        const pixel = patternGrid[row]?.[col];
        if (!isPatternCell(pixel)) continue;
        const hex = pixel!.color.toUpperCase();

        if (targetColor && hex !== targetColor) continue;

        if ((newInventory[hex] ?? 0) > 0) {
          newPlaced[row][col] = hex;
          newInventory[hex]--;
        }
      }
    }

    setFusionMap(null);
    setSelectedPlaceColor(null);
    setBoardState({ inventory: newInventory, placedGrid: newPlaced });
  };

  // Exit selection mode when the selected color is exhausted or removed from inventory.
  useEffect(() => {
    if (!selectedPlaceColor) return;
    const remaining = boardState.inventory[selectedPlaceColor] ?? 0;
    if (remaining <= 0) setSelectedPlaceColor(null);
  }, [selectedPlaceColor, boardState.inventory]);

  if (!patternGrid || !gridDimensions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const { inventory, placedGrid } = boardState;
  const placedCount = getPlacedCount(placedGrid);
  const remainingCount = getTotalInventoryCount(inventory);
  const progress = totalBeads > 0 ? Math.round((placedCount / totalBeads) * 100) : 0;
  const dragColor = isDragging ? dragStateRef.current?.source.color ?? null : null;
  const cellSize = getOptimalCellSize(gridDimensions);
  const boardWidth = gridDimensions.N * cellSize;
  const boardHeight = gridDimensions.M * cellSize;
  const isIroned = fusionMap !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">拼豆实体整理</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              已放置 {placedCount} / {totalBeads} 粒 ({progress}%)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showGhost}
                onChange={(e) => setShowGhost(e.target.checked)}
                className="rounded"
              />
              显示图纸参考
            </label>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              一键填充所选
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/index.html'; }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              返回主页
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <BeadInventoryPanel
          inventory={inventory}
          colorSystem={colorSystem}
          activeDragColor={dragColor}
          selectedColor={selectedPlaceColor}
          disabled={isIroning || isIroned}
          onStartDrag={handleStartDrag}
          onToggleSelectColor={handleToggleSelectColor}
        />

        <div className="flex flex-col items-center justify-start bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm overflow-auto">
          <div
            className={`relative ${selectedPlaceColor ? 'cursor-crosshair' : ''}`}
            onPointerDownCapture={(e) => {
              if (
                !boardRef.current ||
                !gridDimensions ||
                dragStateRef.current ||
                paintStrokeRef.current ||
                isIroning ||
                isIroned
              ) {
                return;
              }
              const cell = getBoardGridCell(
                e.clientX,
                e.clientY,
                boardRef.current,
                gridDimensions
              );
              if (!cell) return;

              const placed = placedGrid[cell.row]?.[cell.col];

              // Selection mode: press to paint/erase; hold & drag to continue across cells.
              if (selectedPlaceColor && e.button === 0) {
                e.preventDefault();
                startPaintStroke(cell, e.pointerId, placed ? 'erase' : 'place');
                return;
              }

              if (placed) {
                e.preventDefault();
                handleStartDrag(
                  {
                    type: 'grid',
                    color: placed,
                    fromRow: cell.row,
                    fromCol: cell.col,
                  },
                  e.pointerId,
                  e.clientX,
                  e.clientY
                );
              }
            }}
          >
            <SnapGridBoard
              boardRef={boardRef}
              hoverOverlayRef={hoverOverlayRef}
              patternGrid={patternGrid}
              gridDimensions={gridDimensions}
              placedGrid={placedGrid}
              showGhost={showGhost}
              fusionMap={fusionMap}
              hidden={isIroning}
              highlightColor={selectedPlaceColor}
              onPointerUp={(x, y) => {
                if (dragStateRef.current) finalizeDrop(x, y);
              }}
            />
            {isIroning && (
              <IroningOverlay
                patternGrid={patternGrid}
                placedGrid={placedGrid}
                gridDimensions={gridDimensions}
                cellSize={cellSize}
                boardWidth={boardWidth}
                boardHeight={boardHeight}
                onComplete={handleIronComplete}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleIron}
            disabled={placedCount === 0 || isIroning}
            className={`mt-4 px-5 py-2.5 text-sm rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
              placedCount === 0 || isIroning
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : isIroned
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg hover:translate-y-[-1px]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 14h12.5c1.1 0 2 .9 2 2v1.5c0 .8-.7 1.5-1.5 1.5H4V14zm2-2h9.8c.6 0 1.1.5 1.1 1.1v.9H6v-2zm14-1.5L20 8l-2.5 6.5H22V10.5z" />
            </svg>
            {isIroning ? 'Ironing...' : isIroned ? 'Iron Again' : 'Iron 熨烫'}
          </button>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
            {isIroning
              ? 'Place ironing paper, glide the iron across, and fuse the beads together...'
              : isIroned
                ? 'Beads fused! Reset to rearrange, or iron again.'
                : 'Place beads on the board, then press Iron to fuse them like a real Perler project.'}
          </p>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
            点击左侧色框进入投放模式：按住左键拖过可连续放置；从已有拼豆按下并拖动可连续收回。再点同一色框退出。选中颜色后点「一键填充所选」可自动放置该色。
            池中还剩 {remainingCount} 粒。
            {selectedPlaceColor && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
                投放中：{getColorKeyByHex(selectedPlaceColor, colorSystem)} — 按住拖动连续放置 / 收回
              </span>
            )}
          </p>
        </div>
      </main>

      <div
        ref={ghostRef}
        className="fixed top-0 left-0 pointer-events-none z-50 will-change-transform"
        style={{ display: 'none' }}
      >
        <div
          data-bead
          className="w-full h-full rounded-full border-2 border-white shadow-xl ring-2 ring-blue-400/60"
        />
        <span
          data-label
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap bg-gray-900/80 text-white px-1.5 py-0.5 rounded"
        />
      </div>
    </div>
  );
}
