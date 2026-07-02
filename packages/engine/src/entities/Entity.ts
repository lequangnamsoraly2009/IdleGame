import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';

const colorKeyedCache: Record<string, Texture> = {};

function loadBossSprite(imageUrl: string, sprite: Sprite, targetWidth = 64, targetHeight = 64) {
  if (colorKeyedCache[imageUrl]) {
    sprite.texture = colorKeyedCache[imageUrl];
    sprite.width = targetWidth;
    sprite.height = targetHeight;
    return;
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Auto-detect background color from top-left corner pixel
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const isWhiteBg = bgR > 200 && bgG > 200 && bgB > 200;
      const isBlackBg = bgR < 60 && bgG < 60 && bgB < 60;

      if (isWhiteBg || isBlackBg) {
        const tolerance = 48; // RGB distance threshold
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dist = Math.sqrt(
            Math.pow(r - bgR, 2) +
            Math.pow(g - bgG, 2) +
            Math.pow(b - bgB, 2)
          );

          if (dist < tolerance) {
            data[i + 3] = 0; // Make pixel transparent
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const texture = Texture.from(canvas);
      colorKeyedCache[imageUrl] = texture;
      sprite.texture = texture;

      // Update dimensions after texture is set
      sprite.width = targetWidth;
      sprite.height = targetHeight;
    }
  };
  img.onerror = (err) => {
    console.error(`Failed to load boss sprite image: ${imageUrl}`, err);
  };
  img.src = imageUrl;
}

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

  constructor(name: string, isHero: boolean, maxHp: number, language: 'vi' | 'en' = 'vi') {
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

    // Parse rank prefix and translate name
    const { displayName, rankColor } = parseAndTranslateName(name, isHero, language);

    const labelStyle = new TextStyle({
      fontFamily: 'Outfit, Inter, Arial, sans-serif',
      fontSize: 9,
      fontWeight: 'bold',
      fill: rankColor,
      stroke: { color: 0x0f172a, width: 3.5 }, // thick outline for premium contrast
      align: 'center'
    });

    this.nameText = new Text({ text: displayName, style: labelStyle });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -95; // increased vertical offset to avoid overlapping labels
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
      const lowerName = this.name.toLowerCase();
      let bossImageUrl = '';

      if (lowerName.includes('golem') || lowerName.includes('vệ binh') || lowerName.includes('sentinel') || lowerName.includes('cổ tự')) {
        bossImageUrl = '/boss_golem.png';
      } else if (lowerName.includes('demon') || lowerName.includes('quỷ') || lowerName.includes('archdemon') || lowerName.includes('mực') || lowerName.includes('hỏa')) {
        bossImageUrl = '/boss_demon.png';
      } else if (lowerName.includes('dragon') || lowerName.includes('rồng') || lowerName.includes('behemoth')) {
        bossImageUrl = '/boss_dragon.png';
      } else if (lowerName.includes('goblin') || lowerName.includes('thủ lĩnh')) {
        bossImageUrl = '/boss_goblin.png';
      } else if (lowerName.includes('spider') || lowerName.includes('nhện')) {
        bossImageUrl = '/boss_spider.png';
      } else if (lowerName.includes('chimera') || lowerName.includes('octopus') || lowerName.includes('leviathan') || lowerName.includes('quái thú') || lowerName.includes('thần thoại')) {
        bossImageUrl = '/boss_octopus.png';
      } else if (lowerName.includes('knight') || lowerName.includes('hiệp sĩ')) {
        bossImageUrl = '/boss_knight.png';
      }

      if (bossImageUrl) {
        this.body.clear();
        this.body.removeChildren();
        const bossSprite = new Sprite();
        bossSprite.anchor.set(0.5, 0.5);
        bossSprite.y = 0;
        this.body.addChild(bossSprite);
        loadBossSprite(bossImageUrl, bossSprite, 156, 156);
        return;
      }

      if (lowerName.includes('golem') || lowerName.includes('vệ binh') || lowerName.includes('sentinel') || lowerName.includes('cổ tự')) {
        // --- GOLEM / SENTINEL ---
        // Head
        this.body.roundRect(-18, -26, 36, 24, 5);
        this.body.fill({ color: 0x64748b });
        this.body.stroke({ width: 2.5, color: 0x334155 });
        // Glowing cyan eyes
        this.body.circle(-7, -15, 2.5);
        this.body.circle(7, -15, 2.5);
        this.body.fill({ color: 0x06b6d4 });
        // Massive shoulders / chest
        this.body.roundRect(-30, -2, 60, 30, 8);
        this.body.fill({ color: 0x475569 });
        this.body.stroke({ width: 2.5, color: 0x1e293b });
        // Glowing magic core
        this.body.circle(0, 10, 8);
        this.body.fill({ color: 0x22d3ee });
      } else if (lowerName.includes('dragon') || lowerName.includes('rồng') || lowerName.includes('behemoth')) {
        // --- DRAGON / BEHEMOTH ---
        const isGold = lowerName.includes('vàng') || lowerName.includes('gold') || lowerName.includes('hoàng');
        const dragonColor = isGold ? 0xf59e0b : 0x4c1d95;
        const dragonStroke = isGold ? 0x78350f : 0x2e1065;

        this.body.moveTo(0, -26);
        this.body.lineTo(20, -10);
        this.body.lineTo(12, 18);
        this.body.lineTo(0, 24);
        this.body.lineTo(-12, 18);
        this.body.lineTo(-20, -10);
        this.body.closePath();
        this.body.fill({ color: dragonColor });
        this.body.stroke({ width: 2.5, color: dragonStroke });
        // Horns
        this.body.moveTo(-12, -18);
        this.body.quadraticCurveTo(-26, -38, -24, -42);
        this.body.quadraticCurveTo(-16, -30, -5, -21);
        this.body.fill({ color: 0x111827 });
        this.body.stroke({ width: 1.5, color: 0x000000 });
        this.body.moveTo(12, -18);
        this.body.quadraticCurveTo(26, -38, 24, -42);
        this.body.quadraticCurveTo(16, -30, 5, -21);
        this.body.fill({ color: 0x111827 });
        this.body.stroke({ width: 1.5, color: 0x000000 });
        // Glowing reptile eyes
        this.body.circle(-7, -6, 2.5);
        this.body.circle(7, -6, 2.5);
        this.body.fill({ color: 0xef4444 });
        // Scales
        this.body.circle(0, 4, 3);
        this.body.fill({ color: 0xfacc15 });
      } else if (lowerName.includes('demon') || lowerName.includes('quỷ') || lowerName.includes('efreet') || lowerName.includes('cự ma')) {
        // --- DEMON / EFREET ---
        this.body.circle(0, -6, 22);
        this.body.fill({ color: 0xef4444 });
        this.body.stroke({ width: 2.5, color: 0x7f1d1d });
        // Large curved black horns
        this.body.moveTo(-12, -22);
        this.body.quadraticCurveTo(-30, -38, -32, -30);
        this.body.quadraticCurveTo(-20, -20, -6, -12);
        this.body.fill({ color: 0x111827 });
        this.body.moveTo(12, -22);
        this.body.quadraticCurveTo(30, -38, 32, -30);
        this.body.quadraticCurveTo(20, -20, 6, -12);
        this.body.fill({ color: 0x111827 });
        // Savage glowing yellow eyes
        this.body.circle(-6, -10, 3);
        this.body.circle(6, -10, 3);
        this.body.fill({ color: 0xfacc15 });
        // Fanged mouth
        this.body.rect(-8, 2, 16, 5);
        this.body.fill({ color: 0x111827 });
        this.body.moveTo(-6, 2);
        this.body.lineTo(-4, 6);
        this.body.lineTo(-2, 2);
        this.body.moveTo(6, 2);
        this.body.lineTo(4, 6);
        this.body.lineTo(2, 2);
        this.body.fill({ color: 0xffffff });
      } else if (lowerName.includes('goblin')) {
        // --- GOBLIN ---
        this.body.circle(0, -2, 20);
        this.body.fill({ color: 0x22c55e });
        this.body.stroke({ width: 2.5, color: 0x14532d });
        // Long pointy ears
        this.body.moveTo(-18, -4);
        this.body.lineTo(-38, -15);
        this.body.lineTo(-18, 8);
        this.body.closePath();
        this.body.fill({ color: 0x16a34a });
        this.body.stroke({ width: 1.5, color: 0x14532d });
        this.body.moveTo(18, -4);
        this.body.lineTo(38, -15);
        this.body.lineTo(18, 8);
        this.body.closePath();
        this.body.fill({ color: 0x16a34a });
        this.body.stroke({ width: 1.5, color: 0x14532d });
        // Nose
        this.body.moveTo(0, -4);
        this.body.lineTo(-8, 8);
        this.body.lineTo(0, 8);
        this.body.closePath();
        this.body.fill({ color: 0x15803d });
        // Yellow eyes
        this.body.circle(-6, -7, 2.5);
        this.body.circle(6, -7, 2.5);
        this.body.fill({ color: 0xeab308 });
      } else if (lowerName.includes('spider') || lowerName.includes('nhện')) {
        // --- SPIDER ---
        this.body.ellipse(0, 4, 26, 18);
        this.body.fill({ color: 0x1e293b });
        this.body.stroke({ width: 2.5, color: 0x0ea5e9 });
        // Multiple small cyan eyes
        this.body.circle(-8, -4, 2);
        this.body.circle(-3, -6, 2);
        this.body.circle(3, -6, 2);
        this.body.circle(8, -4, 2);
        this.body.fill({ color: 0x38bdf8 });
        // Creepy fangs
        this.body.moveTo(-5, 10);
        this.body.lineTo(-8, 18);
        this.body.lineTo(-2, 10);
        this.body.moveTo(5, 10);
        this.body.lineTo(8, 18);
        this.body.lineTo(2, 10);
        this.body.fill({ color: 0xffffff });
      } else if (lowerName.includes('knight') || lowerName.includes('hiệp sĩ')) {
        // --- UNDEAD KNIGHT ---
        this.body.circle(0, -10, 20);
        this.body.fill({ color: 0x475569 });
        this.body.stroke({ width: 2.5, color: 0x1e293b });
        // Visor gap
        this.body.rect(-14, -16, 28, 5);
        this.body.fill({ color: 0x0f172a });
        // Glowing red eyes
        this.body.circle(-5, -13, 2);
        this.body.circle(5, -13, 2);
        this.body.fill({ color: 0xef4444 });
        // Dark pauldrons
        this.body.roundRect(-24, 4, 48, 20, 5);
        this.body.fill({ color: 0x334155 });
        this.body.stroke({ width: 2, color: 0x111827 });
      } else if (lowerName.includes('chimera') || lowerName.includes('quái thú') || lowerName.includes('beast')) {
        // --- CHIMERA ---
        this.body.circle(0, -4, 26);
        this.body.fill({ color: 0xea580c });
        this.body.stroke({ width: 2, color: 0x9a3412 });
        // Savage face
        this.body.circle(0, -2, 18);
        this.body.fill({ color: 0xd97706 });
        this.body.stroke({ width: 2.5, color: 0x7c2d12 });
        // Horns
        this.body.moveTo(-8, -16);
        this.body.lineTo(-16, -30);
        this.body.lineTo(-3, -20);
        this.body.moveTo(8, -16);
        this.body.lineTo(16, -30);
        this.body.lineTo(3, -20);
        this.body.fill({ color: 0x1e293b });
        // Glowing eyes
        this.body.circle(-6, -6, 2.5);
        this.body.circle(6, -6, 2.5);
        this.body.fill({ color: 0xef4444 });
      } else {
        // --- DEFAULT CUTE SLIME ---
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
        this.body.quadraticCurveTo(0, 32, 28, 24);
        this.body.quadraticCurveTo(34, 6, 22, -8);
        this.body.quadraticCurveTo(0, -24, -22, -8);
        this.body.quadraticCurveTo(-34, 6, -28, 24);
        this.body.closePath();

        this.body.fill({ color: slimeColor, alpha: 0.85 });
        this.body.stroke({ width: 3, color: 0x1e293b });

        // Highlight
        this.body.circle(-10, -6, 5);
        this.body.fill({ color: 0xffffff, alpha: 0.4 });

        // Eyes
        this.body.circle(-8, 8, 4);
        this.body.circle(8, 8, 4);
        this.body.fill({ color: 0x0f172a });

        // Sparkles
        this.body.circle(-9.5, 6.5, 1.2);
        this.body.circle(6.5, 6.5, 1.2);
        this.body.fill({ color: 0xffffff });

        // Blushing cheeks
        this.body.circle(-15, 12, 3);
        this.body.circle(15, 12, 3);
        this.body.fill({ color: cheekColor, alpha: 0.7 });

        // Mouth
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

          this.body.circle(-14, -31, 1.5);
          this.body.circle(0, -37, 1.5);
          this.body.circle(14, -31, 1.5);
          this.body.fill({ color: 0xef4444 });
        }
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
    heroClass?: 'knight' | 'mage' | 'assassin',
    language: 'vi' | 'en' = 'vi'
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

      const { displayName, rankColor } = parseAndTranslateName(name, this.isHero, language);

      // Positioning of entities is handled in Engine.positionEntities; no local positioning needed here.

      this.nameText.text = displayName;
      this.nameText.style.fill = rankColor;
      this.nameText.y = -95; // align with increased offset
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

  public isRunning: boolean = false;

  public setRunning(running: boolean) {
    this.isRunning = running;
    if (!running) {
      this.body.y = 0;
      this.rotation = 0;
    }
  }

  public setTargetPosition(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
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

    // Running bobbing & tilt micro-animations
    if (this.isRunning) {
      this.body.y = Math.abs(Math.sin(Date.now() * 0.015)) * -8;
      this.rotation = 0.06 * Math.sin(Date.now() * 0.015);
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

function parseAndTranslateName(name: string, isHero: boolean, language: 'vi' | 'en'): { displayName: string; rankColor: number } {
  let displayName = name;
  let rankColor = isHero ? 0x60a5fa : 0xfca5a5; // default ally / normal monster

  if (isHero) {
    if (language === 'vi') {
      if (displayName.includes(' Hero')) {
        displayName = displayName.replace(' Hero', ' Anh Hùng');
      } else if (displayName === 'Hero') {
        displayName = 'Anh Hùng';
      }
    }
    return { displayName, rankColor };
  }

  // Parse ranks
  const ranks = [
    { key: '[Boss]', color: 0xef4444 },
    { key: '[Champion]', color: 0xd946ef },
    { key: '[Elite]', color: 0xf59e0b },
    { key: '[Normal]', color: 0xcbd5e1 },
    { key: '[King]', color: 0xf97316 },
    { key: '[Legend]', color: 0xeab308 },
    { key: '[Mythic]', color: 0xec4899 },
    { key: '[Ancient]', color: 0x06b6d4 },
    { key: '[World Boss]', color: 0xff0055 },
  ];

  for (const r of ranks) {
    if (name.includes(r.key)) {
      displayName = name.replace(r.key + ' ', '');
      rankColor = r.color;
      break;
    }
  }

  // Translate displayName if language is 'vi'
  if (language === 'vi') {
    // Look for format like: "Monster Name (Lv.X) (⚔️CP)" or "Monster Name (⚔️CP)"
    const match = displayName.match(/^(.*?)\s*\(Lv\.\d+\)\s*\(⚔️.*?\)$/);
    const matchNoStats = displayName.match(/^(.*?)\s*\(⚔️.*?\)$/);

    if (match) {
      const rawMonsterText = match[1];
      const translatedMonsterText = translateMonsterText(rawMonsterText, 'vi');
      displayName = displayName.replace(rawMonsterText, translatedMonsterText);
    } else if (matchNoStats) {
      const rawMonsterText = matchNoStats[1];
      const translatedMonsterText = translateMonsterText(rawMonsterText, 'vi');
      displayName = displayName.replace(rawMonsterText, translatedMonsterText);
    } else {
      displayName = translateMonsterText(displayName, 'vi');
    }
  }

  return { displayName, rankColor };
}

function translateMonsterText(rawName: string, lang: 'vi' | 'en'): string {
  if (lang !== 'vi') return rawName;

  const prefixes: Record<string, string> = {
    'Meadow': 'Thảo Nguyên',
    'Granite': 'Granite',
    'Magma': 'Magma',
    'Frost': 'Băng',
    'Void': 'Hư Không',
    'Crystal': 'Pha Lê',
    'Golden': 'Vàng',
    'Forest': 'Rừng Rậm',
    'Volcanic': 'Núi Lửa',
    'Ancient': 'Cổ Đại',
    'Primordial': 'Nguyên Thủy'
  };

  const bases: Record<string, string> = {
    'Slime King': 'Vua Slime',
    'Slime God': 'Thần Slime',
    'Slime': 'Slime',
    'Goblin Emperor': 'Hoàng Đế Goblin',
    'Goblin': 'Goblin',
    'Orc Warrior': 'Orc Chiến Binh',
    'Orc Chieftain': 'Tộc Trưởng Orc',
    'Skeleton Archer': 'Cung Thủ Xương',
    'Skeleton Warlord': 'Đại Tướng Xương',
    'Wraith Lord': 'Chúa Tể Bóng Ma',
    'Stone Golem': 'Golem Đá',
    'Golem Guardian': 'Hộ Vệ Golem',
    'Demon Commander': 'Thống Lãnh Ác Quỷ',
    'Volcanic Drake': 'Rồng Nhỏ Núi Lửa',
    'Drake Sovereign': 'Drake Tối Cao',
    'Ancient Dragon': 'Cổ Long',
    'Titan Overlord': 'Chúa Tể Titan',
    'Primordial Slime God': 'Thần Slime Nguyên Thủy'
  };

  const affixes: Record<string, string> = {
    'swift': 'Tốc Độ',
    'berserk': 'Cuồng Nộ',
    'vampire': 'Hút Máu',
    'explosive': 'Bộc Phá',
    'Swift': 'Tốc Độ',
    'Berserk': 'Cuồng Nộ',
    'Vampire': 'Hút Máu',
    'Explosive': 'Bộc Phá'
  };

  let translated = rawName;

  // Extract parentheses part (affixes)
  let cleanBase = translated;
  let affixPart = '';
  const parenMatch = translated.match(/\s*\((.*?)\)/);
  if (parenMatch) {
    cleanBase = translated.replace(parenMatch[0], '').trim();
    affixPart = parenMatch[0];
  }

  // Check if starts with Mutated
  let isMut = false;
  if (cleanBase.startsWith('Mutated ')) {
    cleanBase = cleanBase.replace('Mutated ', '').trim();
    isMut = true;
  }

  // Translate cleanBase
  if (bases[cleanBase]) {
    cleanBase = bases[cleanBase];
  } else {
    const cleanParts = cleanBase.split(' ');
    if (cleanParts.length === 2) {
      const pWord = prefixes[cleanParts[0]] || cleanParts[0];
      const bWord = bases[cleanParts[1]] || cleanParts[1];
      cleanBase = `${bWord} ${pWord}`;
    } else {
      cleanBase = bases[cleanBase] || prefixes[cleanBase] || cleanBase;
    }
  }

  if (isMut) {
    cleanBase = `Đột Biến ${cleanBase}`;
  }

  // Translate affixes
  if (affixPart && parenMatch) {
    const rawAffixesStr = parenMatch[1];
    const rawAffixes = rawAffixesStr.split(' ');
    const translatedAffixes = rawAffixes.map(a => affixes[a] || a);
    affixPart = ` (${translatedAffixes.join(' ')})`;
  }

  return cleanBase + affixPart;
}
