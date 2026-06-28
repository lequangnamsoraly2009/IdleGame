# Idle RPG Web

> A modern Idle RPG built with React, PixiJS and Firebase.

---

## 🎯 Project Vision

Idle RPG Web là một game Idle RPG chạy trên trình duyệt, được thiết kế theo kiến trúc hiện đại, dễ mở rộng và có thể vận hành lâu dài.

Mục tiêu:

- Gameplay có thể chơi hàng nghìn giờ.
- Dữ liệu đồng bộ nhiều thiết bị.
- Hỗ trợ Event, Guild, PvP.
- Có Admin CMS để chỉnh game mà không cần deploy.
- Triển khai hoàn toàn trên GitHub + Vercel + Firebase.

---

# Core Gameplay Loop

```
Login

↓

Offline Reward

↓

Hero Auto Battle

↓

Monster

↓

Loot

↓

Inventory

↓

Equip

↓

Upgrade

↓

Dungeon

↓

Boss

↓

Prestige

↓

Unlock World

↓

Repeat
```

---

# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- PixiJS
- TailwindCSS
- shadcn/ui
- Motion
- Howler

## State

- Zustand

## Server State

- TanStack Query

## Backend

- Firebase Authentication
- Firestore
- Storage
- Cloud Functions
- Analytics

## Deploy

- GitHub
- Vercel

---

# Architecture

```
GitHub

↓

Vercel

↓

React

↓

PixiJS Engine

↓

Firebase
```

---

# Repository Structure

```
idle-rpg/

docs/

apps/
    web/

packages/
    engine/
    ui/
    firebase/
    shared/

firebase/

.github/
```

---

# Engine Architecture

```
Engine

├── Scene

├── Hero

├── Monster

├── Battle

├── Loot

├── Animation

├── Audio

└── Particle
```

Engine không phụ thuộc React.

React chỉ hiển thị UI.

---

# React Responsibilities

React chịu trách nhiệm:

- Inventory
- Hero
- Equipment
- Shop
- Guild
- Quest
- Popup
- Navigation
- Loading
- Toast

Game Scene sẽ được render bằng PixiJS.

---

# Firebase Collections

```
users

heroes

inventory

equipment

skills

quests

guilds

leaderboards

events

mail

configs
```

---

# Config Driven Design

Toàn bộ game được điều khiển bằng Config.

Ví dụ:

- Monster HP
- Monster Damage
- Item Drop Rate
- Skill
- Quest
- Event
- Shop

đều được đọc từ Firestore.

Không hard-code trong source.

---

# UI Layout

```
+------------------------------------------------+

 Gold     Diamond      Mail      Setting

+------------------------------------------------+

             PixiJS Game Scene

 Hero               Monster

 Floating Damage

 Loot Drop

+------------------------------------------------+

 Hero  Bag  Quest  Guild  Shop  Summon

+------------------------------------------------+
```

---

# Folder Structure

```
src/

assets/

components/

features/

game/

hooks/

services/

stores/

types/

utils/
```

---

# Coding Convention

- TypeScript Strict Mode
- Feature-first Architecture
- SOLID
- DRY
- Composition over Inheritance
- Functional Components
- No Redux
- Zustand cho Game State

---

# Git Flow

```
main

develop

feature/*

release/*
```

---

# CI/CD

```
Push

↓

GitHub

↓

GitHub Actions

↓

Build

↓

ESLint

↓

Type Check

↓

Deploy

↓

Vercel
```

---

# Development Roadmap

## Phase 1

- Project Setup
- Firebase
- Authentication
- PixiJS
- UI Layout

---

## Phase 2

- Hero
- Monster
- Battle
- Damage
- Loot

---

## Phase 3

- Inventory
- Equipment
- Upgrade
- Shop

---

## Phase 4

- Dungeon
- Boss
- Prestige

---

## Phase 5

- Guild
- PvP
- Event
- Leaderboard

---

## Phase 6

- Admin CMS
- LiveOps
- Analytics

---

# Long-term Features

- Battle Pass
- Daily Quest
- Weekly Event
- Monthly Event
- Pet System
- Mount System
- Crafting
- Arena
- Guild War
- Raid
- Achievement
- Collection
- Endless Tower

---

# Deployment

Frontend

- Vercel

Backend

- Firebase

Repository

- GitHub

Không sử dụng VPS.

Không cần Docker.

Không cần Server Node riêng.

---

# Development Principles

- Code đơn giản, dễ đọc.
- Tách biệt Game Engine và UI.
- Ưu tiên khả năng mở rộng.
- Mọi dữ liệu gameplay đều có thể cấu hình.
- Tài liệu luôn được cập nhật song song với mã nguồn.

---

# License

Private Project.