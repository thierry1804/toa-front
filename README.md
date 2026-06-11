# TOA Frontend

React 19 single-page app powered by [Vite](https://vite.dev).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Edit `app/page.tsx` — the page hot-reloads as you save.

## Project structure

| Path | Role |
|------|------|
| `app/layout.tsx` | Root layout (React Router outlet) |
| `app/page.tsx` | Home page |
| `app/globals.css` | Tailwind and global CSS |
| `src/main.tsx` | App entry and route definitions |
| `public/` | Static files |

Add routes in `src/main.tsx` and new page components under `app/`.

## Scripts

- `npm run dev` — development server
- `npm run build` — typecheck and production build
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint
