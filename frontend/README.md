# Odoo Rent — Frontend (client)

React 19 + Vite storefront and operations UI for the Rental Management System.
See the [root README](../README.md) for the full project overview, setup, and
architecture.

## Scripts

```bash
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

The API base URL is derived from the page host and can be overridden with
`VITE_API_URL` (see `src/api/axios.js`).
