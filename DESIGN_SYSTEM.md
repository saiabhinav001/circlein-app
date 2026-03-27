# CircleIn Design System (Phase 0)

## Purpose
This document defines the core visual foundation for CircleIn. It is the source of truth for typography, color, spacing, and base component behavior.

## Typography
### Font Stack
- Sans: Geist (`--font-geist-sans`)
- Mono: Geist Mono (`--font-geist-mono`)

### Type Scale
- `text-display`: 48px, 1.1, -0.025em, 700
- `text-h1`: 36px, 1.2, -0.025em, 700
- `text-h2`: 28px, 1.25, -0.02em, 600
- `text-h3`: 22px, 1.3, -0.015em, 600
- `text-h4`: 18px, 1.35, -0.01em, 600
- `text-body-lg`: 18px, 1.6, 400
- `text-body`: 15px, 1.6, 400
- `text-body-sm`: 13px, 1.5, 0.005em, 400
- `text-caption`: 11px, 1.4, 0.02em, 500
- `text-micro`: 10px, 1.3, 0.04em, 500

## Color System
### Core Palette
- Background light: `#FAFAF9`
- Background dark: `#0C0C0D`
- Surface light: `#FFFFFF`
- Surface dark: `#141416`
- Elevated dark: `#1A1A1F`
- Border light: `#E8E5E3`
- Border dark: `#27272A`
- Text primary light: `#1A1A1A`
- Text primary dark: `#FAFAF9`
- Brand accent: `#10B981`

### Rules
- No indigo/violet/fuchsia/purple gradient controls.
- No colored glow shadows.
- CTA controls use solid fills with neutral hover states.
- Emerald is reserved for meaning and brand accents, not decorative flooding.

## Spacing
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px

## Radius + Depth
- Small controls: `rounded-lg` (8px)
- Cards/dialogs: `rounded-xl` (12px)
- Resting surfaces are mostly flat
- Hover/elevation is subtle (`shadow-md`/`shadow-xl` with low opacity)

## Core Components
### Button
- Sizes:
  - `default`: 36px
  - `sm`: 32px
  - `lg`: 40px
- Variants:
  - `default`: primary solid
  - `outline`: neutral border
  - `secondary`: muted fill
  - `ghost`: minimal fill on hover
  - `destructive`: destructive red

### Input
- Height: 40px
- Radius: `rounded-lg`
- Border: neutral (`border-input`)
- Focus: subtle neutral ring (`ring-ring/10`)

### Card
- Radius: `rounded-xl`
- Border: `border-border`
- Hover: subtle lift + shadow
- Header/content spacing: consistent 20/24px rhythm

### Dialog
- Overlay: `bg-black/50` with blur
- Content: `rounded-xl`, subtle border, elevated shadow
- Motion: 200ms fade/zoom only

## Effects Policy
Allowed:
- subtle glass surfaces (`glass-surface`)
- soft mesh background tinting
- restrained opacity/motion

Disallowed:
- animated gradient text
- aurora beams
- floating particles
- glow-heavy pseudo-elements
- perpetual decorative animations

## Contributor Checklist
- Use existing tokens and utility classes before introducing new values.
- Avoid inline hardcoded color hex values unless absolutely necessary.
- Prefer `text-h*` and `text-body*` utilities over ad-hoc text sizes.
- Keep transitions between 150ms and 250ms for UI interactions.
- Test both light and dark themes when introducing new components.
