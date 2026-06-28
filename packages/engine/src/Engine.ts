import { Application, Container, Graphics } from 'pixi.js';
import { BaseStats, MonsterTemplate, EquipmentItem } from '@idle-rpg/shared';
import { recalculateHeroStats, DEFAULT_ITEM_TEMPLATES, createItemInstance } from '@idle-rpg/shared';
import { Entity } from './entities/Entity';
import { DamageText } from './effects/DamageText';

export type EngineEvent =
  | { type: 'DAMAGE_DEALT'; amount: number; isCrit: boolean; isHeroTarget: boolean; currentHp: number }
  | { type: 'MONSTER_DEFEATED'; exp: number; gold: number; diamonds: number; itemsDropped: any[] }
  | { type: 'HERO_DEFEATED' }
  | { type: 'BATTLE_TICK'; heroHp: number; monsterHp: number; maxHeroHp: number; maxMonsterHp: number }
  | { type: 'STAGE_ADVANCED'; nextStage: number }
  | { type: 'LOG_MESSAGE'; text: string; category: 'combat' | 'loot' | 'system' };

export class GameEngine {
  private app: Application | null = null;
  private container: HTMLDivElement | null = null;
  
  // Game layers
  private gameStage: Container = new Container();
  private backgroundLayer: Graphics = new Graphics();
  private entityLayer: Container = new Container();
  private effectLayer: Container = new Container();

  // Entities
  private heroEntity: Entity | null = null;
  private monsterEntity: Entity | null = null;

  // Effects
  private damageTexts: DamageText[] = [];

  // Configured states passed from React Store
  private heroLevel: number = 1;
  private prestigePoints: number = 0;
  private equippedItems: EquipmentItem[] = [];
  private heroStats!: BaseStats;
  private heroCurrentHp: number = 100;

  private currentStage: number = 1;
  private monsterTemplate: MonsterTemplate | null = null;
  private monsterCurrentHp: number = 50;
  private monsterMaxHp: number = 50;

  // Timers (in seconds)
  private heroAttackCooldown: number = 0;
  private monsterAttackCooldown: number = 0;
  private isBattleActive: boolean = false;
  private respawnTimer: number = 0;
  private respawnTimeout: any = null;

  // Callback to communicate with React
  private onEvent: (event: EngineEvent) => void;

  constructor(onEvent: (event: EngineEvent) => void) {
    this.onEvent = onEvent;
    this.recalculateStats();
  }

  public async init(canvasContainer: HTMLDivElement): Promise<void> {
    this.container = canvasContainer;

    // Create PixiJS Application
    this.app = new Application();
    await this.app.init({
      resizeTo: canvasContainer,
      backgroundAlpha: 0, // transparent to let CSS gradient show through
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    canvasContainer.appendChild(this.app.canvas);

    // Setup layers
    this.app.stage.addChild(this.gameStage);
    this.gameStage.addChild(this.backgroundLayer);
    this.gameStage.addChild(this.entityLayer);
    this.gameStage.addChild(this.effectLayer);

    // Draw arena background lines/glows
    this.drawBackground();

    // Spawn Hero entity (left side)
    this.heroEntity = new Entity('Hero', true, this.heroStats.maxHp);
    this.entityLayer.addChild(this.heroEntity);

    // Initial position layouts
    this.positionEntities();

    // Start battle logic ticker
    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime / 60); // convert deltaTime to approximate seconds
    });

