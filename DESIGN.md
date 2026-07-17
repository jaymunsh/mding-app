# mding Design System

## 1. Atmosphere & Identity

mding feels like a quiet local writing desk: fast, plain, and dependable. The signature is a dense file surface with soft tonal panels, where the Markdown document stays visually dominant and controls recede until needed.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Surface/primary | --surface-primary | #F7F7F4 | #111210 | App background |
| Surface/secondary | --surface-secondary | #FFFFFF | #191A17 | Sidebar and editor panels |
| Surface/elevated | --surface-elevated | #FFFFFF | #22231F | Dialogs, popovers |
| Surface/inset | --surface-inset | #EFEFEB | #0C0D0B | Text editor, preview canvas |
| Text/primary | --text-primary | #181916 | #F3F4ED | Body and headings |
| Text/secondary | --text-secondary | #65685F | #A9ADA1 | Metadata, labels |
| Text/tertiary | --text-tertiary | #8C9085 | #74786F | Disabled text |
| Border/default | --border-default | #D9DBD2 | #31342E | Panel borders |
| Border/subtle | --border-subtle | #E8E9E2 | #252820 | Dividers |
| Accent/primary | --accent-primary | #2F6F5E | #60B49D | Selected rows, primary actions |
| Accent/hover | --accent-hover | #255A4C | #7CC9B4 | Hovered primary actions |
| Status/error | --status-error | #B42318 | #FF8A7A | Destructive actions and errors |
| Status/warning | --status-warning | #A35B00 | #E7A548 | Storage caution states |
| Status/success | --status-success | #287A45 | #6ECD8C | Saved state |

### Rules

- Accent is reserved for selection, focus, and primary save/import/export actions.
- Destructive actions only use the error token.
- No decorative gradients. Depth comes from tonal shifts and borders.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| H1 | 24px | 650 | 1.2 | 0 | Document title |
| H2 | 20px | 650 | 1.3 | 0 | Panel headings |
| H3 | 16px | 650 | 1.4 | 0 | Group labels |
| Body | 15px | 400 | 1.6 | 0 | Markdown preview |
| UI | 14px | 500 | 1.4 | 0 | Buttons, rows |
| Caption | 12px | 500 | 1.35 | 0 | Metadata |
| Code | 13px | 400 | 1.6 | 0 | Markdown source |

### Font Stack

- Primary: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace

### Rules

- Use system fonts to keep install size and native platform feel.
- Body text never drops below 14px.
- Source editor always uses the mono scale.

## 4. Spacing & Layout

### Base Unit

All spacing derives from 4px.

| Token | Value | Usage |
| --- | --- | --- |
| --space-1 | 4px | Icon gaps |
| --space-2 | 8px | Compact row padding |
| --space-3 | 12px | Toolbar groups |
| --space-4 | 16px | Panel padding |
| --space-5 | 20px | Document content edge |
| --space-6 | 24px | Wide content rhythm |
| --space-8 | 32px | Large empty states |

### Grid

- Mobile breakpoint: below 760px uses one-pane navigation.
- Tablet and macOS: 760px and wider use sidebar plus document panel.
- Desktop max shell width: none. The app fills the viewport.
- Sidebar width: 280px, clamped between 232px and 340px.

### Rules

- Use `100dvh` for app height to avoid iOS Safari viewport jumps.
- No nested cards. Panels are direct children of the app shell.
- Rows have fixed minimum heights so labels and icons do not shift layout.

## 5. Components

### App Shell

- **Structure**: root app container, toolbar, sidebar, document pane.
- **Variants**: compact single-pane, wide split-pane.
- **Spacing**: --space-3 to --space-5.
- **States**: normal, storage-loading, storage-error.
- **Accessibility**: uses `main`, `nav`, and labelled toolbar regions.
- **Motion**: compact pane transitions use transform and opacity only.

### Toolbar Button

- **Structure**: button with Lucide icon and optional label.
- **Variants**: icon-only, icon-label, primary, subtle, destructive.
- **Spacing**: --space-2 horizontal, --space-1 icon gap.
- **States**: default, hover, active, focus, disabled.
- **Accessibility**: every icon-only button has an aria-label.
- **Motion**: 120ms color and transform feedback.

### Toolbar Overflow

