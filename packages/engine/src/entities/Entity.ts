import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class Entity extends Container {
  public isHero: boolean;
  public maxHp: number;
  public currentHp: number;
  public name: string;

  private body: Graphics;
  private healthBarBg: Graphics;
  private healthBarFill: Graphics;
  private nameText: Text;
  
  // Animation states
  private targetX: number = 0;
  private targetY: number = 0;
  private baseScale = 1.0;
  private flashFrames = 0;

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
    const color = this.isHero ? 0x3b82f6 : 0xef4444; // Neon Blue vs Neon Red

    if (this.isHero) {
      // Draw Hero shape (e.g. Shield/Vanguard shield with gold core)
      this.body.circle(0, 0, 32);
      this.body.fill({ color });
      this.body.stroke({ width: 3, color: 0xffffff });

      // Inside details (Sword/Cross outline)
      this.body.rect(-4, -20, 8, 40);
      this.body.rect(-16, -8, 32, 8);
      this.body.fill({ color: 0xf59e0b }); // Gold core
    } else {
      // Draw Monster shape (Spiky demonic core)
      this.body.moveTo(0, -36);
      this.body.lineTo(12, -12);
      this.body.lineTo(36, -12);
      this.body.lineTo(18, 6);
      this.body.lineTo(24, 30);
      this.body.lineTo(0, 18);
      this.body.lineTo(-24, 30);
      this.body.lineTo(-18, 6);
      this.body.lineTo(-36, -12);
      this.body.lineTo(-12, -12);
      this.body.closePath();
      
      this.body.fill({ color });
      this.body.stroke({ width: 3, color: 0x000000 });

      // Glowing pupil/eye
      this.body.circle(0, 0, 8);
      this.body.fill({ color: 0xf59e0b });
      this.body.circle(0, 0, 3);
      this.body.fill({ color: 0x000000 });
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

  public updateStats(currentHp: number, maxHp: number, name?: string) {
    this.currentHp = currentHp;
    this.maxHp = maxHp;
    if (name) {
      this.name = name;
      this.nameText.text = name;
    }
    this.drawHealthBar();
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

    // Smooth return of scale to baseline
    const scaleDiff = this.baseScale - this.scale.x;
    this.scale.set(this.scale.x + scaleDiff * 0.2 * dt);

    // Damage flash logic
    if (this.flashFrames > 0) {
      this.flashFrames--;
      if (this.flashFrames === 0) {
        this.body.tint = 0xffffff;
      }
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
