# 📌 NewsApp — Full‑Stack News Aggregator

React + Vite + Node/Express + MongoDB Atlas + NewsAPI

This project is a full‑stack news aggregator application with:

*   🔐 **Session‑based authentication** (register, login, logout)
*   📰 **News fetching via backend proxy** (NewsAPI key stays secret)
*   ⭐ **User favorites** (saved articles stored in MongoDB)
*   🔧 **Mongoose models & validation**
*   ⚡ **Vite front‑end dev server**
*   🧱 **Modular Express backend**
*   🛡 **Secure cookie sessions** & CORS
*   🌐 **MongoDB Atlas for persistent storage**

***

# 🚀 Features

### **Frontend**

*   React 18 + Vite
*   Bootstrap UI
*   Pagination, Search, Article view with fallbacks
*   Automatic redirect guards (Favorites)
*   Navbar that reacts to login/logout state
*   Axios with cookie‑based auth

### **Backend**

*   Express API
*   MongoDB Atlas + Mongoose
*   Session authentication (`express-session + connect-mongo`)
*   Fully proxied NewsAPI calls (**no API key exposed to frontend**)
*   Zod input validation
*   Safe error handling
*   Corporate network TLS support

***

# 📂 Project Structure

    newsapp/
     ├─ frontend/       # React + Vite
     │   ├─ src/
     │   └─ vite.config.js
     │
     ├─ backend/        # Node + Express + MongoDB
     │   ├─ src/
     │   │   ├─ routes/
     │   │   ├─ models/
     │   │   ├─ middleware/
     │   │   ├─ config/
     │   │   ├─ db/
     │   │   └─ server.js
     │   ├─ .env        # must be created manually
     │   └─ package.json
     │
     └─ README.md

***

# 🛠 Installation & Setup (After Cloning)

## 1️⃣ Install dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

***

# 🔑 2️⃣ Create Required `.env` Files

## **Backend `.env` (required)**

Create:

    backend/.env

Paste this:

    # Server
    PORT=5000
    NODE_ENV=development
    CLIENT_ORIGIN=http://localhost:5173

    # Sessions
    SESSION_NAME=sid
    SESSION_SECRET=<GENERATE_RANDOM_SECRET>
    SESSION_TTL_DAYS=7

    # MongoDB Atlas
    MONGODB_URI=<your MongoDB Atlas connection string>

    # News API
    NEWS_API_KEY=<your NewsAPI key>
    NEWS_API_BASE=https://newsapi.org

    # Corporate network TLS fix (only if needed)
    # NODE_EXTRA_CA_CERTS=C:\path\to\your\company-root-ca.pem

To generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

***

## **Frontend `.env` (optional)**

Create:

    frontend/.env

<!---->

    VITE_API_BASE=/api

***

# 3️⃣ Configure the Vite Dev Proxy

Make sure:

**`frontend/vite.config.js`**

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

This ensures the frontend can reach the backend via `/api/...`.

***

# 4️⃣ Start Servers

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Visit:

    http://localhost:5173

***

# 🌐 5️⃣ MongoDB Atlas Setup

Every developer must:

### 1. Create a free cluster

<https://www.mongodb.com/cloud/atlas>

### 2. Create a Database User

“Database Access” → Add User

*   Username: anything
*   Password: anything
*   Role: **readWriteAnyDatabase** (dev)

### 3. Allow your IP

“Network Access” → Add IP

*   Use your current IP
*   Or `0.0.0.0/0` for development only

### 4. Copy your connection string

Example:

    mongodb+srv://<user>:<pw>@cluster.mongodb.net/newsapp

Paste into backend `.env` as:

    MONGODB_URI=your_connection_string

***

# 🔐 6️⃣ Corporate Network TLS Fix

If backend logs show:

    unable to get local issuer certificate

Your company intercepts HTTPS traffic.

### Fix:

1.  Export your company’s root CA as `.pem`
2.  Add to `.env`:
        NODE_EXTRA_CA_CERTS=C:\path\to\rootCA.pem
3.  Restart backend

***

# 🧪 7️⃣ Test the API

### Backend health

    http://localhost:5000/api/health

### News proxy

    http://localhost:5000/api/news/top-headlines?country=us&pageSize=3

### Auth

*   Register from `/register`
*   Login from `/login`
*   Check session:
        GET /api/auth/me

***

# ⭐ 8️⃣ Features Implemented

### Authentication

*   Register
*   Login
*   Logout
*   Session-based cookie auth
*   Silent 401 handling

### News

*   Fully proxied `/api/news/*` routes:
    *   `/top-headlines`
    *   `/everything`
    *   `/sources`
*   Backend attaches API key server-side
*   Frontend never exposes the key

### Favorites

*   `/api/favorites` (authenticated)
*   Add / List / Remove
*   Uses MongoDB documents per user

***

# 📎 9️⃣ Scripts

### Backend

```bash
npm run dev   # start with nodemon
npm start     # production start
```

### Frontend

```bash
npm run dev   # start Vite dev server
npm run build
npm run preview
```

***