- **Structure**: icon trigger with a compact list of secondary toolbar commands.
- **Variants**: hidden at wide desktop widths, visible when toolbar labels no longer fit.
- **Spacing**: --space-2 menu padding and --space-1 item gap.
- **States**: closed, open, hover, focus.
- **Accessibility**: trigger exposes expanded state and every menu item keeps its full command label.
- **Motion**: opacity and transform entry over 120ms.

### Theme Switcher

- **Structure**: compact fieldset with system, light, and dark icon buttons.
- **Variants**: selected system, selected light, selected dark.
- **Spacing**: 32px fixed icon cells with 2px inset padding.
- **States**: default, hover, selected, focus.
- **Accessibility**: semantic fieldset with hidden legend and labelled buttons.
- **Motion**: same 120ms color feedback as toolbar buttons.

### File Tree Row

- **Structure**: button row with disclosure affordance, file/folder icon, name, optional metadata.
- **Variants**: file, folder, selected, editing-disabled.
- **Spacing**: --space-2 vertical, --space-3 horizontal.
- **States**: default, hover, selected, focus, disabled.
- **Accessibility**: tree rows are keyboard reachable buttons.
- **Motion**: selected state changes color only.

### Contextual Manage Bar

- **Structure**: normal Manage trigger; selection count, move, delete, and Done actions only in manage mode.
- **Variants**: idle, managing-empty, managing-selected, choosing-move-target.
- **Spacing**: --space-2 gaps with --space-3 panel padding.
- **States**: default, selected, disabled, destructive.
- **Accessibility**: selected count is announced as status text and actions remain keyboard reachable.
- **Motion**: mode entry uses opacity only.

### Sidebar Resize Handle

- **Structure**: fine vertical drag target between the file tree and document pane.
- **Variants**: idle, hover, dragging, collapsed.
- **Spacing**: visual rule stays 1px while the pointer target is 8px wide.
- **States**: default, focus, active.
- **Accessibility**: pointer resizing is supplemented by collapse and expand buttons.
- **Motion**: no animated width changes while dragging.

### Document Pane

- **Structure**: header, mode toolbar, scrollable body.
- **Variants**: preview, source editor, empty state.
- **Spacing**: --space-4 and --space-5.
- **States**: clean, dirty, saving, error, empty.
- **Accessibility**: editor textarea has an explicit label and preserves tab order.
- **Motion**: mode changes crossfade over 120ms.

### Undo Toast

- **Structure**: short message, Undo action, and dismiss action in an elevated status surface.
- **Variants**: single item and multiple item deletion.
- **Spacing**: --space-3 inline padding and --space-2 action gap.
- **States**: visible, dismissed, restored.
- **Accessibility**: polite live region with explicit labelled actions.
- **Motion**: opacity and translate entry over 180ms.

### Markdown Preview

- **Structure**: CommonMark/GFM renderer with custom Obsidian callout, syntax-highlighted code, image, and Mermaid renderers.
- **Variants**: standard prose, tables, task lists, images, code blocks, callouts, folded callouts, Mermaid diagrams, render-error fallback.
- **Spacing**: --space-4 for tables, code blocks, callouts, images, and diagram surfaces.
- **States**: loading renderer, rendered, folded, expanded, diagram error.
- **Accessibility**: external links are explicit anchors; folded callouts use native `details`/`summary`; Mermaid output is exposed as an image region.
- **Motion**: none.

### Dialog

- **Structure**: modal surface with title, form field, actions.
- **Variants**: text input, confirmation.
- **Spacing**: --space-4.
- **States**: default, validation-error.
- **Accessibility**: labelled fields, Escape closes, focus returns to trigger.
- **Motion**: opacity and scale entry only.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 120ms | ease-out | Button press, hover |
| Standard | 180ms | ease-in-out | Pane switch, dialog entry |

### Rules

- Animate only opacity and transform.
- Respect `prefers-reduced-motion`.
- Hover states must communicate affordance; no decorative motion.
- On mobile document screens, scrolling down condenses the document header; scrolling up restores it.

## 7. Depth & Surface

### Strategy

Tonal-shift with fine borders.

| Type | Value | Usage |
| --- | --- | --- |
| Default border | 1px solid var(--border-default) | Panel edges |
| Subtle border | 1px solid var(--border-subtle) | Row and toolbar dividers |
| Elevation | 0 12px 40px color-mix(in srgb, var(--text-primary) 10%, transparent) | Dialogs only |

Surfaces should feel native and quiet. Shadows are reserved for dialogs, never for repeated file rows or panels.
