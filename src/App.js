import React, { useState, useEffect } from "react";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";

function App() {
  const tg = window.Telegram?.WebApp;
  const [user, setUser] = useState(null); // Будем хранить TG user data
  const [listings, setListings] = useState([]);

  const fetchListings = () => {
    fetch(`${API_BASE}/listings`)
      .then((res) => res.json())
      .then((data) => setListings(data))
      .catch(err => console.error("Error fetching listings:", err));
  };

  useEffect(() => {
    if (tg) {
      tg.ready(); // Готовы
      tg.expand(); // Полный экран
      const initDataUnsafe = tg.initDataUnsafe || {}; // Безопасно берём данные
      if (initDataUnsafe.user) {
        setUser(initDataUnsafe.user); // Сохраняем user (id, username, etc.)
        console.log("TG User:", initDataUnsafe.user); // Для дебага в консоли
      } else {
        console.log("No user data in initDataUnsafe");
      }
    } else {
      console.log("Not in TG WebApp");
    }
    fetchListings(); // Загружаем listings сразу
  }, []);

  return (
    <div className="App">
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
        <p>Запусти меня внутри Telegram Mini App!</p>
      )}
    </div>
  );
}

export default App;