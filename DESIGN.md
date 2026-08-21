---
name: Stint Analyzer
description: A direct working record for comparing drivers, stints, and lap evidence from local Garage 61 exports.
colors:
  paper: '#f4f1e8'
  paper-deep: '#e8e5dc'
  sheet: '#fbfaf5'
  sheet-texture: 'rgb(46 90 168 / 6%)'
  ink: '#182126'
  ink-soft: '#4d5a5e'
  muted: '#6f7a7c'
  rule: '#c9cbc2'
  rule-strong: '#939d9e'
  cobalt: '#2e5aa8'
  vermilion: '#d84b2f'
  ochre: '#c7982e'
  moss: '#2f756a'
  dark-paper: '#171b1d'
  dark-paper-deep: '#222a2c'
  dark-sheet: '#283133'
  dark-sheet-texture: 'rgb(120 167 232 / 8%)'
  dark-ink: '#edf2ed'
  dark-ink-soft: '#c2ceca'
  dark-muted: '#92a19e'
  dark-rule: '#455153'
  dark-rule-strong: '#6c7a77'
  dark-cobalt: '#78a7e8'
  dark-vermilion: '#ee816d'
  dark-ochre: '#dfbb61'
  dark-moss: '#79b8a7'
typography:
  display:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(3.2rem, 7vw, 6.6rem)'
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.45rem, 2.6vw, 2.25rem)'
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: '-0.035em'
  body:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Fragment Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.63rem'
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: '0.08em'
rounded:
  sm: '6px'
  md: '8px'
  lg: '12px'
spacing:
  unit: '4px'
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '24px'
  xl: '32px'
  section: '72px'
---

# Design System: Stint Analyzer

## Overview

**Creative North Star: "The Working Record"**

Stint Analyzer is a direct tool for source review and lap comparison. The interface uses paper-like surfaces, ruled data, compact labels, and a small set of useful state colors. It does not use decorative product codes, privacy badges, motorsport graphics, or promotional privacy copy as visual content.

Garage 61 names the supported workbook format. Stint Analyzer names the site.

### Visual character

- Plain, prominent `Stint Analyzer` wordmark.
- Mineral paper ground with graphite text in Light mode.
- Dark graphite and slate surfaces in Dark mode.
- Cobalt for active paths and measurement marks.
- Vermilion for attention and source problems.
- Ochre for warnings and secondary marks.
- Moss for ready and audit-confirmed states.
- Useful icons for actions and states, not decoration.
- Flat layers with one soft shadow on the active source card.

## Color roles

The light palette stays stable. Dark mode reverses the surface hierarchy without using pure black or neon accents.

### Light roles

- **Mineral Paper** `#f4f1e8`: application ground.
- **Deep Paper** `#e8e5dc`: quiet panels and secondary surfaces.
- **Clean Sheet** `#fbfaf5`: active source card and high-focus controls.
- **Graphite Ink** `#182126`: headings, primary actions, and strong rules.
- **Soft Ink** `#4d5a5e`: body text and explanations.
- **Muted Register** `#6f7a7c`: metadata and disabled information.
- **Measurement Rule** `#c9cbc2`: quiet dividers and table rows.
- **Strong Rule** `#939d9e`: section boundaries and sheet edges.

### Dark roles

- **Graphite Ground** `#171b1d`: application ground.
- **Slate Panel** `#222a2c`: quiet panels and secondary surfaces.
- **Slate Sheet** `#283133`: active source card and high-focus controls.
- **Light Ink** `#edf2ed`: headings, primary actions, and strong rules.
- **Soft Light Ink** `#c2ceca`: body text and explanations.
- **Muted Light Register** `#92a19e`: metadata and disabled information.
- **Dark Measurement Rule** `#455153`: quiet dividers and table rows.
- **Dark Strong Rule** `#6c7a77`: section boundaries and sheet edges.

### Signal roles

Use signal colors only when they carry state or evidence. Do not use them as decorative fills.

- **Cobalt** `#2e5aa8` / Dark `#78a7e8`: active tabs, focus, import boundaries, and measurement marks.
- **Vermilion** `#d84b2f` / Dark `#ee816d`: source errors and required attention.
- **Ochre** `#c7982e` / Dark `#dfbb61`: parser warnings and secondary marks.
- **Moss** `#2f756a` / Dark `#79b8a7`: ready and audit-confirmed states.

