import React, { useState, useEffect } from "react";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";

function App() {
  const [debugInfo, setDebugInfo] = useState("Проверяю TG...");
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [listings, setListings] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);

  const fetchListings = () => {
    fetch(`${API_BASE}/listings`)
      .then((res) => res.json())
      .then((data) => setListings(data))
      .catch(err => setDebugInfo(`Ошибка listings: ${err.message}`));
  };

  const fetchUserStatus = async () => {
    if (!user) return;
    const formData = new FormData();
    formData.append("tg_id", user.id);
    formData.append("username", user.username || '');

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, body: ${text}`);
      }
      const data = await res.json();
      console.log('Status response:', data);
      setUserStatus(data.status || 'not_registered');
    } catch (err) {
      setDebugInfo(`Ошибка status: ${err.message}`);
      setUserStatus('not_registered');
    }
  };

  const fetchPending = () => {
    fetch(`${API_BASE}/admin/pending?tg_id=${user.id}`)
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(`HTTP error! status: ${res.status}, body: ${text}`); });
        }
        return res.json();
      })
      .then(data => setPendingUsers(data))
      .catch(err => setDebugInfo(`Admin error: ${err.message}`));
  };

  const fetchPendingListings = () => {
    fetch(`${API_BASE}/admin/pending_listings?tg_id=${user.id}`)
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(`HTTP error! status: ${res.status}, body: ${text}`); });
        }
        return res.json();
      })
      .then(data => setPendingListings(data))
      .catch(err => setDebugInfo(`Pending listings error: ${err.message}`));
  };

  const approveUser = (id) => {
    fetch(`${API_BASE}/admin/approve/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(`HTTP error! status: ${res.status}, body: ${text}`); });
        }
        return res.json();
      })
      .then(() => {
        fetchPending();
        fetchUserStatus();
      })
      .catch(err => setDebugInfo(`Approve error: ${err.message}`));
  };

  const approveListing = (id) => {
    fetch(`${API_BASE}/admin/approve_listing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(`HTTP error! status: ${res.status}, body: ${text}`); });
        }
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Approve listing error: ${err.message}`));
  };

  const deleteListing = (id) => {
    fetch(`${API_BASE}/listings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(`HTTP error! status: ${res.status}, body: ${text}`); });
        }
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Delete listing error: ${err.message}`));
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
          setDebugInfo("TG найден, но нет user data.");
        }
      } else {
        setDebugInfo("window.Telegram.WebApp не найден.");
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserStatus();
      fetchListings();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id === 410430521) {
      fetchPending();
      fetchPendingListings();
    }
  }, [user]);

  if (!user) return <p>{debugInfo}</p>;

  return (
    <div className="App">
      <p>Debug: {debugInfo}</p>
      <p>Привет, {user.username || "пользователь"}! (TG ID: {user.id})</p>

      {userStatus === null && <p>Загрузка статуса...</p>}
      {userStatus === 'not_registered' && <Register user={user} onRegister={fetchUserStatus} />}
      {userStatus === 'pending' && (
        <p>
          Твоя заявка на проверке у админа. Жди подтверждения.
          <button onClick={fetchUserStatus}>Обновить</button>
        </p>
      )}
      {userStatus === 'approved' && (
        <>
          <CreateListing user={user} onCreate={fetchUserStatus} />
          <hr />
          <ListingList listings={listings} user={user} onDelete={fetchListings} />
        </>
      )}

      {/* Админ панель */}
      {user && user.id === 410430521 && (
        <div>
          <hr />
          <h2>Admin Panel (Pending Users)</h2>
          {pendingUsers.length === 0 && <p>Нет заявок</p>}
          <ul>
            {pendingUsers.map(u => (
              <li key={u.id}>
                {u.username || "No username"} — {u.dorm}
                <br />
                <img src={`${API_BASE.replace('/api', '')}/${u.photo_path}`} alt="propusk" width="100" />
                <button onClick={() => approveUser(u.id)}>Approve</button>
              </li>
            ))}
          </ul>
          <h2>Pending Listings</h2>
          {pendingListings.length === 0 && <p>Нет объявлений на модерации</p>}
          <ul>
            {pendingListings.map(l => (
              <li key={l.id}>
                {l.title} by {l.username}
                <p>{l.description}</p>
                <div style={{ display: "flex", gap: "5px" }}>
                  {l.images.map((img, idx) => (
                    <img key={idx} src={`${API_BASE.replace('/api', '')}/${img}`} alt="" width="100" />
                  ))}
                </div>
                <button onClick={() => approveListing(l.id)}>Approve</button>
                <button onClick={() => deleteListing(l.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;