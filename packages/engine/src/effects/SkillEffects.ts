import { Container, Graphics } from 'pixi.js';
import { VisualEffect } from './VisualEffect';

// 1. AETHER STRIKE EFFECT (Knight Ultimate)
export class AetherStrikeEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private life = 1.0;
  private duration = 0.35; // 0.35 seconds
  private targetX: number;
  private targetY: number;

  constructor(targetX: number, targetY: number) {
    super();
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
    this.drawSlash(0);
  }

  private drawSlash(progress: number) {
    this.graphic.clear();
    // Golden glow slash arc
    this.graphic.moveTo(-130 * (1 - progress), -25);
    this.graphic.quadraticCurveTo(
      0, 
      -90 + progress * 70, 
      130 * progress, 
      -25
    );
    this.graphic.stroke({ width: 9 * (1 - progress), color: 0xfacc15, alpha: 1 - progress });
    
    // Intense white inner core for slash
    this.graphic.moveTo(-110 * (1 - progress), -25);
    this.graphic.quadraticCurveTo(
      0, 
      -90 + progress * 70, 
      110 * progress, 
      -25
    );
    this.graphic.stroke({ width: 3.5 * (1 - progress), color: 0xffffff, alpha: 1 - progress });
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.life -= sec / this.duration;
    const progress = 1.0 - Math.max(0, this.life);
    this.drawSlash(progress);
    this.x = this.targetX;
    this.y = this.targetY;
  }

  public isFinished() {
    return this.life <= 0;
  }
}

// 2. METEOR STORM EFFECT (Mage Ultimate)
interface MeteorParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  exploded: boolean;
  explosionLife: number;
}

export class MeteorStormEffect extends Container implements VisualEffect {
  private meteors: MeteorParticle[] = [];
  private graphic: Graphics;
  private finished = false;

  constructor(targets: { x: number; y: number }[]) {
    super();
    this.graphic = new Graphics();
    this.addChild(this.graphic);

    targets.forEach((t, i) => {
      this.meteors.push({
        startX: t.x - 120 - Math.random() * 60,
        startY: -100 - i * 40 - Math.random() * 50, // staggered spawn height
        targetX: t.x,
        targetY: t.y,
        progress: 0,
        exploded: false,
        explosionLife: 0.28 // seconds
      });
    });
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();
    let allDone = true;

    this.meteors.forEach(m => {
      if (!m.exploded) {
        allDone = false;
        m.progress += sec * 2.2; // falling speed
        if (m.progress >= 1.0) {
          m.progress = 1.0;
          m.exploded = true;
        }

        const currentX = m.startX + (m.targetX - m.startX) * m.progress;
        const currentY = m.startY + (m.targetY - m.startY) * m.progress;

        // Draw long fiery trail
        this.graphic.moveTo(currentX, currentY);
        this.graphic.lineTo(currentX - 25, currentY - 30);
        this.graphic.stroke({ width: 7, color: 0xea580c, alpha: 0.5 * m.progress });

        // Draw meteor head
        this.graphic.circle(currentX, currentY, 8);
        this.graphic.fill({ color: 0xef4444 });
        this.graphic.circle(currentX, currentY, 4);
        this.graphic.fill({ color: 0xfacc15 });
      } else if (m.explosionLife > 0) {
        allDone = false;
        m.explosionLife -= sec;
        const expProgress = 1.0 - (m.explosionLife / 0.28);

        // Exploding expanding heatwave
        this.graphic.circle(m.targetX, m.targetY, 40 * expProgress);
        this.graphic.stroke({ width: 5 * (1 - expProgress), color: 0xf97316, alpha: 1 - expProgress });
        this.graphic.circle(m.targetX, m.targetY, 22 * expProgress);
        this.graphic.fill({ color: 0xef4444, alpha: 0.45 * (1 - expProgress) });
      }
    });

    this.finished = allDone;
  }

  public isFinished() {
    return this.finished;
  }
}

