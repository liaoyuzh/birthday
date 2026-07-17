'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { MappedPixel } from '../utils/pixelation';
import { GridDimensions } from '../utils/gridSnapUtils';
import {
  drawBoard,
  createFusionMap,
  createFullFusionMap,
  drawIronEffects,
  updateSteamParticles,
  easeInOutCubic,
  type SteamParticle,
} from '../utils/boardDrawUtils';

interface IroningOverlayProps {
  patternGrid: MappedPixel[][];
  placedGrid: (string | null)[][];
  gridDimensions: GridDimensions;
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  onComplete: (fusionMap: number[][]) => void;
}

const PAPER_IN = 500;
const IRON_SWEEP = 3600;
const PAPER_OUT = 700;
const TOTAL = PAPER_IN + IRON_SWEEP + PAPER_OUT;

const IroningOverlay: React.FC<IroningOverlayProps> = ({
  patternGrid,
  placedGrid,
  gridDimensions,
  cellSize,
  boardWidth,
  boardHeight,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SteamParticle[]>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const completedRef = useRef(false);

  const animate = useCallback(
    (now: number) => {
      if (completedRef.current) return;
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { M, N } = gridDimensions;
      const ironW = Math.max(52, cellSize * 3.5);
      const ironH = Math.max(30, cellSize * 1.7);
      const ironY = boardHeight * 0.4;

      let paperOpacity = 0;
      let ironX = -ironW;
      let fusionMap: number[][] | null = null;
      let showIron = false;

      if (elapsed < PAPER_IN) {
        paperOpacity = easeInOutCubic(elapsed / PAPER_IN);
        fusionMap = createFullFusionMap(M, N, placedGrid).map((row) => row.map(() => 0));
      } else if (elapsed < PAPER_IN + IRON_SWEEP) {
        const sweepT = (elapsed - PAPER_IN) / IRON_SWEEP;
        const eased = easeInOutCubic(sweepT);
        paperOpacity = 1;
        ironX = -ironW * 0.5 + eased * (boardWidth + ironW * 1.5);
        fusionMap = createFusionMap(M, N, ironX, cellSize, ironW, placedGrid);
        showIron = true;
        particlesRef.current = updateSteamParticles(
          particlesRef.current,
          ironX,
          ironY,
          ironW,
          ironH,
          16
        );
      } else if (elapsed < TOTAL) {
        const outT = (elapsed - PAPER_IN - IRON_SWEEP) / PAPER_OUT;
        paperOpacity = 1 - easeInOutCubic(outT);
        fusionMap = createFullFusionMap(M, N, placedGrid);
        ironX = boardWidth + ironW;
        particlesRef.current = particlesRef.current
          .map((p) => ({ ...p, life: p.life - 18 }))
          .filter((p) => p.life > 0);
      } else {
        completedRef.current = true;
        onComplete(createFullFusionMap(M, N, placedGrid));
        return;
      }

      drawBoard(ctx, patternGrid, placedGrid, cellSize, gridDimensions, {
        showGhost: false,
        fusionMap,
        showGrid: !fusionMap || fusionMap.some((row) => row.some((f) => f > 0 && f < 0.96)),
        paperOpacity,
      });

      if (showIron || particlesRef.current.length > 0) {
        drawIronEffects(
          ctx,
          boardWidth,
          boardHeight,
          ironX,
          ironY,
          ironW,
          ironH,
          elapsed,
          particlesRef.current
        );
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [
      patternGrid,
      placedGrid,
      gridDimensions,
      cellSize,
      boardWidth,
      boardHeight,
      onComplete,
    ]
  );

  useEffect(() => {
    completedRef.current = false;
    startRef.current = 0;
    particlesRef.current = [];
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={boardWidth}
      height={boardHeight}
      className="absolute inset-0 z-20 block pointer-events-none rounded-lg"
    />
  );
};

export default IroningOverlay;
