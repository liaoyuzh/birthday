'use client';

import React, { useMemo, useCallback } from 'react';
import { getColorKeyByHex, ColorSystem } from '../utils/colorSystemUtils';
import { BeadInventory } from '../utils/organizeModeUtils';
import { sortColorsByHue } from '../utils/colorSystemUtils';

export interface DragSource {
  type: 'inventory' | 'grid';
  color: string;
  fromRow?: number;
  fromCol?: number;
}

interface BeadInventoryPanelProps {
  inventory: BeadInventory;
  colorSystem: ColorSystem;
  activeDragColor: string | null;
  selectedColor: string | null;
  disabled?: boolean;
  onStartDrag: (source: DragSource, pointerId: number, clientX: number, clientY: number) => void;
  onToggleSelectColor: (hex: string) => void;
}

const MAX_PREVIEW_DOTS = 8;

const BeadInventoryPanel: React.FC<BeadInventoryPanelProps> = ({
  inventory,
  colorSystem,
  activeDragColor,
  selectedColor,
  disabled = false,
  onStartDrag,
  onToggleSelectColor,
}) => {
  const sortedEntries = useMemo(
    () =>
      sortColorsByHue(
        Object.entries(inventory)
          .filter(([, count]) => count > 0)
          .map(([hex]) => ({ color: hex }))
      ).map(({ color: hex }) => [hex, inventory[hex]] as const),
    [inventory]
  );

  const totalRemaining = useMemo(
    () => sortedEntries.reduce((sum, [, count]) => sum + count, 0),
    [sortedEntries]
  );

  const handleBeadPointerDown = useCallback(
    (e: React.PointerEvent, hex: string) => {
      e.preventDefault();
      e.stopPropagation();
      onStartDrag({ type: 'inventory', color: hex }, e.pointerId, e.clientX, e.clientY);
    },
    [onStartDrag]
  );

  const handleFrameClick = useCallback(
    (e: React.MouseEvent, hex: string) => {
      e.preventDefault();
      onToggleSelectColor(hex);
    },
    [onToggleSelectColor]
  );

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">拼豆实体池</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          共 {totalRemaining} 粒实体 · 点色框进入投放，拖圆豆手动摆放
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            所有拼豆已放置完成
          </p>
        ) : (
          sortedEntries.map(([hex, count]) => {
            const displayKey = getColorKeyByHex(hex, colorSystem);
            const isDragging = activeDragColor === hex;
            const isSelected = selectedColor === hex;
            const previewCount = Math.min(count, MAX_PREVIEW_DOTS);

            return (
              <div
                key={hex}
                role="button"
                tabIndex={0}
                onClick={(e) => handleFrameClick(e, hex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSelectColor(hex);
                  }
                }}
                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/25 ring-2 ring-orange-400/70 shadow-sm'
                    : isDragging
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                }`}
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? `退出 ${displayKey} 投放模式`
                    : `选择 ${displayKey} 进入投放模式`
                }
              >
                <button
                  type="button"
                  className="relative shrink-0 touch-none cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handleBeadPointerDown(e, hex)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`拖拽 ${displayKey} 拼豆`}
                >
                  <span
                    className={`block w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-md ring-1 ring-black/10 ${
                      isSelected ? 'ring-2 ring-orange-400' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate flex items-center gap-1.5">
                    {displayKey}
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                        投放中
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isSelected
                      ? '按住拖动连续放置 · 点已有收回 · 再点色框退出'
                      : `剩余 ${count} 粒`}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 max-w-[72px] justify-end pointer-events-none">
                  {Array.from({ length: previewCount }).map((_, i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full border border-white/80 shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  {count > previewCount && (
                    <span className="text-[10px] text-gray-400 self-center">
                      +{count - previewCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(BeadInventoryPanel);
