# Design brief

- Project: HandyHearts Care Tech
- Document title: Design brief
- Document ID: HH-DS
- Version: 1.0
- Status: Final (as shipped)
- Date last updated: 2026-10-21 (UTC)
- Author: Cursor cloud agent, for Dondon (owner)
- Repository: https://github.com/Awkward8787/Handy-Hearts-Care-Tech
- Commit described: `d0bdd0c2d4d18144129d93fd37faf5033f96c98f`
- Live URL: none.

## Contents

1. [Brand overview](#brand-overview)
2. [Logo and mark](#logo-and-mark)
3. [Color system](#color-system)
4. [Typography](#typography)
5. [Spacing, layout, and grid](#spacing-layout-and-grid)
6. [Shape and depth](#shape-and-depth)
7. [Components](#components)
8. [Iconography](#iconography)
9. [Motion](#motion)
10. [Imagery](#imagery)
11. [Voice and copy](#voice-and-copy)
12. [Accessibility design rules](#accessibility-design-rules)
13. [References](#references)
14. [Do and don't](#do-and-dont)
15. [Screens](#screens)
16. [Glossary](#glossary)
17. [Open questions](#open-questions)
18. [Changelog](#changelog)
19. [Sources](#sources)

## Brand overview

The name on the page is HandyHearts. There is no separate tagline field. The home sentence is “Request help without creating an account.” The audience is a person arranging technology help for an older adult, plus internal staff.

Personality, each as a choice the interface already makes:

| Trait | Shown by | Avoided |
| --- | --- | --- |
| Direct | “Request a consultation”, “Book a service” | A command-console voice |
| Calm | White canvas, one blue action | Alarm colors for ordinary text |
| Concrete | Name, email or phone, date, address | A required account before those fields |
| Sturdy | 4px black borders and a hard shadow | Soft glass panels |
| Honest | “Price to be confirmed” when no rate exists | A made-up dollar amount |

## Logo and mark

There is no separate logo file beyond the word HandyHearts in the header and the heart mark used for icons.

| Asset | Path | Size |
| --- | --- | --- |
| Favicon SVG | `public/favicon.svg` | Vector, blue square, white heart |
| Favicon ICO | `public/favicon.ico` | 16, 32, and 64 |
| Apple touch | `public/apple-touch-icon.png` | 180 |
| Open Graph | `public/og.png` | 1200 by 630 |
| iOS icon | `ios/HandyHearts/Assets.xcassets/AppIcon.appiconset/AppIcon.png` | 1024, RGB, no alpha |

The mark is a blue `#2563eb` field with a white heart. Do not recolor it in marketing without the owner. Minimum practical size is the 16px favicon. It sits on blue or, for the Open Graph image, beside black text on `#f8fafc`.

## Color system

Tokens are in `tailwind.config.js` and `index.css`.

| Token | Hex | RGB | Role | Pair | Contrast | AA | AAA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| brand.blue | `#2563eb` | 37, 99, 235 | Primary button fill, focus | White text on this blue | 5.17:1 | Pass | Fail |
| brand.blueDark | `#1d4ed8` | 29, 78, 216 | Hover, eyebrow text | On white | 6.70:1 | Pass | Fail |
| brand.green | `#10b981` | 16, 185, 129 | Fill only | White on this green | 2.54:1 | Fail | Fail |
| brand.greenInk | `#047857` | 4, 120, 87 | Notice text | On white | 5.48:1 | Pass | Fail |
| brand.ink | `#111827` | 17, 24, 39 | Body text | On white | 17.74:1 | Pass | Pass |
| brand.paper | `#ffffff` | 255, 255, 255 | Cards | Ink on white | Pass | Pass | Pass |
| brand.canvas | `#f8fafc` | 248, 250, 252 | Page background | Ink on canvas | Pass | Pass | Pass |
| slate-700 | `#334155` | 51, 65, 85 | Secondary text | On white | 10.35:1 | Pass | Pass |
| slate-600 | `#475569` | 71, 85, 105 | Hints | On white | 7.58:1 | Pass | Pass |
| brand.danger | `#dc2626` | 220, 38, 38 | Error text | On white | 4.83:1 | Pass for large and UI, body text is 4.83 so AA body fails by a small margin | Fail |
| brand.warning | `#facc15` | 250, 204, 21 | Not used as text on white | Black on this yellow | 13.71:1 | Pass | Pass |
| black | `#000000` | 0, 0, 0 | Borders, ink buttons | White on black | 21:1 | Pass | Pass |

`#dc2626` is available as `brand.danger`. Error text in the staff notice uses `text-brand-greenInk`. Form errors use the alert component. If an error is rendered in `#dc2626` at body size, it sits just under 4.5:1. The shipped error component should be checked against the computed style. `ErrorNote` does not set a red class in `web/components/Field.tsx`; it uses the default ink color. That passes. `#10b981` is not used for text on white.

Color is not the only status signal. Payment status is a sentence: “No payment was taken.” or “Payment received.”

## Typography

Inter is self-hosted from `@fontsource/inter` weights 400 through 900, imported in `index.tsx`. License: SIL Open Font License. Fallback: `ui-sans-serif, system-ui, sans-serif`.

| Level | Class in use | Weight |
| --- | --- | --- |
| Display | `text-4xl` to `text-6xl font-black` | 900 |
| Section | `text-2xl font-black` | 900 |
| Body | `text-lg` | 400 to 600 |
| Label | `text-sm font-bold` | 700 |
| Button | `font-extrabold` via `.btn` weight 800 | 800 |

There is no custom letter-spacing except uppercase eyebrows (`tracking-wide`). Type scales with the viewport through Tailwind’s `md:` prefix on the home and form headings.

## Spacing, layout, and grid

Tailwind’s default 4px scale is used (`p-4`, `p-6`, `p-8`, `gap-6`, `mt-8`). Page containers are `max-w-6xl` for home and services, `max-w-3xl` for forms and legal pages, and `max-w-xl` for receipt lookup. Breakpoint `md` is 768px. The home actions are one column, then two columns from `md`. Horizontal padding is `px-4`.

## Shape and depth

| Token | Value | Where |
| --- | --- | --- |
| Card border | 4px solid black | `.neo-card` |
| Card shadow | 8px 8px 0 0 #000 | `.neo-card`, `shadow-neo` |
| Button border | 4px solid black | `.btn` |
| Primary shadow | 4px 4px 0 0 #000 | `.btn-primary` |
| Radius | 0 on cards and buttons | The mark SVG uses `rx="8"` only |
| Header rule | 8px black bottom border | `PublicLayout` |

Primary press moves the button 2px and removes the shadow.

## Components

| Component | Anatomy | States | File |
| --- | --- | --- | --- |
| Skip link | Black bar, white text | Off-screen until focus, then `top: 1rem` | `index.css` |
| Header link | Underlined bold text | Hover is the browser underline | `PublicLayout.tsx` |
| Action card | Eyebrow, title, body, whole card is a link | Hover fills `#2563eb` with white text | `HomePage.tsx` |
| Primary button | `.btn.btn-primary` | Hover `#1d4ed8`, active shift, disabled | `index.css` |
| Quiet button | `.btn.btn-quiet` | Used for radios and secondary actions | `index.css` |
| Ink button | `.btn.btn-ink` | Place booking | `index.css` |
| Field | Label, optional hint, control `.field` | Invalid copy in `ErrorNote` with `role="alert"` | `web/components/Field.tsx` |
| Radio | Native input inside a button-styled label | Checked is the native control | Book page |
| Receipt card | Reference, summary, definition list, payment line | Print hides header and footer | `ReceiptPage.tsx` |
| Error boundary | “Something went wrong on this page.” and Reload | Render error | `ErrorBoundary.tsx` |

Inputs use a 4px black border through `.field`. Disabled buttons keep the border and do not remove the label.

## Iconography

`lucide-react` is a dependency and is not required for the guest pages shipped in this pass. The visible mark is the heart in the favicon and app icon. Illustrations are that heart plus the wordmark on `public/og.png`. Stroke icons are not part of the guest flow.

## Motion

Hover and active use CSS. Duration is the browser default for color, plus the 2px press. `prefers-reduced-motion: reduce` sets animation and transition duration to 0.01ms and turns off smooth scroll. There is no celebration animation.

## Imagery

Icons are SVG and PNG. The Open Graph image is PNG. Alt text: the heart images are decorative in the favicon and app icon and have no page alt. The Open Graph image is metadata, not an `img`. Content images are not used on the pages. Screenshots in `docs/assets` are documentation, not product UI.

## Voice and copy

Use short sentences. Name the thing: consultation, booking, receipt, reference. Say “No account needed.” Say “Price to be confirmed” when no rate is on file. Do not say a message was sent unless the status is `sent`.

Avoid on customer pages: API, environment variable, node, terminal, sequence, fault, and setup instructions. Staff pages may say sign-in because that audience is internal.

Example already shipped: “Tell us what you need, when you want it, and how to reach you. You get a receipt with a reference.”

## Accessibility design rules

- Focus ring: 3px solid `#2563eb`, offset 3px.
- Minimum target: 44px on `.btn`.
- Contrast minimum for text: WCAG AA 4.5:1. Primary white-on-blue passes. Do not put white text on `#10b981`.
- Do not use color alone. Status is a sentence.
- Every form control in the guest forms has a visible label.
- The interface is light. `UIUserInterfaceStyle` on iOS is Light. The web page does not offer a dark theme.

## References

The hard border and offset shadow were already the visual direction of this repository. The guest rewrite kept that border system and replaced theatrical console labels with plain sentences. No external brand site was copied.

## Do and don't

Do:

1. Lead with the action and the fact that no account is required.
2. Ask for an address only when the visit is in the home.
3. Show the reference in large type on the receipt.
4. Keep Staff in the footer.
5. Use Inter and the blue `#2563eb` for the main action.

Don't:

1. Add Create account to the home page.
2. Invent a price when no rate is on file.
3. Tell the guest an email was sent when delivery is only queued.
4. Use `#10b981` as text on white.
5. Put developer setup words on a customer page.

## Screens

The annotated set is the same capture as HH-FLOW.

![Home](assets/desktop_home.png)

Caption: route `/`. Two actions, no account control.

![Consultation receipt](assets/desktop_consult_receipt.png)

Caption: receipt typography, reference first.

![Booking review](assets/desktop_book_review.png)

Caption: honest empty-price state.

![Phone home](assets/mobile_home.png)

Caption: the same hierarchy at 390px.

## Glossary

| Term | Meaning |
| --- | --- |
| Neo card | White panel, 4px black border, 8px hard shadow |
| Ink button | Black fill, white label, used for Place booking |

## Open questions

| Question | Owner | Blocked |
| --- | --- | --- |
| A wordmark drawn by a designer, separate from the text logo. UNCONFIRMED. | Dondon | A replacement for the text header |
| Dark mode. Not shipped. UNCONFIRMED whether it is wanted. | Dondon | A second color theme |

## Changelog

| Date | Version | Change |
| --- | --- | --- |
| 2026-10-21 | 1.0 | Recorded the shipped tokens, the heart mark, and the guest voice. |

## Sources

- `tailwind.config.js`, `index.css`, `index.tsx`, `public/favicon.svg`
- Contrast ratios computed for the pairs in the color table
- `docs/assets` screenshots
