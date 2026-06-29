import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class Entity extends Container {
  public isHero: boolean;
  public maxHp: number;
  public currentHp: number;
  public name: string;

  private body: Graphics;
  private healthBarBg: Graphics;
  private healthBarFill: Graphics;
  private rageBarBg: Graphics;
  private rageBarFill: Graphics;
  private nameText: Text;
  
  // Animation states
  private targetX: number = 0;
  private targetY: number = 0;
  private baseScale = 1.0;
  private flashFrames = 0;
  private currentRage = 0;
  private maxRage = 100;
  private heroClass: 'knight' | 'mage' | 'assassin' = 'knight';

  constructor(name: string, isHero: boolean, maxHp: number) {
    super();
    this.name = name;
    this.isHero = isHero;
    this.maxHp = maxHp;
    this.currentHp = maxHp;

    // Create the character visual body
    this.body = new Graphics();
    this.drawBody();
    this.addChild(this.body);

    // Create health bar background
    this.healthBarBg = new Graphics();
    this.healthBarBg.rect(-40, -60, 80, 8);
    this.healthBarBg.fill({ color: 0x1f2937, alpha: 0.8 });
    this.addChild(this.healthBarBg);

    // Create health bar fill
    this.healthBarFill = new Graphics();
    this.drawHealthBar();
    this.addChild(this.healthBarFill);

    // Create rage bar background
    this.rageBarBg = new Graphics();
    this.rageBarBg.rect(-40, -48, 80, 5);
    this.rageBarBg.fill({ color: 0x1f2937, alpha: 0.8 });
    this.addChild(this.rageBarBg);

    // Create rage bar fill
    this.rageBarFill = new Graphics();
    this.drawRageBar(0);
    this.addChild(this.rageBarFill);

    // Create text label for level/name
    const labelStyle = new TextStyle({
      fontFamily: 'Outfit, Inter, Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });

    this.nameText = new Text({ text: name, style: labelStyle });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -75;
    this.addChild(this.nameText);
  }

  private drawBody() {
    this.body.clear();

    if (this.isHero) {
      if (this.heroClass === 'knight') {
        // --- CHIBI KNIGHT ---
        // 1. Helmet (Steel gray) - Offset vertically
        this.body.circle(0, -18, 24);
        this.body.fill({ color: 0x94a3b8 });
        this.body.stroke({ width: 2.5, color: 0x334155 });

        // Helmet Plume (Red feather)
        this.body.moveTo(0, -42);
        this.body.quadraticCurveTo(12, -58, 24, -46);
        this.body.quadraticCurveTo(8, -42, 0, -42);
        this.body.fill({ color: 0xef4444 });
        this.body.stroke({ width: 1, color: 0x991b1b });

        // Visor gap / mask
        this.body.roundRect(-16, -24, 32, 8, 4);
        this.body.fill({ color: 0x1e293b });

        // Visor glowing eyes (Neon Blue)
        this.body.circle(-7, -20, 2.5);
        this.body.circle(7, -20, 2.5);
        this.body.fill({ color: 0x60a5fa });

        // Visor breathing grill lines
        this.body.rect(-10, -12, 2, 8);
        this.body.rect(-4, -12, 2, 8);
        this.body.rect(2, -12, 2, 8);
        this.body.rect(8, -12, 2, 8);
        this.body.fill({ color: 0x475569 });

        // 2. Chestplate Body (Light silver)
        this.body.circle(0, 10, 20);
        this.body.fill({ color: 0xcbd5e1 });
        this.body.stroke({ width: 2.5, color: 0x334155 });

        // Golden cross emblem on chest
        this.body.rect(-2, 0, 4, 18);
        this.body.rect(-8, 6, 16, 4);
        this.body.fill({ color: 0xf59e0b });

        // Shoulder pauldrons
        this.body.circle(-21, 6, 6);
        this.body.circle(21, 6, 6);
        this.body.fill({ color: 0x94a3b8 });
        this.body.stroke({ width: 2, color: 0x334155 });
      } else if (this.heroClass === 'mage') {
        // --- CHIBI MAGE ---
        // 1. Wizard Robe Body (Deep Purple/Violet)
        this.body.circle(0, 10, 20);
        this.body.fill({ color: 0x6b21a8 });
        this.body.stroke({ width: 2.5, color: 0x3b0764 });

        // Magic Wand / Staff
        this.body.rect(17, -15, 3.5, 36);
        this.body.fill({ color: 0x78350f });
        // Glowing cyan magic orb
        this.body.circle(19, -19, 5);
        this.body.fill({ color: 0x22d3ee });

        // Golden stars/sparkles on robe
        this.body.circle(-6, 8, 2);
        this.body.circle(6, 14, 2);
        this.body.fill({ color: 0xfacc15 });

        // 2. Wizard Hat (Dark Purple)
        // Hat brim
        this.body.roundRect(-26, -18, 52, 5, 2.5);
        this.body.fill({ color: 0x581c87 });
        this.body.stroke({ width: 2, color: 0x3b0764 });

        // Hat cap (triangle)
        this.body.moveTo(-18, -18);
        this.body.lineTo(18, -18);
        this.body.lineTo(0, -48);
        this.body.closePath();
        this.body.fill({ color: 0x581c87 });
        this.body.stroke({ width: 2, color: 0x3b0764 });

        // Yellow belt band on hat
        this.body.rect(-17, -22, 34, 4);
        this.body.fill({ color: 0xeab308 });

        // Glowing Violet Wizard Eyes
        this.body.circle(-7, -7, 2.5);
        this.body.circle(7, -7, 2.5);
        this.body.fill({ color: 0xc084fc });
      } else {
        // --- CHIBI ASSASSIN ---
        // 1. Leather Armor Body (Dark Charcoal)
        this.body.circle(0, 10, 20);
        this.body.fill({ color: 0x374151 });
        this.body.stroke({ width: 2.5, color: 0x111827 });

        // Dual Steel Daggers
        // Left dagger handle + blade
        this.body.rect(-20, 10, 3, 7);
        this.body.fill({ color: 0x78350f });
        this.body.rect(-21, 17, 5, 10);
        this.body.fill({ color: 0x94a3b8 });

        // Right dagger handle + blade
        this.body.rect(17, 10, 3, 7);
        this.body.fill({ color: 0x78350f });
        this.body.rect(16, 17, 5, 10);
        this.body.fill({ color: 0x94a3b8 });

        // Red belt/scarf wrap
        this.body.rect(-10, 6, 20, 4);
        this.body.fill({ color: 0xef4444 });

        // 2. Dark Hood (Black)
        this.body.circle(0, -15, 23);
        this.body.fill({ color: 0x111827 });
        this.body.stroke({ width: 2, color: 0x1f2937 });

        // Face skin showing
        this.body.ellipse(0, -13, 14, 11);
        this.body.fill({ color: 0xffedd5 });

        // Face mask (covering lower face)
        this.body.arc(0, -10, 14, 0, Math.PI, false);
        this.body.fill({ color: 0x1f2937 });

        // Sharp glowing red eyes (Neon Red)
        this.body.circle(-6, -14, 2);
        this.body.circle(6, -14, 2);
        this.body.fill({ color: 0xef4444 });
      }

      // Cute feet (little gray semi-circles at bottom) - Bottom edge exactly y = 32
      this.body.circle(-10, 26, 6);
      this.body.circle(10, 26, 6);
      this.body.fill({ color: 0x475569 });
      this.body.stroke({ width: 2, color: 0x1e293b });
    } else {
      // 3. CUTE SQUISHY SLIME (Dynamic coloring based on name) - Shifted by +8px to make bottom edge exactly y = 32
      const lowerName = this.name.toLowerCase();
      let slimeColor = 0x10b981; // default green slime
      let cheekColor = 0xfca5a5; // cute pink blush

      if (lowerName.includes('đá') || lowerName.includes('stone') || lowerName.includes('sắt') || lowerName.includes('brass') || lowerName.includes('đồng')) {
        slimeColor = 0x78716c; // stone/gray slime
      } else if (lowerName.includes('lửa') || lowerName.includes('fire') || lowerName.includes('quỷ') || lowerName.includes('bộc')) {
        slimeColor = 0xef4444; // fire/red slime
      } else if (lowerName.includes('băng') || lowerName.includes('ice') || lowerName.includes('nước') || lowerName.includes('khí')) {
        slimeColor = 0x3b82f6; // ice/blue slime
      } else if (lowerName.includes('vàng') || lowerName.includes('gold') || lowerName.includes('hoàng')) {
        slimeColor = 0xeab308; // golden slime
      } else if (lowerName.includes('bóng') || lowerName.includes('shadow') || lowerName.includes('hắc')) {
        slimeColor = 0x6b21a8; // shadow/purple slime
      }

      // Draw squishy slime jelly blob
      this.body.moveTo(-28, 24);
      // Bottom squish flat - Exactly y = 32
      this.body.quadraticCurveTo(0, 32, 28, 24);
      // Right side curve
      this.body.quadraticCurveTo(34, 6, 22, -8);
      // Top round dome
      this.body.quadraticCurveTo(0, -24, -22, -8);
      // Left side curve
      this.body.quadraticCurveTo(-34, 6, -28, 24);
      this.body.closePath();

      // Slime inner transparent color
      this.body.fill({ color: slimeColor, alpha: 0.85 });
      this.body.stroke({ width: 3, color: 0x1e293b });

      // Highlight glossy spot (top left)
      this.body.circle(-10, -6, 5);
      this.body.fill({ color: 0xffffff, alpha: 0.4 });

      // Cute big anime eyes
      this.body.circle(-8, 8, 4);
      this.body.circle(8, 8, 4);
      this.body.fill({ color: 0x0f172a }); // dark pupil

      // White eye sparkles
      this.body.circle(-9.5, 6.5, 1.2);
      this.body.circle(6.5, 6.5, 1.2);
      this.body.fill({ color: 0xffffff });

      // Blushing cheeks
      this.body.circle(-15, 12, 3);
      this.body.circle(15, 12, 3);
      this.body.fill({ color: cheekColor, alpha: 0.7 });

      // Cute tiny mouth
      this.body.moveTo(-2, 12);
      this.body.quadraticCurveTo(0, 15, 2, 12);
      this.body.stroke({ width: 1.5, color: 0x0f172a });

      // Draw a golden crown if it is the Slime King (Vua Slime)
      if (lowerName.includes('king') || lowerName.includes('chúa') || lowerName.includes('vương') || lowerName.includes('boss')) {
        this.body.moveTo(-10, -20);
        this.body.lineTo(-14, -30);
        this.body.lineTo(-5, -25);
        this.body.lineTo(0, -36);
        this.body.lineTo(5, -25);
        this.body.lineTo(14, -30);
        this.body.lineTo(10, -20);
        this.body.closePath();
        this.body.fill({ color: 0xeab308 });
        this.body.stroke({ width: 1.5, color: 0x1e293b });

        // Crown gems
        this.body.circle(-14, -31, 1.5);
        this.body.circle(0, -37, 1.5);
        this.body.circle(14, -31, 1.5);
        this.body.fill({ color: 0xef4444 }); // ruby red gems
      }
    }
  }

  private drawHealthBar() {
    this.healthBarFill.clear();
    const hpPercentage = Math.max(0, this.currentHp / this.maxHp);
    const width = 80 * hpPercentage;
    const color = this.isHero ? 0x10b981 : 0xef4444; // green vs red
    
    if (width > 0) {
      this.healthBarFill.rect(-40, -60, width, 8);
      this.healthBarFill.fill({ color });
    }
  }

  public updateStats(
    currentHp: number,
    maxHp: number,
    name?: string,
    rage?: number,
    heroClass?: 'knight' | 'mage' | 'assassin'
  ) {
    this.currentHp = currentHp;
    this.maxHp = maxHp;
    let classChanged = false;
    if (heroClass && heroClass !== this.heroClass) {
      this.heroClass = heroClass;
      classChanged = true;
    }
    if (name) {
      const nameChanged = this.name !== name;
      this.name = name;
      this.nameText.text = name;
      if (nameChanged || classChanged) {
        this.drawBody();
      }
    } else if (classChanged) {
      this.drawBody();
    }
    this.drawHealthBar();
    if (rage !== undefined) {
      this.drawRageBar(rage);
    }
  }

  private drawRageBar(rage: number) {
    this.currentRage = rage;
    this.rageBarFill.clear();
    const percentage = Math.min(1.0, Math.max(0, this.currentRage / this.maxRage));
    const width = 80 * percentage;
    const color = 0xf97316; // Orange

    if (width > 0) {
      this.rageBarFill.rect(-40, -48, width, 5);
      this.rageBarFill.fill({ color });
    }

    if (this.currentRage >= 100) {
      // Glow/Breathing alpha effect
      const breathing = Math.sin(Date.now() * 0.012) * 0.25 + 0.75;
      this.rageBarFill.alpha = breathing;
    } else {
      this.rageBarFill.alpha = 1.0;
    }
  }

  public setBasePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  public update(dt: number) {
    // Smooth translation towards target position (spring/easing animation)
    this.x += (this.targetX - this.x) * 0.15 * dt;
    this.y += (this.targetY - this.y) * 0.15 * dt;

    // Smooth return of scale to baseline (pulsing if enraged)
    const targetScale = this.currentRage >= 100
      ? this.baseScale + Math.sin(Date.now() * 0.012) * 0.05
      : this.baseScale;
    const scaleDiff = targetScale - this.scale.x;
    this.scale.set(this.scale.x + scaleDiff * 0.2 * dt);

    // Damage flash logic
    if (this.flashFrames > 0) {
      this.flashFrames--;
      if (this.flashFrames === 0) {
        this.body.tint = 0xffffff;
      }
    }

    // Breathing glow animation for full rage
    if (this.currentRage >= 100) {
      this.drawRageBar(this.currentRage);
    }
  }

  public playAttackAnimation(opponentX: number) {
    const direction = opponentX > this.x ? 1 : -1;
    // Step forward quickly
    this.x += direction * 35;
    // Stretch scale slightly
    this.scale.set(1.2, 0.8);
  }

  public takeDamage(amount: number) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.drawHealthBar();

    // Visual effect: Squish slightly and flash red
    this.scale.set(0.8, 1.2);
    this.body.tint = 0xff4444;
    this.flashFrames = 8; // Flash for 8 frames
  }

  public playDeathAnimation(callback: () => void) {
    // Fade out and spin
    let frames = 30;
    const fadeTick = () => {
      if (frames > 0) {
        frames--;
        this.alpha = frames / 30;
        this.scale.set(this.scale.x * 0.95);
        this.rotation += 0.2;
        requestAnimationFrame(fadeTick);
      } else {
        this.alpha = 0;
        callback();
      }
    };
    fadeTick();
  }

  public resetVisuals() {
    this.alpha = 1;
    this.scale.set(1);
    this.rotation = 0;
    this.body.tint = 0xffffff;
    this.drawHealthBar();
  }
}