// 3. SHADOW SLASH EFFECT (Assassin Ultimate)
export class ShadowSlashEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private life = 0.35;
  private duration = 0.35;
  private targetX: number;
  private targetY: number;

  constructor(targetX: number, targetY: number) {
    super();
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.life -= sec;
    const progress = 1.0 - Math.max(0, this.life / this.duration);

    this.graphic.clear();
    this.x = this.targetX;
    this.y = this.targetY;

    // Draw three dark void cuts crossing each other at various angles and micro delays
    if (progress > 0.0) {
      const p1 = Math.min(1.0, progress * 2.0);
      this.graphic.moveTo(-45, -45);
      this.graphic.lineTo(-45 + 90 * p1, -45 + 90 * p1);
      this.graphic.stroke({ width: 5 * (1 - progress), color: 0x7c3aed, alpha: 1 - progress });
    }

    if (progress > 0.25) {
      const p2 = Math.min(1.0, (progress - 0.25) * 2.2);
      this.graphic.moveTo(-45, 45);
      this.graphic.lineTo(-45 + 90 * p2, 45 - 90 * p2);
      this.graphic.stroke({ width: 5 * (1 - progress), color: 0x6d28d9, alpha: 1 - progress });
    }

    if (progress > 0.5) {
      const p3 = Math.min(1.0, (progress - 0.5) * 2.5);
      this.graphic.moveTo(-60, 0);
      this.graphic.lineTo(-60 + 120 * p3, 0);
      this.graphic.stroke({ width: 7 * (1 - progress), color: 0x4c1d95, alpha: 1 - progress });
    }
  }

  public isFinished() {
    return this.life <= 0;
  }
}

// 4. FIREBALL EFFECT (Magma Slime / Monster Fire Skills)
export class FireballEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private exploded = false;
  private explosionLife = 0.22;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.exploded) {
      this.progress += sec * 2.4; // projectile speed
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.exploded = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress;

      // Draw fire ball
      this.graphic.circle(currentX, currentY, 6.5);
      this.graphic.fill({ color: 0xea580c });
      this.graphic.circle(currentX, currentY, 3.5);
      this.graphic.fill({ color: 0xf59e0b });
    } else if (this.explosionLife > 0) {
      this.explosionLife -= sec;
      const expProgress = 1.0 - (this.explosionLife / 0.22);

      // Flash explosion
      this.graphic.circle(this.targetX, this.targetY, 22 * expProgress);
      this.graphic.stroke({ width: 3.5 * (1 - expProgress), color: 0xef4444, alpha: 1 - expProgress });
      this.graphic.circle(this.targetX, this.targetY, 12 * expProgress);
      this.graphic.fill({ color: 0xfacc15, alpha: 0.65 * (1 - expProgress) });
    }
  }

  public isFinished() {
    return this.exploded && this.explosionLife <= 0;
  }
}

// 5. ICE CRYSTAL EFFECT (Frost Slime / Monster Ice Skills)
interface CrystalData {
  ox: number;
  oy: number;
  scale: number;
  angle: number;
  graphic: Graphics;
}

export class IceCrystalEffect extends Container implements VisualEffect {
  private life = 0.55;
  private duration = 0.55;
  private targetX: number;
  private targetY: number;
  private crystals: CrystalData[] = [];

  constructor(targetX: number, targetY: number) {
    super();
    this.targetX = targetX;
    this.targetY = targetY;

    for (let i = 0; i < 4; i++) {
      const rad = (i * Math.PI) / 2;
      const g = new Graphics();
      const scale = 0.65 + Math.random() * 0.35;
      
      // Draw shiny ice diamond once at origin
      g.moveTo(0, -9 * scale);
      g.lineTo(4.5 * scale, 0);
      g.lineTo(0, 9 * scale);
      g.lineTo(-4.5 * scale, 0);
      g.closePath();
      g.fill({ color: 0x67e8f9 });
      g.stroke({ width: 1.5, color: 0x38bdf8 });

      this.addChild(g);

      this.crystals.push({
        ox: Math.cos(rad) * 32,
        oy: Math.sin(rad) * 32,
        scale,
        angle: Math.random() * Math.PI,
        graphic: g
      });
    }
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.life -= sec;
    const progress = 1.0 - Math.max(0, this.life / this.duration);

    this.x = this.targetX;
    this.y = this.targetY;

    this.crystals.forEach(c => {
      const currentOx = c.ox * (1.0 + progress * 0.4);
      const currentOy = c.oy * (1.0 + progress * 0.4);
      const currentAngle = c.angle + progress * 1.8;

      c.graphic.x = currentOx;
      c.graphic.y = currentOy;
      c.graphic.rotation = currentAngle;
      c.graphic.alpha = 1.0 - progress;
    });
  }

  public isFinished() {
    return this.life <= 0;
  }
}

