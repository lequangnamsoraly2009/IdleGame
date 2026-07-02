import { Text, TextStyle } from 'pixi.js';

export class SystemAnnouncement extends Text {
  private startY: number;
  private targetY: number;
  private currentY: number;
  private speedY: number;

  constructor(text: string, width: number, height: number) {
    const style = new TextStyle({
      fontFamily: 'Outfit, Inter, Arial, sans-serif',
      fontSize: 20,
      fontWeight: '900', // extra bold
      fill: 0xfbbf24, // vibrant golden amber color
      stroke: { color: 0x000000, width: 4 },
      dropShadow: {
        color: 0x000000,
        alpha: 0.6,
        angle: Math.PI / 6,
        distance: 3
      },
      align: 'center'
    });

    super({ text, style });

    // Center horizontally
    this.x = width / 2;
    this.anchor.set(0.5);

    // Drifts from top down to 1/2 of screen height
    this.startY = 35;
    this.targetY = height / 2;
    this.currentY = this.startY;
    this.y = this.startY;

    // Movement speed
    this.speedY = 2.2; 
  }

  public update(dt: number) {
    this.currentY += this.speedY * dt;
    this.y = this.currentY;

    // Calculate fade distance
    // Start fading after traveling half-way (e.g. past 180px)
    const fadeStart = this.startY + (this.targetY - this.startY) * 0.4; 
    if (this.currentY > fadeStart) {
      const progress = (this.currentY - fadeStart) / (this.targetY - fadeStart);
      this.alpha = Math.max(0, 1 - progress);
    } else {
      this.alpha = 1.0;
    }
  }

  public isDead(): boolean {
    return this.currentY >= this.targetY || this.alpha <= 0;
  }
}
