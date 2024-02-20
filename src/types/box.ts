import { SKRSContext2D } from '@napi-rs/canvas';

export type Fill = string | CanvasGradient | CanvasPattern;

export interface CompleteSpacing {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type DeferredGradient = (
  ctx: SKRSContext2D,
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
