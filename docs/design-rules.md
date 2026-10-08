# Design system

Built on **Flowbite Svelte** + **Tailwind CSS v4** (SvelteKit 3, Svelte 5). The goal: every screen
looks like it came from one designer, whether a person or Claude wrote it.

Paths below are relative to the repo root.

## Layers

| Layer               | Where                                  | Rule                                                   |
| ------------------- | -------------------------------------- | ------------------------------------------------------ |
| Tokens              | `src/app.css` (`@theme`)               | Only place colors and fonts are defined                |
| Flowbite components | `flowbite-svelte`                      | Default choice for all UI                              |
| App wrappers        | `src/lib/components/`                  | Only when we need project defaults on top of Flowbite  |
| Pages/features      | `src/routes/**`, `src/lib/features/**` | Compose the layers above; no custom styling primitives |

## Color

| Role                       | Token                                       | Use for                                 |
| -------------------------- | ------------------------------------------- | --------------------------------------- |
| Primary                    | `primary-50…950`                            | Main actions, links, focus, active nav  |
| Secondary                  | `secondary-50…950`                          | Accents, highlights, secondary emphasis |
| Neutral                    | `gray-50…950`                               | Text, borders, surfaces                 |
| Danger / Success / Warning | Flowbite `color="red" / "green" / "yellow"` | Status only, through component props    |

Common pairings:

- Page background: `bg-white dark:bg-gray-900`
- Raised surface: `bg-gray-50 dark:bg-gray-800`
- Border: `border-gray-200 dark:border-gray-700`
- Body text: `text-gray-900 dark:text-white`
- Muted text: `text-gray-500 dark:text-gray-400`
- Link: `text-primary-600 hover:underline dark:text-primary-500`
  (on `bg-gray-50` surfaces use `text-primary-700`; `primary-600` is only 4.2:1 there)

To rebrand, change the hex values in `src/app.css` only. Flowbite components
pick them up automatically.

## Typography

- Font: `--font-sans` (Inter), self-hosted through `@fontsource-variable/inter`,
  imported in `src/routes/+layout.svelte`. Monospace uses the system stack.
- Page title: `<Heading tag="h1" class="text-3xl md:text-4xl">`
- Section title: `<Heading tag="h2" class="text-2xl">`
- Card title: `<Heading tag="h5" class="text-xl">`
- Body: default; small print `text-sm`; captions `text-xs`.
- Use Flowbite's `Heading`, `P`, `A`, `List` typography components rather
  than raw tags when styling is needed.

## Spacing & layout

- Use Tailwind's scale only: `1, 2, 3, 4, 6, 8, 12, 16` cover almost
  everything.
- Page container: `mx-auto max-w-screen-xl px-4`
- Section rhythm: `py-12 md:py-16`
- Stack gaps: `gap-4` (tight), `gap-6` (default), `gap-8` (loose)
- Card padding: `p-4 sm:p-6`
- Radius: Flowbite defaults (`rounded-lg`); don't mix radii.

## Components

| Need                               | Use                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Action                             | `Button` (`color="primary"` main, `color="alternative"` secondary, `color="red"` destructive) |
| Text field                         | `Label` + `Input` + `Helper`                                                                  |
| Select / checkbox / radio / toggle | `Select`, `Checkbox`, `Radio`, `Toggle`                                                       |
| Feedback                           | `Alert` (inline), `Toast` (transient)                                                         |
| Container                          | `Card`                                                                                        |
| Overlay                            | `Modal`, `Drawer`, `Dropdown`, `Popover`, `Tooltip`                                           |
| Navigation                         | `Navbar`, `Sidebar`, `Breadcrumb`, `Tabs`, `Pagination`                                       |
| Data                               | `Table` family                                                                                |
| Status                             | `Badge`, `Spinner`, `Progressbar`                                                             |
| Icons                              | `flowbite-svelte-icons` (`…Outline` by default, `…Solid` for filled states)                   |

One primary button per view. Destructive actions confirm through a `Modal`.

## When to create a wrapper

Create a component in `src/lib/components/ui/` only when the same Flowbite
component + props combination appears in 3+ places, or when it composes
several Flowbite pieces into one reusable unit (e.g. `FormField` =
Label + Input + Helper + error state). Wrappers:

- Take an explicit, typed `Props` interface (`variant`, `size`); no `...rest` passthrough.
- Use tokens only.

## Accessibility

- Every input has a `Label`; icon-only buttons have `aria-label`.
- Don't rely on color alone for status — pair with an icon or text.
- Keep Flowbite's focus rings; never `outline-none` without a replacement.

## What the checker blocks

`pnpm check:design` (`scripts/check-design.mjs`) fails on:

- Hex / `rgb()` / `hsl()` colors in `.svelte` files
- Tailwind arbitrary values like `bg-[#fff]`, `mt-[13px]`
- Non-token Tailwind palettes as classes (`blue-`, `slate-`, `red-`, `green-`, …); status colors go through Flowbite `color` props
- Inline `style="color: …"` / `background` declarations

Add `<!-- design-ignore-next-line -->` (or `// design-ignore-next-line`) above a line only when there's a real reason, and say why.
