# ⚔️ Idle RPG Web ⚔️

> A premium, modern browser-based Idle RPG built with React 19, TypeScript, PixiJS, Zustand, and Firebase. Featuring real-time combat, equipment forging, summoning, dungeons, guild features, and daily-limited package mechanics.

---

## 🎯 Project Vision

**Idle RPG Web** is designed for thousands of hours of gameplay, featuring a decoupled game engine, state-of-the-art visual styling, and a live config-driven model synchronized with Firebase backend databases.

- **Endless Auto-Battle:** Hero defeats monsters, levels up, and climbs stage difficulties automatically, even offline.
- **Deep Progression:** Gear quality scales from Common to Legendary, featuring random affixes, upgrade levels, and attribute gem sockets.
- **Ascension & Prestige:** Ascend to reset level and stage in exchange for Prestige Points, unlocking permanent multiplier bonuses.
- **Config-Driven Assets:** Monster scaling, item drops, quests, and summon rates are configurable dynamically from database states without redeployments.

---

## 🔁 Core Gameplay Loop

```
                     ┌──────────────────┐
                     │    User Login    │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │  Offline Reward  │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │ Auto-Battle Loop │◄────────────────┐
                     └────────┬─────────┘                 │
                              │                           │
            ┌─────────────────┴─────────────────┐         │
            ▼                                   ▼         │
   ┌─────────────────┐                 ┌────────────────┐ │
   │  Defeat Monster │                 │  Defeat Boss   │ │
   └────────┬────────┘                 └────────┬───────┘ │
            │                                   │         │
   ┌────────▼────────┐                 ┌────────▼───────┐ │
   │ Gold, EXP, Loot │                 │ Progress Stage │ │
   └────────┬────────┘                 └────────┬───────┘ │
            │                                   │         │
   ┌────────▼────────┐                 ┌────────▼───────┐ │
   │ Inventory & Bag │                 │ Ascension (CP) │ │
   └────────┬────────┘                 └────────┬───────┘ │
            │                                   │         │
   ┌────────▼────────┐                          │         │
   │ Forge / Gems    ├──────────────────────────┘         │
   └─────────────────┘                                    │
            │                                             │
            └─────────────────────────────────────────────┘
```

---

## ✨ Key Features & Implementation Specifications

### 🛡️ 1. Action Bar & Booster Shortcuts
- **Flexible Setup:** Drag, drop, and equip consumables (Health Potions, Speed Elixirs, EXP Charms) into any of the 7 shortcut slots.
- **Edit Mode:** Toggle edit mode using a floating action button. Remove items with absolute-positioned delete buttons (`top-[-3px] right-[-3px]`) or tap empty slots to open the inventory selection modal.
- **Circular SVG Cooldown:** Real-time countdown clock rendered using vector circles with dynamic SVG `strokeDashoffset` properties.
- **Depleted Visual State:** Display items with `0` quantity using grayscale filters, high opacity reduction, and a red cross-out SVG vector indicator.
- **Pulsing Halo Glow:** Ready-to-use active items pulse with custom color halos to match their rarity grades.

### 🛒 2. Shop & Daily limits System
- **Unified Card Layout:** Clean vertical alignment of buttons to prevent overlapping labels and overflow issues on small viewport screens.
- **Bulk Buying Modal:** Offers custom quantity adjustment sliders, text inputs, and quick presets (`10`, `20`, `50`, `100`). Checks balance dynamically to lock checkout buttons.
- **Unified Counter Limits:** Merges bulk and single item checks to utilize a unified limit key (e.g. `potion_30`) to simplify backend operations.
- **Daily Quotas:** High-value discount packs (saving 5%-20%) are capped at a maximum of 100 purchases per day. The limit count (e.g. `Còn: 100/100`) is displayed on the top right of the transaction button.
- **Aesthetic Ordering:** Places the primary transaction button (`h-10`) at the bottom of the card and the smaller bulk purchase button (`h-8`, exactly 80% height of the main button) above it, wrapped in a glowing pulsing border.

### 🔨 3. Forge & Gem Sockets
- **Attribute Gem Fusion:** Merge 3 gems of the same tier to progress to the next level. Fusing rates decrease as gem tiers increase (100% / 50% / 10% / 1%).
- **Item Dismantling:** Recycle unwanted rare items for Aether Shards. Yields are calculated dynamically, scaling with item level and monster kill counters.
- **Socket Inscription:** Equip gems into equipment sockets to apply direct, flat base attribute bonuses.

### 📊 4. Combat Stats & formulas
- **Combat Power (CP):** Weighted formula checking attack speed, critical multiplier, spell vamp, life steal, block rate, gear rarity bonuses, and slotted gems:
  $$\text{Item CP} = \text{ATK} \times 6 + \text{M.ATK} \times 6 + \text{HP} \times 0.5 + \text{DEF} \times 4 + \text{M.RES} \times 4 + \text{SPD} \times 5 + \text{CRIT\%} \times 15 + \text{Lifesteal\%} \times 10 + \text{Gems} \times 100$$
- **Monster Scaling:** Attributes and drops multiply exponentially based on the active stage:
  $$\text{Max HP} = \text{Round}\left(120 \times 1.15^{\text{Level} - 1} \times \text{Species Mult} \times \text{Rank Mult}\right)$$
- **Combat Feed:** Live logger sorting messages into categories (All / Combat / Loot) with custom highlighting.

---

## 🛠️ Tech Stack

- **Core Framework:** React 19, TypeScript, Vite
- **Rendering Engine:** PixiJS (high-performance canvas webgl rendering loop)
- **State Management:** Zustand (decoupled from UI render thread)
- **CSS Styling:** Vanilla CSS + TailwindCSS (premium dark mode, glassmorphism, pulse micro-animations)
- **Database Backend:** Firebase Authentication, Realtime Database, Firestore
- **Deployment Platform:** Vercel

---

## 📁 Repository Structure

```
idle-rpg/
├── apps/
│   └── web/                   # Vite React SPA App
│       ├── src/
│       │   ├── components/    # UI Modals & Page Layouts
│       │   │   └── tabs/      # Feature panels (Shop, Hero, Bag, Summon)
│       │   ├── stores/        # Zustand global store files
│       │   └── index.css      # Core style declarations
│       └── public/            # Game asset sheets & audio files
├── packages/
│   ├── shared/                # Core algorithms, database definitions, and formulas
│   ├── engine/                # PixiJS battle logic & visual particles
│   ├── ui/                    # Reusable React layout components
│   └── firebase/              # Client configurations and sparse array restoration utils
├── documents/                 # Game specifications, roadmaps, and features guides
├── firebase/                  # Security rules & deployment settings
└── package.json               # Monorepo workspaces dependencies config
```

---

## ⚡ Setup & Development

### 1. Installation
Clone the repository and install dependencies at the workspace root:
```bash
npm install
```

### 2. Running Locally
Run the Vite development server in hot-reload mode:
```bash
npm run dev
```

### 3. Build & Compile Verification
Verify typings and build static distribution bundles:
```bash
npm run build
```

---

## 🔒 Security & Data Integrity

The game implements server-side validations using **Firebase Database Rules** (`database.rules.json`):
- Read/write access is restricted exclusively to authenticated users matching the specific profile `uid`.
- Data updates are validated schema-wise (e.g., negative value preventions on speed elixirs, exp charms, or gold balances).
- Client-side checks dynamically verify daily purchase arrays during login to automatically reset daily limit limits at midnight.

---

## 📄 License

Private Game Project. Developed with 💖.