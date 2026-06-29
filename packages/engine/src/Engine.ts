import { Application, Container, Graphics } from 'pixi.js';
import { BaseStats, MonsterTemplate, EquipmentItem } from '@idle-rpg/shared';
import { recalculateHeroStats, DEFAULT_ITEM_TEMPLATES, createItemInstance } from '@idle-rpg/shared';
import { Entity } from './entities/Entity';
import { DamageText } from './effects/DamageText';

export type EngineEvent =
  | { type: 'DAMAGE_DEALT'; amount: number; isCrit: boolean; isHeroTarget: boolean; currentHp: number }
  | { type: 'MONSTER_DEFEATED'; exp: number; gold: number; diamonds: number; itemsDropped: any[] }
  | { type: 'HERO_DEFEATED' }
  | { type: 'BATTLE_TICK'; heroHp: number; monsterHp: number; maxHeroHp: number; maxMonsterHp: number; heroRage: number; monsterRage: number }
  | { type: 'STAGE_ADVANCED'; nextStage: number }
  | { type: 'GUILD_RAID_ENDED' }
  | { type: 'LOG_MESSAGE'; text: string; category: 'combat' | 'loot' | 'system' };

export interface ActiveMonster {
  template: MonsterTemplate;
  currentHp: number;
  maxHp: number;
  entity: Entity;
  rage: number;
  attackCooldown: number;
}

