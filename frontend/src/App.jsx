// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import ArticleView from "./pages/ArticleView.jsx";
import Favorites from "./pages/Favorites.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx"; // <-- add this

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/article/:id" element={<ArticleView />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* new */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}
