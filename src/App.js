import React, { useState, useEffect } from "react";
import "./App.css";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";
import AdminPanel from "./AdminPanel";

function App() {
  const [debugInfo, setDebugInfo] = useState("Проверяю TG...");
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  const fetchListings = () => {
    fetch(`${API_BASE}/listings`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setDebugInfo("Бэкенд недоступен, показываю пустую ленту объявлений.");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setDebugInfo(`Сеть/сервер недоступен: ${err.message}`);
        setListings([]);
      });
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
      <div className="app-shell">
        <header className="app-header-bar">
          <div className="app-header-title">Барахолка РУТ</div>
          <button className="app-header-cart">
            <span className="app-header-cart-icon">🛒</span>
            <span>Корзина</span>
          </button>
        </header>

        <main className="app-main">
          <div className="app-main-inner">
            <p className="app-debug">Debug: {debugInfo}</p>

            {user ? (
              <>
                <p className="app-greeting">
                  Привет, {user.username || "пользователь"}! (TG ID: {user.id})
                </p>

                <Register />
                <hr className="app-section-separator" />

                <CreateListing onCreate={fetchListings} />
                <hr className="app-section-separator" />

                <ListingList listings={listings} />

                {user && user.id === 410430521 && (
                  <>
                    <hr className="app-section-separator" />
                    <AdminPanel />
                  </>
                )}
              </>
            ) : (
              <p>Не в TG Mini App. Запусти через бот!</p>
            )}
          </div>
        </main>

        <footer className="app-footer">
          <div className="app-footer-title">Барахолка РУТ</div>
          <p className="app-footer-text">Контакты: укажи здесь ссылку на чат или бота.</p>
          <p className="app-footer-text">Тех. поддержка: добавь @username администратора.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;