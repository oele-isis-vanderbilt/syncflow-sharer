---
paths:
  - 'src/**/*.{svelte,ts,css}'
---

# Design system

Full guide: `docs/design-rules.md`.

1. **Flowbite first.** Before writing UI, check whether `flowbite-svelte` has the component (Button, Input, Select, Modal, Drawer, Card, Table, Tabs, Navbar, Sidebar, Alert, Toast, Badge, Spinner, Pagination…). Use it. Never hand-build what Flowbite provides.
2. **Wrappers second.** Project-specific combinations live in `src/lib/components/ui/`. Check there before creating anything new. Use the `ui-component` skill to add one.
3. **Tokens only.**
   - Colors: `primary-*`, `secondary-*`, `gray-*` classes; status colors (red/green/yellow) only via Flowbite `color` props.
   - No hex/rgb/hsl values in components, no arbitrary values (`p-[13px]`, `bg-[#123]`), no other Tailwind palettes (`blue-*`, `slate-*`…), no inline color styles.
   - Tokens are defined only in `src/app.css`; ask before adding one.
4. **Spacing and type:** Tailwind's default scale. Page container `mx-auto max-w-screen-xl px-4`; sections `py-12 md:py-16`; cards `p-4 sm:p-6`.
5. **Icons:** `flowbite-svelte-icons` only.
6. **Dark mode:** pair every surface/text class with its `dark:` variant.
7. **Accessibility:** every input has a `Label`; icon-only buttons get `aria-label`; never remove focus rings.
