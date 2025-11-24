import React, { useState, useEffect } from "react";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";

function App() {
  const tg = window.Telegram ? window.Telegram.WebApp : null;

  const [listings, setListings] = useState([]);

  const fetchListings = () => {
    fetch(`${API_BASE}/listings`)
      .then((res) => res.json())
      .then((data) => setListings(data));
  };

  useEffect(() => {
    if (tg) {
      tg.ready(); // мини-апп готова
      console.log("Telegram WebApp:", tg);
      tg.expand(); // разворачиваем максимальный размер
    } else {
      console.log("Not running inside Telegram WebApp");
    }
  }, []);

  return (
    <div className="App">
      <Register />
      <hr />
      <CreateListing onCreate={fetchListings} />
      <hr />
      <ListingList listings={listings} />
    </div>
  );
}

export default App;