export interface ActiveAlly {
  entity: Entity;
  heroClass: 'knight' | 'mage' | 'assassin';
  name: string;
  maxHp: number;
  currentHp: number;
  rage: number;
  attackCooldown: number;
}

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
  private allyEntities: ActiveAlly[] = [];
  private activeMonsters: ActiveMonster[] = [];
  private battleMode: 'stage' | 'guild_boss' = 'stage';

  // Effects
  private damageTexts: DamageText[] = [];

  // Configured states passed from React Store
  private heroLevel: number = 1;
  private prestigePoints: number = 0;
  private equippedItems: EquipmentItem[] = [];
  private heroStats!: BaseStats;
  private heroCurrentHp: number = 100;
  private heroClass: 'knight' | 'mage' | 'assassin' = 'knight';

  private currentStage: number = 1;
  private monsterTemplate: MonsterTemplate | null = null;
  private heroRage: number = 0;

  // Timers (in seconds)
  private isBattleActive: boolean = false;
  private respawnTimer: number = 0;
  private respawnTimeout: any = null;
  private isDestroyed: boolean = false;

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

    if (this.isDestroyed) {
      try {
        this.app.destroy({ removeView: true });
      } catch (e) {}
      this.app = null;
      return;
    }

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

    this.allyEntities = [{
      entity: this.heroEntity,
      heroClass: this.heroClass,
      name: 'Hero',
      maxHp: this.heroStats.maxHp,
      currentHp: this.heroCurrentHp,
      rage: this.heroRage,
      attackCooldown: 0
    }];

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

    if (this.battleMode === 'guild_boss') {
      // 4 Heroes: Staggered 2D Formation Layout with mobile-safe fixed pixel offsets
      const baseX = Math.max(160, width * 0.32);
      const baseY = floorY - 20;

      this.allyEntities.forEach((ally, idx) => {
        let x = baseX;
        let y = baseY;

        if (idx === 0) {
          // User Hero: Front-center
          x = baseX;
          y = baseY;
        } else if (idx === 1) {
          // Ally Knight: Back-top
          x = baseX - 85;
          y = baseY - 45;
        } else if (idx === 2) {
          // Ally Mage: Back-center
          x = baseX - 110;
          y = baseY;
        } else if (idx === 3) {
          // Ally Assassin: Back-bottom
          x = baseX - 70;
          y = baseY + 45;
        }

        ally.entity.setBasePosition(x, y);
        ally.entity.resetVisuals();
        ally.entity.updateStats(ally.currentHp, ally.maxHp, undefined, ally.rage, ally.heroClass);
      });
    } else {
      // Normal Stage: Single Hero
      if (this.heroEntity) {
        this.heroEntity.setBasePosition(width * 0.25, floorY - 32);
        this.heroEntity.resetVisuals();
        this.heroEntity.updateStats(this.heroCurrentHp, this.heroStats.maxHp, undefined, this.heroRage, this.heroClass);
      }
    }

    // Monsters/Boss: Right side
    const count = this.activeMonsters.length;
    this.activeMonsters.forEach((m, idx) => {
      let offsetFactor = 0.75;
      if (count === 2) {
        offsetFactor = idx === 0 ? 0.70 : 0.82;
      } else if (count === 3) {
        offsetFactor = idx === 0 ? 0.65 : idx === 1 ? 0.76 : 0.87;
      }
      
      m.entity.setBasePosition(width * offsetFactor, floorY - 32);
      m.entity.resetVisuals();
      
      // Giant scale if Raid Boss
      const lowerName = m.template.name.toLowerCase();
      const isBoss = lowerName.includes('behemoth') || lowerName.includes('boss') || lowerName.includes('king');
      if (isBoss) {
        m.entity.scale.set(2.2); // giant raid boss size
      } else {
        m.entity.scale.set(1.0);
      }
      
      m.entity.updateStats(m.currentHp, m.maxHp, undefined, m.rage);
    });
  }

  public updateState(
    level: number,
    prestigePoints: number,
    equippedItems: EquipmentItem[],
    stage: number,
    heroClass?: 'knight' | 'mage' | 'assassin'
  ) {
    this.heroLevel = level;
    this.prestigePoints = prestigePoints;
    this.equippedItems = equippedItems;
    this.currentStage = stage;
    if (heroClass) {
      this.heroClass = heroClass;
    }
    this.recalculateStats();

    if (this.heroEntity) {
      // Keep hero health capped to new max HP if it increased
      if (this.heroCurrentHp > this.heroStats.maxHp) {
        this.heroCurrentHp = this.heroStats.maxHp;
      }
      this.heroEntity.updateStats(this.heroCurrentHp, this.heroStats.maxHp, `Lvl ${this.heroLevel} Hero`, this.heroRage, this.heroClass);

      if (this.allyEntities[0]) {
        this.allyEntities[0].heroClass = this.heroClass;
        this.allyEntities[0].maxHp = this.heroStats.maxHp;
        this.allyEntities[0].currentHp = this.heroCurrentHp;
      }
    }
  }

  private recalculateStats() {
    this.heroStats = recalculateHeroStats(this.heroLevel, this.prestigePoints, this.equippedItems, this.heroClass);
  }

  // Load a new battle scene
  public startBattle(monster: MonsterTemplate) {
    this.monsterTemplate = monster;
    this.battleMode = 'stage';
    
    // Clear previous monster entities
    this.activeMonsters.forEach(m => {
      this.entityLayer.removeChild(m.entity);
      m.entity.destroy();
    });
    this.activeMonsters = [];

    // Decide count: Boss stage (multiples of 5) = 1 boss. Otherwise:
    // Stage 1-2: 1 monster
    // Stage 3-4: 1-2 monsters
    // Stage 5+: 1-3 monsters
    let count = 1;
    const lowerName = monster.name.toLowerCase();
    const isBoss = this.currentStage % 5 === 0 || lowerName.includes('king') || lowerName.includes('chúa') || lowerName.includes('vương');
    
    if (!isBoss) {
      if (this.currentStage >= 5) {
        count = Math.floor(Math.random() * 3) + 1; // 1 to 3
      } else if (this.currentStage >= 3) {
        count = Math.random() < 0.5 ? 1 : 2; // 1 to 2
      }
    }

    // Spawn monsters
    for (let i = 0; i < count; i++) {
      const template: MonsterTemplate = {
        ...monster,
        id: `${monster.id}_${i}`,
        name: count > 1 ? `${monster.name} ${String.fromCharCode(65 + i)}` : monster.name
      };

      const entity = new Entity(`${template.name} (Lvl ${template.level})`, false, template.baseStats.maxHp);
      this.entityLayer.addChild(entity);

      this.activeMonsters.push({
        template,
        currentHp: template.baseStats.maxHp,
        maxHp: template.baseStats.maxHp,
        entity,
        rage: 0,
        attackCooldown: 0.4 * i // stagger starting attacks
      });
    }

    this.positionEntities();

    this.respawnTimer = 0;
    this.isBattleActive = true;

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `Stage ${this.currentStage}: A wave of ${count} ${monster.name}(s) appeared!`,
      category: 'system'
    });
  }

  public startGuildRaid(
    bossTemplate: MonsterTemplate,
    guildMembers: Array<{ name: string; heroClass: 'knight' | 'mage' | 'assassin'; level: number }>
  ) {
    this.battleMode = 'guild_boss';
    
    // Clear all existing entities from layer
    this.entityLayer.removeChildren();

    // 1. Re-spawn user hero as first ally
    this.heroEntity = new Entity(`Lv.${this.heroLevel} ${guildMembers[0].name}`, true, this.heroStats.maxHp);
    this.entityLayer.addChild(this.heroEntity);

    this.allyEntities = [];
    this.allyEntities.push({
      entity: this.heroEntity,
      heroClass: this.heroClass,
      name: guildMembers[0].name,
      maxHp: this.heroStats.maxHp,
      currentHp: this.heroStats.maxHp,
      rage: this.heroRage,
      attackCooldown: 0
    });

    // 2. Set up Guild Member allies
    for (let i = 1; i < guildMembers.length; i++) {
      const mem = guildMembers[i];
      let baseHp = 100 + (mem.level - 1) * 15;
      if (mem.heroClass === 'knight') baseHp = 120 + (mem.level - 1) * 18;
      else if (mem.heroClass === 'mage') baseHp = 85 + (mem.level - 1) * 12;
      else if (mem.heroClass === 'assassin') baseHp = 90 + (mem.level - 1) * 13;

      const allyEntity = new Entity(`Lv.${mem.level} ${mem.name}`, true, baseHp);
      this.entityLayer.addChild(allyEntity);

      this.allyEntities.push({
        entity: allyEntity,
        heroClass: mem.heroClass,
        name: mem.name,
        maxHp: baseHp,
        currentHp: baseHp,
        rage: 0,
        attackCooldown: 0.5 * i // stagger starting attacks
      });
    }

    // 3. Clear normal monsters
    this.activeMonsters = [];

    // 4. Set up Giant Raid Boss
    const bossEntity = new Entity(`${bossTemplate.name}`, false, bossTemplate.baseStats.maxHp);
    this.entityLayer.addChild(bossEntity);

    this.activeMonsters.push({
      template: bossTemplate,
      currentHp: bossTemplate.baseStats.maxHp,
      maxHp: bossTemplate.baseStats.maxHp,
      entity: bossEntity,
      rage: 0,
      attackCooldown: 1.0
    });

    this.positionEntities();
    this.respawnTimer = 0;
    this.isBattleActive = true;

    this.onEvent({
      type: 'LOG_MESSAGE',
      text: `🔥 BOSS CẬN CHIẾN: Void Behemoth thức tỉnh! Toàn bộ bang hội vào vị trí!`,
      category: 'system'
    });
  }

  public exitGuildRaid() {
    this.battleMode = 'stage';

    // Clear entities
    this.entityLayer.removeChildren();

    // Restore single player Hero
    this.heroEntity = new Entity('Hero', true, this.heroStats.maxHp);
    this.entityLayer.addChild(this.heroEntity);

    // Fully restore normal stage health and rage
    this.heroCurrentHp = this.heroStats.maxHp;
    this.heroRage = 0;

    this.allyEntities = [{
      entity: this.heroEntity,
      heroClass: this.heroClass,
      name: 'Hero',
      maxHp: this.heroStats.maxHp,
      currentHp: this.heroCurrentHp,
      rage: this.heroRage,
      attackCooldown: 0
    }];

    this.activeMonsters = [];
    this.isBattleActive = false;

    // Notify React store to shift states
    this.onEvent({
      type: 'GUILD_RAID_ENDED'
    });

    // Start progressive stage battle again
    if (this.monsterTemplate) {
      this.startBattle(this.monsterTemplate);
    }
  }

  private update(dt: number) {
    if (!this.app) return;

    // Update Entities visually
    this.allyEntities.forEach(a => a.entity.update(dt * 60));
    this.activeMonsters.forEach(m => m.entity.update(dt * 60));

    // Sync health and rage values visually every tick
    this.allyEntities.forEach(a => {
      a.entity.updateStats(a.currentHp, a.maxHp, undefined, a.rage, a.heroClass);
    });
    this.activeMonsters.forEach(m => {
      m.entity.updateStats(m.currentHp, m.maxHp, undefined, m.rage);
    });

    // Sync user stats mapping from index 0
    if (this.allyEntities[0]) {
      this.heroCurrentHp = this.allyEntities[0].currentHp;
      this.heroRage = this.allyEntities[0].rage;
    }

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
      // 1. Allies combat tick
      this.allyEntities.forEach(ally => {
        if (ally.currentHp > 0) {
          ally.attackCooldown += dt;
          
          let speedVal = 100;
          if (ally === this.allyEntities[0]) {
            speedVal = this.heroStats.speed;
          } else {
            speedVal = ally.heroClass === 'knight' ? 95 : ally.heroClass === 'mage' ? 100 : 125;
          }
          
          const attackInterval = 2.0 / (speedVal / 100);
          if (ally.attackCooldown >= attackInterval) {
            ally.attackCooldown = 0;
            this.executeAllyAttack(ally);
          }
        }
      });

      // 2. Monsters combat tick
      this.activeMonsters.forEach(m => {
        if (m.currentHp > 0) {
          m.attackCooldown += dt;
          const monsterAttackInterval = 2.5 / (m.template.baseStats.speed / 100);
          if (m.attackCooldown >= monsterAttackInterval) {
            m.attackCooldown = 0;
            this.executeMonsterAttack(m);
          }
        }
      });

      // Trigger regular battle HP and stats sync
      const aliveMonsters = this.activeMonsters.filter(m => m.currentHp > 0);
      const totalMonsterHp = aliveMonsters.reduce((sum: number, m: ActiveMonster) => sum + m.currentHp, 0);
      const totalMonsterMaxHp = this.activeMonsters.reduce((sum: number, m: ActiveMonster) => sum + m.maxHp, 0);
      const activeMonsterRage = aliveMonsters[0]?.rage || 0;

      const totalHeroHp = this.allyEntities.reduce((sum: number, a: ActiveAlly) => sum + a.currentHp, 0);
      const totalMaxHeroHp = this.allyEntities.reduce((sum: number, a: ActiveAlly) => sum + a.maxHp, 0);
      const userRage = this.allyEntities[0]?.rage || 0;

      this.onEvent({
        type: 'BATTLE_TICK',
        heroHp: totalHeroHp,
        monsterHp: totalMonsterHp,
        maxHeroHp: totalMaxHeroHp,
        maxMonsterHp: totalMonsterMaxHp,
        heroRage: userRage,
        monsterRage: activeMonsterRage
      });

    } else if (this.respawnTimer > 0) {
      // Waiting to respawn next wave
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        if (this.battleMode === 'guild_boss') {
          this.exitGuildRaid();
        } else if (this.monsterTemplate) {
          this.startBattle(this.monsterTemplate);
        }
      }
    }
  }

  private executeAllyAttack(attacker: ActiveAlly) {
    if (attacker.currentHp <= 0) return;

    // Find first alive target
    const target = this.activeMonsters.find(m => m.currentHp > 0);
    if (!target) return;

    const isUlt = attacker.rage >= 100;
    const width = this.app?.screen.width || 800;

    // Trigger charge forward attack animation
    if (isUlt && (attacker.heroClass === 'knight' || attacker.heroClass === 'mage')) {
      // AOE Leap to center of battlefield
      attacker.entity.playAttackAnimation(width * 0.45);
    } else {
      // Single target slash
      attacker.entity.playAttackAnimation(target.entity.x);
    }

    // Trigger screen shake on ultimate
    if (isUlt) {
      let shakeCount = 10;
      const shake = () => {
        if (shakeCount > 0 && this.gameStage) {
          this.gameStage.x = (Math.random() - 0.5) * 12;
          this.gameStage.y = (Math.random() - 0.5) * 12;
          shakeCount--;
          requestAnimationFrame(shake);
        } else if (this.gameStage) {
          this.gameStage.x = 0;
          this.gameStage.y = 0;
        }
      };
      shake();
    }

    if (isUlt) {
      attacker.rage = 0; // reset rage

      if (attacker.heroClass === 'knight' || attacker.heroClass === 'mage') {
        // --- AOE Ultimate strikes all alive monsters ---
        const mult = attacker.heroClass === 'mage' ? 3.0 : 2.0;
        const skillName = attacker.heroClass === 'mage' ? 'METEOR STORM' : 'AETHER STRIKE';
        let totalDamageDealt = 0;

        this.activeMonsters.forEach(m => {
          if (m.currentHp <= 0) return;

          let atkVal = attacker === this.allyEntities[0] ? this.heroStats.attack : 10;
          if (attacker !== this.allyEntities[0]) {
            atkVal = attacker.heroClass === 'mage' ? 14 : 8;
          }

          let dmg = Math.round(atkVal * mult);
          dmg = Math.max(1, dmg - m.template.baseStats.defense);
          
          m.currentHp = Math.max(0, m.currentHp - dmg);
          m.entity.takeDamage(dmg);
          totalDamageDealt += dmg;

          // Spawn damage text particle
          const dmgText = new DamageText(`★ ${dmg} ★`, m.entity.x, m.entity.y - 10, true);
          this.effectLayer.addChild(dmgText);
          this.damageTexts.push(dmgText);

          this.onEvent({
            type: 'DAMAGE_DEALT',
            amount: dmg,
            isCrit: true,
            isHeroTarget: false,
            currentHp: m.currentHp
          });
        });

        this.onEvent({
          type: 'LOG_MESSAGE',
          text: `${attacker.name} unleashes ultimate [${skillName}] on enemies for ${totalDamageDealt} damage!`,
          category: 'combat'
        });
      } else {
        // --- Assassin single target massive ultimate: 5.0x ---
        let atkVal = attacker === this.allyEntities[0] ? this.heroStats.attack : 11;
        let dmg = Math.round(atkVal * 5.0);
        dmg = Math.max(1, dmg - target.template.baseStats.defense);

        target.currentHp = Math.max(0, target.currentHp - dmg);
        target.entity.takeDamage(dmg);

        const dmgText = new DamageText(`★ ${dmg} ★`, target.entity.x, target.entity.y - 10, true);
        this.effectLayer.addChild(dmgText);
        this.damageTexts.push(dmgText);

        this.onEvent({
          type: 'DAMAGE_DEALT',
          amount: dmg,
          isCrit: true,
          isHeroTarget: false,
          currentHp: target.currentHp
        });

        this.onEvent({
          type: 'LOG_MESSAGE',
          text: `${attacker.name} unleashes ultimate [SHADOW STRIKE] on ${target.template.name} for ${dmg} damage!`,
          category: 'combat'
        });
      }
    } else {
      // --- Regular single target attack ---
      let critRate = attacker === this.allyEntities[0] ? this.heroStats.critRate : 0.05;
      let critDamage = attacker === this.allyEntities[0] ? this.heroStats.critDamage : 1.5;
      let atkVal = attacker === this.allyEntities[0] ? this.heroStats.attack : 10;

      if (attacker !== this.allyEntities[0]) {
        critRate = attacker.heroClass === 'assassin' ? 0.15 : attacker.heroClass === 'mage' ? 0.08 : 0.05;
        critDamage = attacker.heroClass === 'assassin' ? 1.8 : attacker.heroClass === 'mage' ? 1.7 : 1.5;
        atkVal = attacker.heroClass === 'mage' ? 14 : attacker.heroClass === 'assassin' ? 11 : 8;
      }

      const isCrit = Math.random() < critRate;
      let dmg = atkVal;
      dmg = Math.max(1, dmg - target.template.baseStats.defense);
      if (isCrit) {
        dmg = Math.round(dmg * critDamage);
      }

      target.currentHp = Math.max(0, target.currentHp - dmg);
      target.entity.takeDamage(dmg);

      // Spawn text particle
      const dmgText = new DamageText(dmg.toString(), target.entity.x, target.entity.y - 10, isCrit);
      this.effectLayer.addChild(dmgText);
      this.damageTexts.push(dmgText);

      attacker.rage = Math.min(100, attacker.rage + 20);
      target.rage = Math.min(100, target.rage + 10);

      this.onEvent({
        type: 'DAMAGE_DEALT',
        amount: dmg,
        isCrit,
        isHeroTarget: false,
        currentHp: target.currentHp
      });

      this.onEvent({
        type: 'LOG_MESSAGE',
        text: `${attacker.name} strikes ${target.template.name} for ${dmg} dmg${isCrit ? ' (CRITICAL!)' : ''}`,
        category: 'combat'
      });
    }

    // Check monster deaths & animate
    const anyMonsterDied = this.activeMonsters.some(m => m.currentHp <= 0 && m.entity.visible);
    if (anyMonsterDied) {
      this.activeMonsters.forEach(m => {
        if (m.currentHp <= 0 && m.entity.visible) {
          // Play death and hide
          m.entity.playDeathAnimation(() => {
            m.entity.visible = false;
          });
        }
      });

      // Check if wave cleared
      const allDead = this.activeMonsters.every(m => m.currentHp <= 0);
      if (allDead) {
        this.isBattleActive = false;
        // Wait briefly for death animations before triggering defeat rewards
        setTimeout(() => {
          this.handleMonsterDefeated();
        }, 600);
      }
    }
  }

  private executeMonsterAttack(attacker: ActiveMonster) {
    // Find alive targets
    const aliveAllies = this.allyEntities.filter(a => a.currentHp > 0);
    if (aliveAllies.length === 0 || attacker.currentHp <= 0) return;

    // Pick target: front-most alive ally (which is closest to index 0)
    const target = aliveAllies[0];

    // Trigger monster charge forward
    attacker.entity.playAttackAnimation(target.entity.x);

    // Calculate damage
    const attackVal = attacker.template.baseStats.attack;
    let defVal = target === this.allyEntities[0] ? this.heroStats.defense : 5;
    if (target !== this.allyEntities[0]) {
      defVal = target.heroClass === 'knight' ? 8 : target.heroClass === 'assassin' ? 4 : 3;
    }

    let damage = Math.max(1, attackVal - defVal);

    // Ultimate skill check
    const isUlt = attacker.rage >= 100;
    let skillName = 'JELLY BUBBLE';

    if (this.battleMode === 'guild_boss') {
      // --- RAID BOSS COMBAT LOOP ---
      if (isUlt) {
        // Boss Ultimate: Apocalypse deals team-wide AOE
        skillName = 'VOID APOCALYPSE';
        let totalDmg = 0;

        aliveAllies.forEach(ally => {
          let allyDef = ally === this.allyEntities[0] ? this.heroStats.defense : 5;
          if (ally !== this.allyEntities[0]) {
            allyDef = ally.heroClass === 'knight' ? 8 : ally.heroClass === 'assassin' ? 4 : 3;
          }
          let allyDmg = Math.round(attackVal * 2.2);
          allyDmg = Math.max(1, allyDmg - allyDef);

          ally.currentHp = Math.max(0, ally.currentHp - allyDmg);
          ally.entity.takeDamage(allyDmg);
          totalDmg += allyDmg;

          // Particle
          const dmgText = new DamageText(`💀 ${allyDmg}`, ally.entity.x, ally.entity.y - 10, true);
          this.effectLayer.addChild(dmgText);
          this.damageTexts.push(dmgText);

          ally.rage = Math.min(100, ally.rage + 10);
        });

        this.onEvent({
          type: 'LOG_MESSAGE',
          text: `💥 ${attacker.template.name} unleashes [${skillName}] on the team for ${totalDmg} total damage!`,
          category: 'combat'
        });

        attacker.rage = 0;
      } else {
        // Regular Boss Attack: tail sweep hitting the target ally
        damage = Math.round(damage * 1.1);
        target.currentHp = Math.max(0, target.currentHp - damage);
        target.entity.takeDamage(damage);

        const dmgText = new DamageText(damage.toString(), target.entity.x, target.entity.y - 10, false);
        this.effectLayer.addChild(dmgText);
        this.damageTexts.push(dmgText);

        target.rage = Math.min(100, target.rage + 15);
        attacker.rage = Math.min(100, attacker.rage + 20);

        this.onEvent({
          type: 'LOG_MESSAGE',
          text: `${attacker.template.name} sweeps tail hitting ${target.name} for ${damage} dmg.`,
          category: 'combat'
        });
      }
    } else {
      // --- NORMAL STAGE COMBAT LOOP ---
      if (isUlt) {
        const lowerName = attacker.template.name.toLowerCase();
        
        if (lowerName.includes('đá') || lowerName.includes('stone') || lowerName.includes('sắt')) {
          skillName = 'STONE ARMOR';
          damage = Math.round(damage * 1.2);
          attacker.entity.tint = 0xf59e0b; // barrier glow
        } else if (lowerName.includes('lửa') || lowerName.includes('fire') || lowerName.includes('quỷ')) {
          skillName = 'FIRE BLAST';
          damage = Math.round(damage * 2.0);
        } else if (lowerName.includes('băng') || lowerName.includes('ice') || lowerName.includes('nước')) {
          skillName = 'FROSTBITE';
          damage = Math.round(damage * 1.2);
          // Cooldown slow penalty
          const heroAttackInterval = 2.0 / (this.heroStats.speed / 100);
          target.attackCooldown = -heroAttackInterval * 0.5;
        } else if (lowerName.includes('king') || lowerName.includes('chúa') || lowerName.includes('vương')) {
          skillName = 'KINGS SLAM';
          damage = Math.round(damage * 2.0);
          
          let shakeCount = 6;
          const shake = () => {
            if (shakeCount > 0 && this.gameStage) {
              this.gameStage.x = (Math.random() - 0.5) * 6;
              this.gameStage.y = (Math.random() - 0.5) * 6;
              shakeCount--;
              requestAnimationFrame(shake);
            } else if (this.gameStage) {
              this.gameStage.x = 0;
              this.gameStage.y = 0;
            }
          };
          shake();
        } else {
          skillName = 'JELLY BUBBLE';
          damage = Math.round(damage * 1.5);
        }

        attacker.rage = 0; // reset rage
      } else {
        attacker.rage = Math.min(100, attacker.rage + 20);
      }

      target.rage = Math.min(100, target.rage + 10);

      // Apply damage to hero
      target.currentHp = Math.max(0, target.currentHp - damage);
      target.entity.takeDamage(damage);

      // Spawn damage text particle
      const dmgText = new DamageText(
        isUlt ? `💀 ${damage}` : damage.toString(), 
        target.entity.x, 
        target.entity.y - 10, 
        isUlt
      );
      this.effectLayer.addChild(dmgText);
      this.damageTexts.push(dmgText);

      this.onEvent({
        type: 'DAMAGE_DEALT',
        amount: damage,
        isCrit: isUlt,
        isHeroTarget: true,
        currentHp: target.currentHp
      });

      this.onEvent({
        type: 'LOG_MESSAGE',
        text: isUlt
          ? `${attacker.template.name} casts ultimate [${skillName}] on Hero for ${damage} damage!`
          : `${attacker.template.name} hits Hero for ${damage} dmg.`,
        category: 'combat'
      });
    }

    // Check hero death
    const allAlliesDead = this.allyEntities.every(a => a.currentHp <= 0);
    if (allAlliesDead) {
      this.isBattleActive = false;
      this.handleHeroDefeated();
    }
  }

  private handleMonsterDefeated() {
    let totalExp = 0;
    let totalGold = 0;
    let totalDiamonds = 0;
    let itemsDropped: any[] = [];

    this.activeMonsters.forEach(m => {
      totalExp += m.template.expReward;
      const goldMin = m.template.goldRewardRange[0];
      const goldMax = m.template.goldRewardRange[1];
      totalGold += Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;
      totalDiamonds += Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0;

      // Drop roll
      if (Math.random() < m.template.dropChance && m.template.dropPool.length > 0) {
        const rolledId = m.template.dropPool[Math.floor(Math.random() * m.template.dropPool.length)];
        const template = DEFAULT_ITEM_TEMPLATES.find(t => t.id === rolledId);
        if (template) {
          const itemLvl = Math.max(1, Math.floor(this.currentStage / 8));
          const newItem = createItemInstance(template, itemLvl);
          itemsDropped.push(newItem);
        }
      }
    });

    if (this.battleMode === 'guild_boss') {
      // Double rewards for guild boss!
      totalGold = totalGold * 5;
      totalExp = totalExp * 5;
      totalDiamonds = totalDiamonds + 10;
    }

    this.onEvent({
      type: 'MONSTER_DEFEATED',
      exp: totalExp,
      gold: totalGold,
      diamonds: totalDiamonds,
      itemsDropped
    });

    const names = this.activeMonsters.map(m => m.template.name).join(', ');
    this.onEvent({
      type: 'LOG_MESSAGE',
      text: this.battleMode === 'guild_boss'
        ? `🎉 GIỜ VÀNG: Tiêu diệt thành công Raid Boss [Void Behemoth]! Nhận thêm thưởng lớn: ${totalGold} Vàng, ${totalExp} EXP, 10 Diamonds!`
        : `Defeated wave [${names}]! Gained ${totalGold} Gold, ${totalExp} EXP.`,
      category: 'loot'
    });

    if (itemsDropped.length > 0) {
      itemsDropped.forEach(item => {
        this.onEvent({
          type: 'LOG_MESSAGE',
          text: `LOOT FOUND: [${item.name}] (${item.rarity})!`,
          category: 'loot'
        });
      });
    }

    this.respawnTimer = 1.2;
  }

  private handleHeroDefeated() {
    if (this.battleMode === 'guild_boss') {
      this.onEvent({
        type: 'LOG_MESSAGE',
        text: '☠️ Đội hình Guild đã thất bại trước Void Behemoth! Quay lại ải tự động...',
        category: 'system'
      });

      // Exit raid automatically after 2s
      this.respawnTimeout = setTimeout(() => {
        this.respawnTimeout = null;
        this.exitGuildRaid();
      }, 2000);
      return;
    }

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
    this.isDestroyed = true;
    window.removeEventListener('resize', this.handleResize);
    
    if (this.respawnTimeout) {
      clearTimeout(this.respawnTimeout);
      this.respawnTimeout = null;
    }
    
    // Destroy Pixi app safely
    if (this.app) {
      try {
        // In PixiJS v8, destroy takes options object
        this.app.destroy({ removeView: true });
      } catch (err) {
        console.warn("Failed to destroy PixiJS App safely:", err);
      }
      this.app = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
