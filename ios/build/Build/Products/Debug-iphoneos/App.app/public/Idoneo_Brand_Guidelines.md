# 🎨 Idoneo — Brand & Color Guidelines

> For external designers and collaborators. All brand assets and color specifications for the Idoneo platform.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **Name** | Idoneo |
| **Domain** | idoneo.ai |
| **Tagline** | The platform for Italian public exam preparation |
| **Tone** | Premium, motivating, approachable |
| **Aesthetic** | Glassmorphism, 3D liquid-glass assets, micro-animations |

---

## 2. Primary Brand Color

> **This is the single most important color in the entire brand.**

| | |
|---|---|
| **Name** | **Idoneo Blue** |
| **HEX** | `#00B1FF` |
| **RGB** | `0, 177, 255` |
| **HSL** | `198°, 100%, 50%` |

Used for: logo, primary CTAs, links, active states, focus rings, badges, accent icons, section highlights, onboarding, brand-colored buttons.

### Hover / Pressed States

| State | HEX |
|-------|-----|
| Default | `#00B1FF` |
| Hover | `#0099E6` |
| Pressed | `#0088CC` |

---

## 3. Full Colour Palette

### 3.1 Core Brand Colors

| Name | HEX | RGB | Role |
|------|-----|-----|------|
| 🔵 **Idoneo Blue** | `#00B1FF` | `0, 177, 255` | Primary brand color — logo, CTA, accents |
| 🔷 **Deep Blue** | `#0066FF` | `0, 102, 255` | Gradient endpoint, depth |
| 🔹 **Utility Blue** | `#0095FF` | `0, 149, 255` | Secondary actions, utility buttons |
| 🩵 **Brand Cyan** | `#06D6D3` | `6, 214, 211` | Gradient start, progress bars, highlights |
| 🟣 **Purple** | `#5856D6` | `88, 86, 214` | Alternative accent, categories |
| 🟠 **Orange** | `#FF9F0A` | `255, 159, 10` | Streaks, mild warnings, special badges |

### 3.2 Brand Gradients

```
Primary Gradient (CTA, progress bars):
  from #06D6D3  →  to #0095FF   (135° angle)

Vibrant Gradient (headers, accents):
  from #00A8FF  →  to #00E5FF   (90° angle)

Blue CTA Gradient (action buttons):
  from #00B1FF  →  to #0066FF   (135° angle)

Accent Edge (3px hover reveal line):
  from #00B1FF  →  to #0066FF   (vertical)
```

### 3.3 Semantic Colors (Feedback)

| Name | HEX | Use |
|------|-----|-----|
| ✅ **Success** | `#34C759` | Correct answers, confirmations |
| ❌ **Error** | `#FF3B30` | Wrong answers, errors, alerts |
| ⚠️ **Warning** | `#FF9F0A` | Cautions, streak at risk |
| ℹ️ **Info** | `#00B1FF` | Tips, informational callouts |

### 3.4 Canvas & Surfaces

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **App Background** | `#F5F5F7` | `#000000` |
| **Card Surface** | `#FFFFFF` | `#111111` |
| **Card Border** | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` |
| **Text Primary** | `#111827` | `#F8FAFC` |
| **Text Secondary** | `#6B7280` | — |
| **Text Tertiary** | `#9CA3AF` | — |

### 3.5 UI-Specific Colors

| Component | HEX | Context |
|-----------|-----|---------|
| Bottom Sheet BG | `#1C1C1E` | Modal sheets, pickers |
| Sheet Input BG | `#2C2C2E` | Search bars inside sheets |
| Sheet Button BG | `#3A3A3C` | Close buttons, edit buttons |
| Muted Icon | `#8E8E93` | Placeholder icons, search |

---

## 4. Typography

| Property | Value |
|----------|-------|
| **Font** | **Inter** (Google Fonts) |
| **Fallback** | San Francisco, SF Pro, system sans-serif |
| **Rendering** | Antialiased |

### Type Scale

| Usage | Size | Weight |
|-------|------|--------|
| Hero / Page Title | 28px | Black (900) |
| Section Title | 18px | Bold (700) |
| Card Title | 15px | Bold (700) |
| Body Text | 14px | Medium (500) |
| Caption / Label | 11px | Bold (700), uppercase |
| Stat Value | 24px | Black (900) |
| Stat Label | 9–10px | Bold (700), uppercase |

---

## 5. Logo Usage Rules

| Rule | Detail |
|------|--------|
| **Primary Color** | Always use `#00B1FF` (Idoneo Blue) |
| **On Light BG** | `#00B1FF` or `#111827` (dark text) |
| **On Dark BG** | `#00B1FF` or `#FFFFFF` (white) |
| **Minimum Size** | 32px height |
| **Clear Space** | 1× logo height on all sides |
| **Prohibited** | Do not stretch, rotate, add effects, or change the brand color |

---

## 6. Dark Mode Specifications

| Aspect | Light → Dark |
|--------|-------------|
| Background | `#F5F5F7` → `#000000` |
| Card | `#FFFFFF` → `#111111` |
| Text | `#111827` → `#F8FAFC` |
| Borders | `rgba(0,0,0,0.05)` → `rgba(255,255,255,0.08)` |
| Brand Color | `#00B1FF` — **same in both modes** |

---

## 7. Glassmorphism Pattern

The app uses a "Tier S" premium glassmorphic aesthetic:

```
Light Mode:
  Background:  white at 80% opacity
  Blur:        Extra-large (backdrop-blur-xl)
  Border:      white at 60% opacity
  Shadow:      0 2px 16px -4px rgba(0,0,0,0.08)

Dark Mode:
  Background:  white at 4% opacity
  Blur:        Extra-large
  Border:      white at 8% opacity
  Shadow:      0 2px 16px -4px rgba(0,0,0,0.30)
```

---

## 8. Corner Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Squircle | 22% | App icon shape |
| Card | 24px | Cards, modals |
| Pill | 9999px | CTAs, badges, tags |
| Input | 16px | Text inputs, search |
| Standard | 16px | General containers |

---

## 9. Key Brand Color Summary

```
   #00B1FF  ■■■■■■■■■■  Idoneo Blue (PRIMARY)
   #0066FF  ■■■■■■■■■■  Deep Blue
   #0095FF  ■■■■■■■■■■  Utility Blue
   #06D6D3  ■■■■■■■■■■  Brand Cyan
   #5856D6  ■■■■■■■■■■  Purple
   #FF9F0A  ■■■■■■■■■■  Orange
   #34C759  ■■■■■■■■■■  Success Green
   #FF3B30  ■■■■■■■■■■  Error Red
   #F5F5F7  ■■■■■■■■■■  Light Background
   #000000  ■■■■■■■■■■  Dark Background
   #111827  ■■■■■■■■■■  Text Primary
```

---

*Document generated: March 2026 — Idoneo v1*