// 6. SHIELD EFFECT (Granite Slime / Monster Stone Skills)
export class ShieldEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private life = 1.3;
  private entity: Container;
  private shieldRotation = 0;

  constructor(entity: Container) {
    super();
    this.entity = entity;
    this.graphic = new Graphics();
    
    // Draw the shield outline once centered at (0, 0)
    this.graphic.circle(0, 0, 46);
    this.graphic.stroke({ width: 3.5, color: 0xf59e0b });
    
    // Fill background with light amber glow
    this.graphic.circle(0, 0, 43);
    this.graphic.fill({ color: 0xf97316, alpha: 0.15 });

    // Draw defensive runes / notches
    for (let i = 0; i < 4; i++) {
      const rad = (i * Math.PI) / 2;
      this.graphic.rect(Math.cos(rad) * 46 - 3, Math.sin(rad) * 46 - 3, 6, 6);
      this.graphic.fill({ color: 0xffffff });
    }

    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.life -= sec;
    this.shieldRotation += sec * 1.2;

    this.x = this.entity.x;
    this.y = this.entity.y;

    const alpha = this.life < 0.25 ? this.life / 0.25 : 0.8;
    this.graphic.alpha = alpha;
    this.graphic.rotation = this.shieldRotation;
  }

  public isFinished() {
    return this.life <= 0 || !this.entity || this.entity.destroyed;
  }
}

// 7. BUBBLE EFFECT (Jelly Bubble / Normal Slime Skills)
export class BubbleEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private popped = false;
  private popLife = 0.12;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.popped) {
      this.progress += sec * 1.6;
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.popped = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const wobbleY = Math.sin(this.progress * Math.PI * 4.0) * 9;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress + wobbleY;

      // Draw bubble
      this.graphic.circle(currentX, currentY, 7.5);
      this.graphic.fill({ color: 0x10b981, alpha: 0.25 });
      this.graphic.stroke({ width: 1.5, color: 0x34d399, alpha: 0.75 });

      // Shiny glare highlight
      this.graphic.circle(currentX - 2.5, currentY - 2.5, 1.5);
      this.graphic.fill({ color: 0xffffff, alpha: 0.6 });
    } else if (this.popLife > 0) {
      this.popLife -= sec;
      const popProgress = 1.0 - (this.popLife / 0.12);

      // Pop splash lines
      for (let i = 0; i < 4; i++) {
        const rad = (i * Math.PI) / 2;
        const len = 4 + 7 * popProgress;
        const sx = this.targetX + Math.cos(rad) * 4;
        const sy = this.targetY + Math.sin(rad) * 4;
        this.graphic.moveTo(sx, sy);
        this.graphic.lineTo(sx + Math.cos(rad) * len, sy + Math.sin(rad) * len);
      }
      this.graphic.stroke({ width: 1.2, color: 0x34d399, alpha: 1.0 - popProgress });
    }
  }

  public isFinished() {
    return this.popped && this.popLife <= 0;
  }
}

// 8. APOCALYPSE EFFECT (Void Behemoth Ultimate)
export class ApocalypseEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private life = 0.85;
  private duration = 0.85;
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.life -= sec;
    const progress = 1.0 - Math.max(0, this.life / this.duration);

    this.graphic.clear();

    const maxAlpha = 0.45;
    let alpha = 0;
    if (progress < 0.25) {
      alpha = (progress / 0.25) * maxAlpha;
    } else {
      alpha = (1.0 - (progress - 0.25) / 0.75) * maxAlpha;
    }

    // Void flash overlay
    this.graphic.rect(0, 0, this.screenWidth, this.screenHeight);
    this.graphic.fill({ color: 0x2e0854, alpha: alpha });

    // Jagged void lightning lines
    if (progress > 0.12 && progress < 0.65) {
      const cAlpha = (1.0 - (progress - 0.12) / 0.53) * 0.8;
      
      this.graphic.moveTo(this.screenWidth * 0.35, 0);
      this.graphic.lineTo(this.screenWidth * 0.42, this.screenHeight * 0.35);
      this.graphic.lineTo(this.screenWidth * 0.39, this.screenHeight * 0.5);
      this.graphic.lineTo(this.screenWidth * 0.48, this.screenHeight * 0.8);

      this.graphic.moveTo(this.screenWidth * 0.72, 0);
      this.graphic.lineTo(this.screenWidth * 0.64, this.screenHeight * 0.35);
      this.graphic.lineTo(this.screenWidth * 0.67, this.screenHeight * 0.55);
      this.graphic.lineTo(this.screenWidth * 0.58, this.screenHeight * 0.85);

      this.graphic.stroke({ width: 3, color: 0xc084fc, alpha: cAlpha });
    }
  }

  public isFinished() {
    return this.life <= 0;
  }
}

