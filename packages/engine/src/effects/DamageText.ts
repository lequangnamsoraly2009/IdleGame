import { Text, TextStyle } from 'pixi.js';

export class DamageText extends Text {
  private velocityY: number;
  private velocityX: number;
  private life: number = 1.0; // 100% life to 0%
  private decayRate: number;

  constructor(text: string, x: number, y: number, isCrit: boolean = false) {
    const style = new TextStyle({
      fontFamily: 'Outfit, Inter, Arial, sans-serif',
      fontSize: isCrit ? 26 : 18,
      fontWeight: 'bold',
      fill: isCrit ? 0xf59e0b : 0xffffff, // gold vs white
      stroke: { color: 0x000000, width: isCrit ? 4 : 3 },
      dropShadow: {
        color: 0x000000,
        alpha: 0.5,
        angle: Math.PI / 6,
        distance: 2
      }
    });

    super({ text, style });

    this.x = x;
    this.y = y - 20;
    this.anchor.set(0.5);

    // Initial velocity: pop upwards and drift slightly sideways
    this.velocityY = isCrit ? -5.5 : -3.5;
    this.velocityX = (Math.random() - 0.5) * 2;
    this.decayRate = isCrit ? 0.025 : 0.035; // Crit stays slightly longer
    
    // Scale spring up animation
    this.scale.set(0.2);
  }

  public update(dt: number) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Apply gravity to velocity
    this.velocityY += 0.15 * dt;

    // Life decay
    this.life -= this.decayRate * dt;
    this.alpha = Math.max(0, this.life);

    // Initial spring up scale
    if (this.scale.x < 1.0 && this.life > 0.5) {
      this.scale.set(Math.min(1.0, this.scale.x + 0.15 * dt));
    }
  }

  public isDead(): boolean {
    return this.life <= 0;
  }
}
