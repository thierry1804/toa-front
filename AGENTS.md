# TOA Frontend

React 19 SPA built with Vite. Application code lives under `app/` (layouts and pages) with entry in `src/main.tsx`.

## Structure

- `app/layout.tsx` — root layout (wraps routes via React Router `Outlet`)
- `app/page.tsx` — home page (`/home`)
- `app/login/page.tsx` — sign-in screen (`/login`, default entry)
- `app/globals.css` — global styles and Tailwind
- `public/` — static assets
- `@/*` path alias maps to project root

## Commands

- `npm run dev` — development server (default http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build