    // Watch resize events
    window.addEventListener('resize', this.handleResize);

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: 'Game engine initialized. Auto battle is ready.',
      category: 'system'
    });
  }

  private handleResize = () => {
    if (this.app) {
      this.drawBackground();
      this.positionEntities();
    }
  };

  private drawBackground() {
    if (!this.app) return;
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.backgroundLayer.clear();

    // Draw simple grid battle platform
    this.backgroundLayer.rect(0, 0, width, height);
    this.backgroundLayer.fill({ color: 0x0f172a, alpha: 0.2 }); // faint overlay

    // Floor line
    const floorY = height * 0.65;
    this.backgroundLayer.moveTo(0, floorY);
    this.backgroundLayer.lineTo(width, floorY);
    this.backgroundLayer.stroke({ color: 0x334155, width: 4 });

    // Grid details for retro vibe
    for (let i = 0; i < width; i += 40) {
      this.backgroundLayer.moveTo(i, floorY);
      this.backgroundLayer.lineTo(i - 20, floorY + 40);
      this.backgroundLayer.stroke({ color: 0x1e293b, width: 1 });
    }
  }

  private positionEntities() {
    if (!this.app) return;
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const floorY = height * 0.65;

    // Hero: Left side
    if (this.heroEntity) {
      this.heroEntity.setBasePosition(width * 0.25, floorY - 32);
      this.heroEntity.resetVisuals();
    }

    // Monster: Right side
    if (this.monsterEntity) {
      this.monsterEntity.setBasePosition(width * 0.75, floorY - 32);
      this.monsterEntity.resetVisuals();
    }
  }

  public updateState(
    level: number,
    prestigePoints: number,
    equippedItems: EquipmentItem[],
    stage: number
  ) {
    this.heroLevel = level;
    this.prestigePoints = prestigePoints;
    this.equippedItems = equippedItems;
    this.currentStage = stage;
    this.recalculateStats();

    if (this.heroEntity) {
      // Keep hero health capped to new max HP if it increased
      if (this.heroCurrentHp > this.heroStats.maxHp) {
        this.heroCurrentHp = this.heroStats.maxHp;
      }
      this.heroEntity.updateStats(this.heroCurrentHp, this.heroStats.maxHp, `Lvl ${this.heroLevel} Hero`);
    }
  }

  private recalculateStats() {
    this.heroStats = recalculateHeroStats(this.heroLevel, this.prestigePoints, this.equippedItems);
  }

  // Load a new battle scene
  public startBattle(monster: MonsterTemplate) {
    this.monsterTemplate = monster;
    this.monsterMaxHp = monster.baseStats.maxHp;
    this.monsterCurrentHp = monster.baseStats.maxHp;

    if (this.monsterEntity) {
      this.entityLayer.removeChild(this.monsterEntity);
    }

    this.monsterEntity = new Entity(`${monster.name} (Lvl ${monster.level})`, false, this.monsterMaxHp);
    this.entityLayer.addChild(this.monsterEntity);
    this.positionEntities();

    this.heroAttackCooldown = 0;
    this.monsterAttackCooldown = 0.5; // slight delay for monster
    this.respawnTimer = 0;
    this.isBattleActive = true;

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `Stage ${this.currentStage}: A wild ${monster.name} appeared!`,
      category: 'system'
    });
  }

  private update(dt: number) {
    if (!this.app) return;

    // Update Entities visually
    if (this.heroEntity) this.heroEntity.update(dt * 60);
    if (this.monsterEntity) this.monsterEntity.update(dt * 60);

    // Update damage numbers
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const text = this.damageTexts[i];
      text.update(dt * 60);
      if (text.isDead()) {
        this.effectLayer.removeChild(text);
        this.damageTexts.splice(i, 1);
        text.destroy();
      }
    }

    // Auto Battle Logic
    if (this.isBattleActive) {
      // 1. Hero combat tick
      this.heroAttackCooldown += dt;
      // Formula: Attack interval is 2 seconds / speed factor.
      // E.g., speed of 100 = 2 seconds, speed of 120 = 1.66s, speed of 200 = 1s.
      const heroAttackInterval = 2.0 / (this.heroStats.speed / 100);
      if (this.heroAttackCooldown >= heroAttackInterval) {
        this.heroAttackCooldown = 0;
        this.executeHeroAttack();
      }

      // 2. Monster combat tick
      if (this.monsterCurrentHp > 0 && this.monsterTemplate) {
        this.monsterAttackCooldown += dt;
        const monsterAttackInterval = 2.5 / (this.monsterTemplate.baseStats.speed / 100);
        if (this.monsterAttackCooldown >= monsterAttackInterval) {
          this.monsterAttackCooldown = 0;
          this.executeMonsterAttack();
        }
      }

      // Trigger regular battle HP sync
      this.onEvent({
        type: 'BATTLE_TICK',
        heroHp: this.heroCurrentHp,
        monsterHp: this.monsterCurrentHp,
        maxHeroHp: this.heroStats.maxHp,
        maxMonsterHp: this.monsterMaxHp
      });

    } else if (this.respawnTimer > 0) {
      // Waiting to respawn next monster
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0 && this.monsterTemplate) {
        this.startBattle(this.monsterTemplate);
      }
    }
  }

  private executeHeroAttack() {
    if (!this.heroEntity || !this.monsterEntity || this.monsterCurrentHp <= 0 || this.heroCurrentHp <= 0) return;

    // Trigger charge forward effect
    this.heroEntity.playAttackAnimation(this.monsterEntity.x);

    // Calculate critical strike
    const isCrit = Math.random() < this.heroStats.critRate;
    let damage = this.heroStats.attack;
    
    // Mitigate damage with defense: NetDmg = Max(1, Attack - Defense)
    const monsterDef = this.monsterTemplate?.baseStats.defense || 0;
    damage = Math.max(1, damage - monsterDef);
    
    if (isCrit) {
      damage = Math.round(damage * this.heroStats.critDamage);
    }

    // Apply damage to monster
    this.monsterCurrentHp = Math.max(0, this.monsterCurrentHp - damage);
    this.monsterEntity.takeDamage(damage);

    // Spawn text particle
    const dmgText = new DamageText(damage.toString(), this.monsterEntity.x, this.monsterEntity.y - 10, isCrit);
    this.effectLayer.addChild(dmgText);
    this.damageTexts.push(dmgText);

    this.onEvent({
      type: 'DAMAGE_DEALT',
      amount: damage,
      isCrit,
      isHeroTarget: false,
      currentHp: this.monsterCurrentHp
    });

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `Hero strikes ${this.monsterTemplate?.name} for ${damage} dmg${isCrit ? ' (CRITICAL!)' : ''}`,
      category: 'combat'
    });

    // Check monster death
    if (this.monsterCurrentHp <= 0) {
      this.isBattleActive = false;
      this.monsterEntity.playDeathAnimation(() => {
        this.handleMonsterDefeated();
      });
    }
  }

  private executeMonsterAttack() {
    if (!this.heroEntity || !this.monsterEntity || this.heroCurrentHp <= 0 || this.monsterCurrentHp <= 0) return;

    // Trigger monster charge forward
    this.monsterEntity.playAttackAnimation(this.heroEntity.x);

    // Calculate damage: NetDmg = Max(1, Attack - Defense)
    const attackVal = this.monsterTemplate?.baseStats.attack || 5;
    const damage = Math.max(1, attackVal - this.heroStats.defense);

    // Apply damage to hero
    this.heroCurrentHp = Math.max(0, this.heroCurrentHp - damage);
    this.heroEntity.takeDamage(damage);

    // Spawn text particle
    const dmgText = new DamageText(damage.toString(), this.heroEntity.x, this.heroEntity.y - 10, false);
    this.effectLayer.addChild(dmgText);
    this.damageTexts.push(dmgText);

    this.onEvent({
      type: 'DAMAGE_DEALT',
      amount: damage,
      isCrit: false,
      isHeroTarget: true,
      currentHp: this.heroCurrentHp
    });

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `${this.monsterTemplate?.name} hits Hero for ${damage} dmg.`,
      category: 'combat'
    });

    // Check hero death
    if (this.heroCurrentHp <= 0) {
      this.isBattleActive = false;
      this.handleHeroDefeated();
    }
  }

  private handleMonsterDefeated() {
    if (!this.monsterTemplate) return;

    // Roll rewards
    const expReward = this.monsterTemplate.expReward;
    const goldMin = this.monsterTemplate.goldRewardRange[0];
    const goldMax = this.monsterTemplate.goldRewardRange[1];
    const goldReward = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
    
    // Rare chance to drop gems (diamonds)
    const diamondReward = Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0;

    // Roll loot drop
    const itemsDropped: any[] = [];
    if (Math.random() < this.monsterTemplate.dropChance && this.monsterTemplate.dropPool.length > 0) {
      const rolledId = this.monsterTemplate.dropPool[Math.floor(Math.random() * this.monsterTemplate.dropPool.length)];
      const template = DEFAULT_ITEM_TEMPLATES.find(t => t.id === rolledId);
      if (template) {
        // Generate scaling level item based on stage
        const itemLvl = Math.max(1, Math.floor(this.currentStage / 8));
        const newItem = createItemInstance(template, itemLvl);
        itemsDropped.push(newItem);
      }
    }

    this.onEvent({
      type: 'MONSTER_DEFEATED',
      exp: expReward,
      gold: goldReward,
      diamonds: diamondReward,
      itemsDropped
    });

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `Defeated ${this.monsterTemplate.name}! Gained ${goldReward} Gold, ${expReward} EXP.`,
      category: 'loot'
    });

    if (itemsDropped.length > 0) {
      this.onEvent({
        type: 'LOG_MESSAGE',
        text: `LOOT FOUND: [${itemsDropped[0].name}] (${itemsDropped[0].rarity})!`,
        category: 'loot'
      });
    }

    // Set timer to respawn next monster after 0.8s
    this.respawnTimer = 0.8;
  }

  private handleHeroDefeated() {
    this.onEvent({
      type: 'LOG_MESSAGE',
      text: 'Hero was defeated! Recovering health...',
      category: 'system'
    });

    this.onEvent({
      type: 'HERO_DEFEATED'
    });

    // Healing phase - 2 seconds respawn/heal
    this.respawnTimeout = setTimeout(() => {
      this.respawnTimeout = null;
      this.heroCurrentHp = this.heroStats.maxHp;
      if (this.heroEntity) {
        this.heroEntity.updateStats(this.heroCurrentHp, this.heroStats.maxHp);
        this.heroEntity.resetVisuals();
      }
      
      // Stage backdown: if hero dies, downstage by 1 (minimum Stage 1)
      const penaltyStage = Math.max(1, this.currentStage - 1);
      if (penaltyStage !== this.currentStage) {
        this.onEvent({
          type: 'STAGE_ADVANCED',
          nextStage: penaltyStage
        });
      } else {
        // Just restart the current battle
        if (this.monsterTemplate) {
          this.startBattle(this.monsterTemplate);
        }
      }
    }, 2000);
  }

  public forceHealHero() {
    this.heroCurrentHp = this.heroStats.maxHp;
    if (this.heroEntity) {
      this.heroEntity.updateStats(this.heroCurrentHp, this.heroStats.maxHp);
    }
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    
    if (this.respawnTimeout) {
      clearTimeout(this.respawnTimeout);
      this.respawnTimeout = null;
    }
    
    // Destroy Pixi app
    if (this.app) {
      // In PixiJS v8, destroy takes options object
      this.app.destroy({ removeView: true });
      this.app = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
