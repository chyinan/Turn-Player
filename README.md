# Turn Player — Luxe Vinyl Interface

A bespoke Tauri + VanillaJS experience that transforms your desktop into an opulent turntable. The UI emulates a high-end record player with layered wood/grain textures, gilded trim, animated tonearm, and a live album art label. Drag-and-drop or browse to queue audio files, and enjoy needle-drop timing, responsive arm movement, per-track artwork filling the center label, and tactile cues like decorative screws plus a glowing power light.

## Highlights

- **Ceremonial Upload Experience** – drag & drop or browse audio files; the upload module echoes a luxurious brass invitation.
- **Illustrated Turntable** – CSS-crafted platter, tonearm, headshell, power lamp, and album jacket that stay coherent across window sizes.
- **Animated Playback** – tonearm glides from outer to inner grooves based on playback progress, vinyl spins with soft reflection highlight, and playback time is shown in a gilded plate.
- **Custom Faces** – you can override the default vinyl label with either embedded album art (if available) or a manually uploaded image.
- **Keyboard polish** – space toggles play/pause, `r` restarts, `F`/`Esc` toggles fullscreen via the native Tauri window.

## Project structure

- `src/` – frontend source for the single-page interface (HTML, CSS, JS).
- `src-tauri/` – Rust-powered backend, window/capability definitions, tauri config.
- `dist/` – generated build output after `npm run build`.
- `package.json` / `package-lock.json` – JS dependencies and scripts.
- `vite.config.js` – Vite config tuned for Tauri (fixed port, platform targets).

## Local development

1. `npm install` – install JS deps.
2. `npm run dev` – launch Vite dev server.
3. In another shell: `cargo tauri dev --bin turn-player-app` (or `npm run tauri dev` if scripted) to open the desktop window pointing at `http://localhost:5173`.

## Production build

1. `npm run build` – compiles the frontend into `dist/`.
2. `cargo tauri build` – bundles the desktop app artifacts (platform-specific installers).

## Controls

- **Upload music** – drag audio files onto the canvas or click “Browse Files”.
- **Playback** – press spacebar or click the turntable to play/pause; `r` rewinds.
- **Fullscreen** – press `F` to toggle, `Esc` to exit.
- **Settings** – use the hidden panel (`⌘/Ctrl` + click the gear) to adjust background accent colors or customize the record label image.

## Notes

- The Tauri backend exposes `get_audio_metadata` for album art extraction; be sure your `src-tauri` capabilities include `core:window:allow-set-fullscreen` so fullscreen controls work as expected.
- The UI is intentionally single-page, so most interactions happen within `src/main.js` (tonearm animation, label swapping, file drag/drop, buttons).
