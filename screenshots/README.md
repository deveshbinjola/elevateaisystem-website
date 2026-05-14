# Coach Platform — Landing-page screenshots

This folder holds the four screenshots the marketing landing page
(`coach-platform.html`) embeds in its **Product preview** section.

## What to capture

Take each screenshot at **2x retina** density (so the rendered file ends up
crisp on Apple Silicon Macs and modern Windows displays). Width target:
**1440px viewport** (the page renders the screenshots at ~1100px wide; 2x
retina = 2200px source for sharpness).

| Slot | URL                          | What it shows                                     |
|------|------------------------------|---------------------------------------------------|
| 1    | `today.png`                  | `/command-center` — Granola hero, focus queue     |
| 2    | `inbox.png`                  | `/inbox` (List view, sorted by score)             |
| 3    | `voice.png`                  | `/voice` (active voice profile, Linear cards)     |
| 4    | `analytics.png`              | `/analytics` (book growth, warmth donut)          |

Drop the files in this folder with those exact filenames. The HTML already
references them — no edits needed once they're there.

## CRITICAL: blur lead names + emails before publishing

The screenshots will go on the public marketing site. Real lead data must
not appear. Before saving each PNG:

1. **Names** in the inbox / focus queue / compose / today view → blur or
   replace with placeholder names (Adam Smith, Mark Lee, etc.).
2. **Email addresses** → blur the local part (everything before the `@`),
   keep the domain visible if it adds context.
3. **Avatars** showing real initials → swap to fake initials or blur.

Quickest path: open each screenshot in Preview (Mac), use the rectangular
selection + the blur tool. ~30 seconds per screenshot.

If you want a placeholder while screenshots are pending, the landing page
gracefully shows a styled gradient block with the slot label — so it
doesn't look broken if a file is missing.
