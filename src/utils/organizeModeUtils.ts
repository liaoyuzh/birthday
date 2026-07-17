import { MappedPixel } from './pixelation';

export const ORGANIZE_STORAGE_KEYS = {
  pixelData: 'organizeMode_pixelData',
  gridDimensions: 'organizeMode_gridDimensions',
  colorCounts: 'organizeMode_colorCounts',
  colorSystem: 'organizeMode_selectedColorSystem',
} as const;

export type BeadInventory = Record<string, number>;

export function buildInventoryFromColorCounts(
  colorCounts: Record<string, { count: number; color: string }>
): BeadInventory {
  const inventory: BeadInventory = {};
  Object.values(colorCounts).forEach(({ color, count }) => {
    inventory[color.toUpperCase()] = count;
  });
  return inventory;
}

export function createEmptyPlacedGrid(
  rows: number,
  cols: number
): (string | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

export function getTotalInventoryCount(inventory: BeadInventory): number {
  return Object.values(inventory).reduce((sum, count) => sum + count, 0);
}

export function getPlacedCount(placedGrid: (string | null)[][]): number {
  return placedGrid.flat().filter(Boolean).length;
}

export function isPatternCell(pixel: MappedPixel | undefined): boolean {
  return Boolean(pixel && !pixel.isExternal && pixel.key !== 'ERASE');
}