// 9. MAGE BASIC ATTACK EFFECT (Magical cyan projectile)
export class MageBasicAttackEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private exploded = false;
  private explosionLife = 0.12;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.exploded) {
      this.progress += sec * 3.5; // very fast
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.exploded = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress;

      // Draw shiny cyan magical orb with trail
      this.graphic.circle(currentX, currentY, 5);
      this.graphic.fill({ color: 0x06b6d4 });
      this.graphic.circle(currentX - 5, currentY, 3);
      this.graphic.fill({ color: 0x38bdf8, alpha: 0.6 });
      this.graphic.circle(currentX - 10, currentY, 1.5);
      this.graphic.fill({ color: 0x7dd3fc, alpha: 0.3 });
    } else if (this.explosionLife > 0) {
      this.explosionLife -= sec;
      const expProgress = 1.0 - (this.explosionLife / 0.12);
      // Small cyan magic ring pop
      this.graphic.circle(this.targetX, this.targetY, 14 * expProgress);
      this.graphic.stroke({ width: 2 * (1 - expProgress), color: 0x22d3ee, alpha: 1 - expProgress });
    }
  }

  public isFinished() {
    return this.exploded && this.explosionLife <= 0;
  }
}

// 10. KNIGHT BASIC ATTACK EFFECT (Flying golden crescent wave)
export class KnightBasicAttackEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private exploded = false;
  private explosionLife = 0.12;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.exploded) {
      this.progress += sec * 3.8; // extremely fast
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.exploded = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress;

      // Draw a flying golden crescent wave (doubled size)
      this.graphic.moveTo(currentX, currentY - 16);
      this.graphic.quadraticCurveTo(currentX + 12, currentY, currentX, currentY + 16);
      this.graphic.quadraticCurveTo(currentX + 4, currentY, currentX, currentY - 16);
      this.graphic.fill({ color: 0xfacc15 });
    } else if (this.explosionLife > 0) {
      this.explosionLife -= sec;
      const expProgress = 1.0 - (this.explosionLife / 0.12);
      // Golden slash spark (doubled size)
      this.graphic.moveTo(this.targetX - 20, this.targetY - 20);
      this.graphic.lineTo(this.targetX + 20, this.targetY + 20);
      this.graphic.stroke({ width: 5 * (1 - expProgress), color: 0xfef08a, alpha: 1 - expProgress });
    }
  }

  public isFinished() {
    return this.exploded && this.explosionLife <= 0;
  }
}

// 11. ASSASSIN BASIC ATTACK EFFECT (Flying dark purple shadow projectile)
export class AssassinBasicAttackEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private exploded = false;
  private explosionLife = 0.12;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.exploded) {
      this.progress += sec * 4.0; // ultra fast
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.exploded = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress;

      // Draw a flying dark purple shadow projectile
      this.graphic.moveTo(currentX, currentY - 6);
      this.graphic.lineTo(currentX + 8, currentY);
      this.graphic.lineTo(currentX, currentY + 6);
      this.graphic.lineTo(currentX - 4, currentY);
      this.graphic.closePath();
      this.graphic.fill({ color: 0x8b5cf6 });
    } else if (this.explosionLife > 0) {
      this.explosionLife -= sec;
      const expProgress = 1.0 - (this.explosionLife / 0.12);
      // Small dark purple cross slash
      this.graphic.moveTo(this.targetX - 10, this.targetY);
      this.graphic.lineTo(this.targetX + 10, this.targetY);
      this.graphic.moveTo(this.targetX, this.targetY - 10);
      this.graphic.lineTo(this.targetX, this.targetY + 10);
      this.graphic.stroke({ width: 2 * (1 - expProgress), color: 0xc084fc, alpha: 1 - expProgress });
    }
  }

  public isFinished() {
    return this.exploded && this.explosionLife <= 0;
  }
}

// 12. MONSTER BASIC ATTACK EFFECT (Red/dark orange energy spike/orb projectile)
export class MonsterBasicAttackEffect extends Container implements VisualEffect {
  private graphic: Graphics;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  private progress = 0;
  private exploded = false;
  private explosionLife = 0.12;

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    super();
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.graphic = new Graphics();
    this.addChild(this.graphic);
  }

  public update(dt: number) {
    const sec = dt / 60;
    this.graphic.clear();

    if (!this.exploded) {
      this.progress += sec * 3.2; // fast
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.exploded = true;
      }

      const currentX = this.startX + (this.targetX - this.startX) * this.progress;
      const currentY = this.startY + (this.targetY - this.startY) * this.progress;

      // Draw red energy spike
      this.graphic.circle(currentX, currentY, 4.5);
      this.graphic.fill({ color: 0xd97706 });
      this.graphic.circle(currentX, currentY, 2.5);
      this.graphic.fill({ color: 0xef4444 });
    } else if (this.explosionLife > 0) {
      this.explosionLife -= sec;
      const expProgress = 1.0 - (this.explosionLife / 0.12);
      // Small red hit burst
      this.graphic.circle(this.targetX, this.targetY, 12 * expProgress);
      this.graphic.stroke({ width: 2 * (1 - expProgress), color: 0xd97706, alpha: 1 - expProgress });
    }
  }

  public isFinished() {
    return this.exploded && this.explosionLife <= 0;
  }
}
