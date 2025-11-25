import React, { useState, useEffect } from "react";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";

function App() {
  const [debugInfo, setDebugInfo] = useState("Проверяю TG...");
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  const fetchListings = () => {
    fetch(`${API_BASE}/listings`)
      .then((res) => res.json())
      .then((data) => setListings(data))
      .catch(err => setDebugInfo(`Ошибка listings: ${err.message}`));
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-web-app.js?59";
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        setDebugInfo("TG WebApp найден. Инициализирую...");
        tg.ready();
        tg.expand();
        const initDataUnsafe = tg.initDataUnsafe || {};
        if (initDataUnsafe.user) {
          setUser(initDataUnsafe.user);
          setDebugInfo(`TG User OK: ID ${initDataUnsafe.user.id}, Username ${initDataUnsafe.user.username || 'none'}`);
        } else {
          setDebugInfo("TG найден, но нет user data в initDataUnsafe. Попробуй перезапустить бот или очистить кэш TG.");
        }
      } else {
        setDebugInfo("window.Telegram.WebApp не найден. Убедись, что app открыт внутри TG Mini App (не в браузере). Проверь BotFather settings.");
      }
    }
    fetchListings();
  }, []);

  return (
    <div className="App">
      <p>Debug: {debugInfo}</p>
      {user ? (
        <>
          <p>Привет, {user.username || "пользователь"}! (TG ID: {user.id})</p>
          <Register />
          <hr />
          <CreateListing onCreate={fetchListings} />
          <hr />
          <ListingList listings={listings} />
        </>
      ) : (
        <p>Не в TG Mini App. Запусти через бот!</p>
      )}
    </div>
  );
}

export default App;