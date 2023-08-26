/* eslint-disable no-unused-vars */
import { CanvasRenderingContext2D, CanvasGradient, CanvasPattern, CanvasTexture } from '@julusian/skia-canvas';

export type Fill = string | CanvasGradient | CanvasPattern | CanvasTexture;

export interface CompleteSpacing {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type DeferredGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) => CanvasGradient;

export interface BoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextProps {
  header?: string;
  text: string;
  font: string;
  textY?: number[];
}
