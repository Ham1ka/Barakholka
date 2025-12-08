import React, { useState, useEffect } from "react";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import { API_BASE } from "./api";

const ADMIN_TG_ID = 410430521;
// Поставь здесь юзернейм админа, чтобы кнопка "Связаться с админом" работала.
// Если не знаешь — оставь пустым и кнопка просто покажет id в alert.
const ADMIN_USERNAME = "@youarenoname";

function App() {
  const [debugInfo, setDebugInfo] = useState("Проверяю TG...");
  const [user, setUser] = useState(null); // tg initDataUnsafe.user
  const [userStatus, setUserStatus] = useState(null); // 'not_registered' | 'pending' | 'approved' | 'declined' | 'blocked'
  const [blockReason, setBlockReason] = useState(null);
  const [listings, setListings] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);

  // Получаем ленту (теперь с ?tg_id= чтобы бэкенд отфильтровал dorm)
  const fetchListings = () => {
    if (!user) return;
    fetch(`${API_BASE}/listings?tg_id=${user.id}`)
      .then((res) => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then((data) => setListings(data))
      .catch(err => setDebugInfo(`Ошибка listings: ${err.message}`));
  };

  // Проверка/регистрация пользователя (возвращает статус)
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
      setBlockReason(data.block_reason || null);
    } catch (err) {
      setDebugInfo(`Ошибка status: ${err.message}`);
      setUserStatus('not_registered');
    }
  };

  // Admin: pending users
  const fetchPending = () => {
    if (!user) return;
    fetch(`${API_BASE}/admin/pending?tg_id=${user.id}`)
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(data => setPendingUsers(data))
      .catch(err => setDebugInfo(`Admin error: ${err.message}`));
  };

  // Admin: pending listings
  const fetchPendingListings = () => {
    if (!user) return;
    fetch(`${API_BASE}/admin/pending_listings?tg_id=${user.id}`)
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(data => setPendingListings(data))
      .catch(err => setDebugInfo(`Pending listings error: ${err.message}`));
  };

  // Admin actions for users
  const approveUser = (id) => {
    fetch(`${API_BASE}/admin/approve/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => {
        fetchPending();
      })
      .catch(err => setDebugInfo(`Approve error: ${err.message}`));
  };

  const declineUser = (id) => {
    if (!window.confirm("Отклонить заявку пользователя?")) return;
    fetch(`${API_BASE}/admin/decline/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => fetchPending())
      .catch(err => setDebugInfo(`Decline error: ${err.message}`));
  };

  const blockUser = (id) => {
    const reason = window.prompt("Причина блокировки (необязательно):", "");
    if (!window.confirm("Заблокировать пользователя?")) return;
    fetch(`${API_BASE}/admin/block_user/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id, reason })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => {
        fetchPending();
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Block error: ${err.message}`));
  };

  const unblockUser = (id) => {
    if (!window.confirm("Разблокировать пользователя?")) return;
    fetch(`${API_BASE}/admin/unblock_user/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => {
        fetchPending();
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Unblock error: ${err.message}`));
  };

  // Admin actions for listings
  const approveListing = (id) => {
    fetch(`${API_BASE}/admin/approve_listing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Approve listing error: ${err.message}`));
  };

  const deleteListing = (id) => {
    // for owner or admin
    fetch(`${API_BASE}/listings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id })
    })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch(err => setDebugInfo(`Delete listing error: ${err.message}`));
  };

  // Init Telegram WebApp
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

  // После получения user — проверяем статус и грузим ленту
  useEffect(() => {
    if (user) {
      fetchUserStatus();
      fetchListings();
    }
  }, [user]);

  // Если админ — подгружаем страницы модерации
  useEffect(() => {
    if (user && user.id === ADMIN_TG_ID) {
      fetchPending();
      fetchPendingListings();
    }
  }, [user]);

  // UI рендер для разных статусов
  if (!user) return <p>{debugInfo}</p>;

  // BLOCKED screen
  if (userStatus === 'blocked') {
    return (
      <div style={{ padding: 20 }}>
        <h2>Ваша учётная запись заблокирована</h2>
        {blockReason && <p><strong>Причина:</strong> {blockReason}</p>}
        <p>Если считаете, что это ошибка — свяжитесь с администратором.</p>
        <div style={{ marginTop: 12 }}>
          {ADMIN_USERNAME
            ? <button onClick={() => window.open(`https://t.me/${ADMIN_USERNAME}`, "_blank")}>Связаться с админом</button>
            : <button onClick={() => alert(`Свяжитесь с админом: TG ID ${ADMIN_TG_ID}`)}>Связаться с админом</button>
          }
        </div>
      </div>
    );
  }

  // DECLINED screen — показать причину (если есть) и дать форму регистрации заново
  if (userStatus === 'declined') {
    return (
      <div style={{ padding: 20 }}>
        <h2>Заявка отклонена</h2>
        <p>Ваша регистрация не прошла модерацию. Попробуйте отправить заявку заново.</p>
        <Register user={user} onRegister={fetchUserStatus} />
      </div>
    );
  }

  // NOT REGISTERED -> show Register
  if (userStatus === 'not_registered') {
    return (
      <div style={{ padding: 20 }}>
        <p>Тебя не нашли в базе — пожалуйста, зарегистрируйся:</p>
        <Register user={user} onRegister={fetchUserStatus} />
      </div>
    );
  }

  // PENDING -> show message + option to refresh
  if (userStatus === 'pending') {
    return (
      <div style={{ padding: 20 }}>
        <p>Твоя заявка на проверке у админа. Жди подтверждения.</p>
        <button onClick={fetchUserStatus}>Обновить статус</button>
      </div>
    );
  }

  // APPROVED and everything else (default) -> main app
  return (
    <div className="App" style={{ padding: 20 }}>
      <p>Debug: {debugInfo}</p>
      <p>Привет, {user.username || "пользователь"}! (TG ID: {user.id})</p>

      {/* Create + feed */}
      {userStatus === 'approved' && (
        <>
          <CreateListing user={user} onCreate={() => { fetchListings(); }} />
          <hr />
          <ListingList listings={listings} user={user} onDelete={() => fetchListings()} />
        </>
      )}

      {/* Admin panel */}
      {user && user.id === ADMIN_TG_ID && (
        <div style={{ marginTop: 30 }}>
          <hr />
          <h2>Admin Panel — Pending Users</h2>
          {pendingUsers.length === 0 && <p>Нет заявок</p>}
          <ul>
            {pendingUsers.map(u => (
              <li key={u.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>{u.username || "No username"}</strong> — {u.dorm} (id: {u.id})
                </div>
                {u.photo_path && (
                  <div>
                    <img src={`${API_BASE.replace('/api', '')}/${u.photo_path}`} alt="propusk" width="100" />
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => approveUser(u.id)} style={{ marginRight: 8 }}>Approve</button>
                  <button onClick={() => declineUser(u.id)} style={{ marginRight: 8 }}>Decline</button>
                  <button onClick={() => blockUser(u.id)} style={{ marginRight: 8 }}>Block</button>
                </div>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: 20 }}>Pending Listings</h2>
          {pendingListings.length === 0 && <p>Нет объявлений на модерации</p>}
          <ul>
            {pendingListings.map(l => (
              <li key={l.id} style={{ marginBottom: 12 }}>
                <div><strong>{l.title}</strong> by {l.username}</div>
                <p>{l.description}</p>
                <div style={{ display: "flex", gap: "5px", marginBottom: 6 }}>
                  {l.images.map((img, idx) => (
                    <img key={idx} src={`${API_BASE.replace('/api', '')}/${img}`} alt="" width="100" />
                  ))}
                </div>
                <div>
                  <button onClick={() => approveListing(l.id)} style={{ marginRight: 8 }}>Approve</button>
                  <button onClick={() => deleteListing(l.id)} style={{ marginRight: 8 }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: 20 }}>All Users (manage)</h2>
          <p>Список всех пользователей (админская функция для поиска/блокировки).</p>
          <ManageUsersPanel adminTg={user.id} onBlock={blockUser} onUnblock={unblockUser} onRefresh={fetchPending} />
        </div>
      )}
    </div>
  );
}

// Вспомогательный простой компонент для управления (админ)
function ManageUsersPanel({ adminTg, onBlock, onUnblock, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [debug, setDebug] = useState("");

  const fetchAll = () => {
    fetch(`${API_BASE}/admin/all_users?tg_id=${adminTg}`)
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(`HTTP error! status: ${res.status}, body: ${t}`); });
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setDebug(`Fetch users err: ${err.message}`));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div>
      <button onClick={() => { fetchAll(); onRefresh && onRefresh(); }}>Refresh users</button>
      {debug && <p>{debug}</p>}
      <ul>
        {users.map(u => (
          <li key={u.id} style={{ marginBottom: 8 }}>
            {u.username || "No username"} — {u.dorm} — {u.status}
            <div style={{ marginTop: 6 }}>
              {u.status !== 'blocked' ? (
                <button onClick={() => onBlock(u.id)} style={{ marginRight: 8 }}>Block</button>
              ) : (
                <button onClick={() => onUnblock(u.id)} style={{ marginRight: 8 }}>Unblock</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
