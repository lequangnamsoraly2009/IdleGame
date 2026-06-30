import { Container } from 'pixi.js';

export interface VisualEffect extends Container {
  update(dt: number): void;
  isFinished(): boolean;
}
