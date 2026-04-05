# Design System Strategy: The Editorial Architect

## 1. Overview & Creative North Star
**The Creative North Star: "The Editorial Bridge"**
This design system exists to bridge two worlds: the high-stakes reliability required by Korean SMB owners (40s-50s) and the fluid, aesthetic expectations of Gen Z junior marketers. We move away from the "industrial" look of standard SaaS and toward an **Editorial Tech** aesthetic. 

The system utilizes "Organic Asymmetry" to break the monotony of the dashboard grid. By leveraging bento-box layouts with varying heights and widths, we create a visual rhythm that guides the eye naturally through complex data. The result is a platform that feels like a premium digital magazine—authoritative yet approachable.

---

## 2. Colors: Tonal Depth over Structural Lines
Our palette is rooted in a deep, trustworthy Azure (`primary`) complemented by a refreshing Mint `secondary`. 

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. 
Boundaries must be created through **Background Color Shifts**. To separate a sidebar from a main feed, use `surface` next to `surface-container-low`. The transition of color is the boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
*   **Base Layer:** `surface` (The foundation).
*   **Section Layer:** `surface-container-low` (Large layout blocks).
*   **Content Layer:** `surface-container` or `surface-container-highest` (Individual cards/bento units).
*   **Floating Layer:** `surface-container-lowest` (pure white #ffffff) for active states or modals to provide maximum "lift."

### The "Glass & Gradient" Rule
To add "soul" to the professional tone, use subtle gradients for primary actions. Transition from `primary` (#006195) to `primary_container` (#007aba) at a 135-degree angle. For floating navigation or header elements, use **Glassmorphism**: `surface` color at 80% opacity with a `20px` backdrop-blur to allow content to bleed through softly.

---

## 3. Typography: The Bilingual Authority
We pair **DM Sans** (English/Numerics) with **Pretendard** (Korean) to create a seamless, high-performance typographic scale.

*   **Display (Plus Jakarta Sans):** Used for hero headers. Large, bold, and airy. It signals confidence to the SMB owner.
*   **Headline (Plus Jakarta Sans):** Navigational anchors.
*   **Body & Labels (Manrope/Pretendard):** These are the workhorses. We prioritize legibility. 
*   **The Clarity Rule:** Opacity on text is strictly forbidden. For hierarchy, use color shifts (e.g., `on-surface` for primary text, `on-surface-variant` for secondary text).

---

## 4. Elevation & Depth
We achieve hierarchy through **Tonal Layering** and **Ambient Physics**.

*   **The Layering Principle:** Depth is "stacked." An input field sits *inside* a card. Therefore, the card might be `surface-container-low` and the input field `surface-container-lowest`.
*   **Ambient Shadows:** For floating elements (Modals/Popovers), use multi-layered shadows.
    *   *Shadow Level 3:* `box-shadow: 0 10px 30px -5px rgba(0, 97, 149, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03);`
    *   Note: The shadow is tinted with the primary blue to prevent a "dirty" grey look.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons: The Tactile Primary
*   **Primary:** Gradient (Primary to Primary-Container). `12px` or `full` radius. No border.
*   **Secondary:** `surface-container-high` background with `on-primary-fixed-variant` text.
*   **Tertiary:** No background. Bold `primary` text.

### Bento Cards
*   **Radius:** Follow the 12/16/20px scale based on card size.
*   **Structure:** No dividers. Separate header and body of the card using a vertical spacing of `24px` (using the 4px base scale).

### Input Fields
*   **State:** Unfocused inputs use `surface-container-highest` with no border. 
*   **Focus:** Transition to a `primary` ghost border (20% opacity) and a subtle 4px `primary` outer glow.

### Chips
*   **Selection:** Use `secondary_fixed` background with `on-secondary-fixed` text. This provides a high-contrast "Active" state that looks premium.

### Contextual Components: The "Pulse" Indicator
For a SaaS simplifying tech, use a small animated pulse using the `accent` (Mint) color next to "System Status" or "Live Sync" labels to provide a sense of "living" technology.

---

## 6. Do's and Don'ts

### Do
*   **Use Asymmetry:** Place a large 2-column bento card next to two 1-column cards to create visual interest.
*   **Trust the Grid:** Use the 4px spacing system religiously to ensure the "Professional" tone is maintained through mathematical precision.
*   **Leverage Surface Tints:** Use `surface-tint` overlays at 5% for backgrounds of specialized sections to give them a distinct "vibe" without adding new colors.

### Don't
*   **Don't use 1px lines:** Do not use borders to separate list items. Use `8px` of vertical space or a subtle background hover state.
*   **Don't use Purple:** Keep the gradients strictly within the Blue-Mint-Cyan spectrum.
*   **Don't use Inter:** Use the specified DM Sans/Pretendard/Manrope stack to maintain the custom, high-end feel.
*   **Don't use Opacity for Text:** If text needs to be less prominent, use the `on-surface-variant` or `outline` tokens.