### Material accents

The source card uses a low-contrast paper and registration texture. The texture stays inside the card, stays behind content, and changes to a dark token in Dark mode. The analysis panel uses three short horizontal color marks as a compact visual signature. These accents do not carry unique meaning by color alone.

## Typography

Use Recursive Variable for headings, body text, buttons, and the wordmark. Use Fragment Mono only for measurements, counts, file status, data labels, and scope metadata.

- **Wordmark:** Recursive Variable, `1.08rem`, `700`, uppercase with `0.11em` tracking.
- **Wordmark secondary:** Fragment Mono, `0.72rem`, `500`, uppercase with `0.15em` tracking.
- **Display:** Recursive Variable, `clamp(3.2rem, 7vw, 6.6rem)`, `600`, `0.92` line height.
- **Headline:** Recursive Variable, `clamp(1.45rem, 2.6vw, 2.25rem)`, `600`, `1.05` line height.
- **Body:** Recursive Variable, `1rem`, `400`, `1.6` line height.
- **Label:** Fragment Mono, `0.63rem`, `500`, uppercase with `0.08em` tracking.

Do not use mono as a general technical costume. Do not put eyebrow text above headings.

## Layout

Use a centered width of `min(100% - 48px, 1360px)` on wide screens and `min(100% - 28px, 1360px)` on narrow screens. Keep the header simple: wordmark on the left and the theme icon button on the right.

The opening composition keeps the direct thesis beside the source card. The source card contains the source heading, direct status, import control, and imported file rows. The detected source table follows. The analysis views section contains the tabs and Export report action.

Use 4px as the base spacing unit. Put more space before a new section than inside a working surface. Tables keep their minimum width and scroll horizontally on narrow screens.

## Components

### Header

The header contains the Stint Analyzer wordmark, an icon-only GitHub source link, and the icon theme control. Do not add a lock, status dot, G61 mark, SA mark, export action, or reset action to the header.

### Theme control

Use one compact square icon button. It cycles `System → Light → Dark → System`. Use Monitor for System, Sun for Light, and Moon for Dark. The accessible label states the current mode and the next mode. The default preference is System. Store only the preference in `localStorage` under `stint-analyzer-theme`.

### Source card

The source card is the active working surface. Keep its paper texture, dashed import boundary, and one soft ambient shadow. Label it `Source files`. Show driver name, track, and car as separate rows inside a collapsed `File information` disclosure. Do not show a source identifier such as `G61 / 001`.

### Imported file rows

Each row uses the full available width. The header contains an informative status icon when needed, the filename, and a small Remove action. Ready rows omit the status icon and status label. File information and parser warnings use separate native disclosures that are closed by default. Duplicate, error, and rejection messages remain visible because they explain recovery. Disable Remove while the file is hashing or parsing.

### Analysis views

Keep the ruled tab strip and active vermilion underline. Put Export report beside the `Analysis views` heading. Use Download for Export and ShieldCheck for audit evidence. Keep the three short color marks at the bottom of the empty analysis panel.

### Privacy statement

Use one factual footer statement: `All workbook data stays in your browser.` Do not repeat privacy claims in the header, hero, import control, or file rows.

## Accessibility and states

Every action has a visible focus outline. Icon-only actions use an accessible label and a title. File status uses icon, text, and color. Warning disclosures use native details behavior. Tables remain semantic. Disabled actions remain readable and explain their unavailable state through nearby content.

Respect `prefers-reduced-motion`. Theme changes use short color transitions only. Do not animate the page into view.

## Do and do not

### Do

- Use direct labels that explain the next task.
- Keep the paper texture and compact color marks as material signatures.
- Use icons when they explain an action, state, or evidence type.
- Keep Garage 61 as a source-format reference, not the site name.
- Preserve runtime, pace, penalty, warning, and audit language.

### Do not

- Do not show meaningless IDs, fake source codes, or decorative workflow numbering.
- Do not use `G61` or `SA` as a site mark.
- Do not use a privacy badge as header chrome.
- Do not use repeated privacy marketing copy.
- Do not add gradients, neon, racing stripes, carbon textures, or full-page grids.
- Do not use decorative icons that do not explain a state or action.
- Do not use color as the only state signal.
