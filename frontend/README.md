# NewsApp Frontend

## Tech

- React 18, Vite, React Router
- Bootstrap 5
- Axios

## Dev

1. Create `.env` with:

VITE_NEWS_API_KEY=YOUR_NEWSAPI_KEY_HERE
VITE_API_BASE=/api/news

2. Install deps: `npm install`
3. Run: `npm run dev` → http://localhost:5173

## Production

- Do **not** expose News API key in the client.
- The backend will proxy /api/news/\* and handle sessions and favorites.
