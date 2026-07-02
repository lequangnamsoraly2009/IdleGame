import { Container, Graphics } from 'pixi.js';

export class LootParticle extends Container {
  private vx: number;
  private vy: number;
  private startY: number;
  private gravity: number = 0.35;
  private state: 'scatter' | 'fly' = 'scatter';
  private timer: number = 0;
  private bounceCount: number = 0;
  private targetX: number = 40; // top-left corner
  private targetY: number = 10;
  private speed: number = 4;
  private graphic: Graphics;

  constructor(startX: number, startY: number, isCoin: boolean, color: number = 0xfacc15, targetX?: number, targetY?: number) {
    super();
    this.x = startX;
    this.y = startY;
    this.startY = startY;
    if (targetX !== undefined) this.targetX = targetX;
    if (targetY !== undefined) this.targetY = targetY;

    // Scatter velocity
    this.vx = (Math.random() - 0.5) * 7;
    this.vy = -Math.random() * 6 - 4; // jump up

    this.graphic = new Graphics();
    if (isCoin) {
      // Draw yellow-gold coin
      this.graphic.circle(0, 0, 5);
      this.graphic.fill({ color: 0xfacc15 });
      this.graphic.stroke({ width: 1.5, color: 0xd97706 });
    } else {
      // Draw glowing item bag/orb matching rarity color
      this.graphic.circle(0, 0, 7);
      this.graphic.fill({ color });
      this.graphic.stroke({ width: 2, color: 0xffffff });
      
      // Draw a small outline glow
      this.graphic.circle(0, 0, 10);
      this.graphic.stroke({ width: 1, color, alpha: 0.5 });
    }
    this.addChild(this.graphic);
  }

  // Returns true when it hits target and should be destroyed
  public update(dt: number): boolean {
    this.timer += dt;

    if (this.state === 'scatter') {
      // Apply gravity
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Check collision with the "floor" (bounce)
      const floor = this.startY + 25; // drop a bit below the death y
      if (this.y >= floor) {
        this.y = floor;
        if (this.bounceCount < 1) {
          this.vy = -this.vy * 0.45;
          this.vx = this.vx * 0.5;
          this.bounceCount++;
        } else {
          this.vx = 0;
          this.vy = 0;
          // Go to fly state after a small delay
          if (this.timer > 20) { // roughly 0.33 seconds
            this.state = 'fly';
          }
        }
      }
    } else if (this.state === 'fly') {
      // Fly towards target (top-left gold hud)
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        return true; // Finished!
      }

      this.speed = Math.min(24, this.speed + 0.9 * dt); // accelerate
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
      
      // Scale down slightly as it approaches the HUD
      if (dist < 80) {
        this.scale.set(dist / 80);
      }
    }

    return false;
  }
}
