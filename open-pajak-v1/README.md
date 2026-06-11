# Hitung Pajak Workspace

This workspace contains the Bun + Vite application for Hitung Pajak. It is a client-only React app for Indonesian tax simulations covering PPh 21/26, PPh 22, PPh 23, PPh Final 4(2), PPN, and PPNBM.

## Requirements

- Bun 1.3+

## Commands

```bash
bun install
bun run dev
bun run build
bun run serve
bun run test
bun run lint
bun run format
bun run format:write
bun run check
```

## Quality Gates

- `bun run format` checks Prettier formatting.
- `bun run lint` runs ESLint against the app source.
- `bun run test` runs the Vitest regression suite for tax helpers and calculators.
- `bun run build` builds the production bundle and runs TypeScript.

## Notes

- Receipt history and saved simulations are stored only in the browser via `localStorage`.
- No application backend is used by this workspace.
- Cloudflare deployment files live alongside the app and should be changed carefully because they affect SPA deep-link handling.
