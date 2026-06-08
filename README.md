# Open Pajak

Open Pajak is a client-side Indonesian tax calculator. The repository ships a single-page app in `open-pajak-v1/` with calculators for PPh 21/26, PPh 22, PPh 23, PPh Final 4(2), PPN, and PPNBM.

## Workspace

- App source: `open-pajak-v1/`
- Main stack: React 19, Vite, TanStack Router, Tailwind CSS 4, i18next, Bun
- Hosting target: static Cloudflare Pages/Workers deployment

## Local Development

```bash
cd open-pajak-v1
bun install
bun run dev
```

Useful commands:

```bash
bun run build
bun run test
bun run lint
bun run format
bun run check
```

## Privacy

- The app does not send calculation data to a server.
- Receipts and saved simulations are stored only in the browser with `localStorage`.
- Users should avoid entering sensitive identifiers unless they accept browser-local storage on that device.

## Bulk Upload

- The current template/export flow uses SpreadsheetML `.xls` and `.xml` files.
- Modern `.xlsx` uploads are not implemented yet.

## Deployment Notes

- Keep SPA fallback files aligned with the actual Cloudflare deployment mode before removing any of them.
- Deep-link refreshes should be verified for `/`, `/pph21`, `/pph22`, `/ppn`, and `/ppnbm` after deployment changes.
