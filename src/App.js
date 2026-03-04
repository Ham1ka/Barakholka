import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
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

  // Получаем ленту (с учётом tg_id, чтобы бэкенд фильтровал по dorm)
  const fetchListings = useCallback(() => {
    if (!user) return;
    fetch(`${API_BASE}/listings?tg_id=${user.id}`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then((data) => setListings(data))
      .catch((err) => setDebugInfo(`Ошибка listings: ${err.message}`));
  }, [user]);

  // Проверка/регистрация пользователя (возвращает статус)
  const fetchUserStatus = useCallback(async () => {
    if (!user) return;
    const formData = new FormData();
    formData.append("tg_id", user.id);
    formData.append("username", user.username || "");

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
      console.log("Status response:", data);
      setUserStatus(data.status || "not_registered");
      setBlockReason(data.block_reason || null);
    } catch (err) {
      setDebugInfo(`Ошибка status: ${err.message}`);
      setUserStatus("not_registered");
    }
  }, [user]);

  // Admin: pending users
  const fetchPending = useCallback(() => {
    if (!user) return;
    fetch(`${API_BASE}/admin/pending?tg_id=${user.id}`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then((data) => setPendingUsers(data))
      .catch((err) => setDebugInfo(`Admin error: ${err.message}`));
  }, [user]);

  // Admin: pending listings
  const fetchPendingListings = useCallback(() => {
    if (!user) return;
    fetch(`${API_BASE}/admin/pending_listings?tg_id=${user.id}`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then((data) => setPendingListings(data))
      .catch((err) => setDebugInfo(`Pending listings error: ${err.message}`));
  }, [user]);

  // Admin actions for users
  const approveUser = (id) => {
    fetch(`${API_BASE}/admin/approve/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        fetchPending();
      })
      .catch((err) => setDebugInfo(`Approve error: ${err.message}`));
  };

  const declineUser = (id) => {
    if (!window.confirm("Отклонить заявку пользователя?")) return;
    fetch(`${API_BASE}/admin/decline/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => fetchPending())
      .catch((err) => setDebugInfo(`Decline error: ${err.message}`));
  };

  const blockUser = (id) => {
    const reason = window.prompt("Причина блокировки (необязательно):", "");
    if (!window.confirm("Заблокировать пользователя?")) return;
    fetch(`${API_BASE}/admin/block_user/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id, reason }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        fetchPending();
        fetchPendingListings();
        fetchListings();
      })
      .catch((err) => setDebugInfo(`Block error: ${err.message}`));
  };

  const unblockUser = (id) => {
    if (!window.confirm("Разблокировать пользователя?")) return;
    fetch(`${API_BASE}/admin/unblock_user/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        fetchPending();
        fetchPendingListings();
        fetchListings();
      })
      .catch((err) => setDebugInfo(`Unblock error: ${err.message}`));
  };

  // Admin actions for listings
  const approveListing = (id) => {
    fetch(`${API_BASE}/admin/approve_listing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch((err) => setDebugInfo(`Approve listing error: ${err.message}`));
  };

  const deleteListing = (id) => {
    // for owner or admin
    fetch(`${API_BASE}/listing/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: user.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        fetchPendingListings();
        fetchListings();
      })
      .catch((err) => setDebugInfo(`Delete listing error: ${err.message}`));
  };

  // Init Telegram WebApp
  useEffect(() => {
    const script = document.createElement("script");
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
          setDebugInfo(
            `TG User OK: ID ${initDataUnsafe.user.id}, Username ${
              initDataUnsafe.user.username || "none"
            }`,
          );
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
  }, [user, fetchUserStatus, fetchListings]);

  // Если админ — подгружаем страницы модерации
  useEffect(() => {
    if (user && user.id === ADMIN_TG_ID) {
      fetchPending();
      fetchPendingListings();
    }
  }, [user, fetchPending, fetchPendingListings]);

  const isApproved = user && userStatus === "approved";

  const renderStatusCard = () => {
    if (!user) {
      return (
        <div className="status-card">
          <h2 className="status-card-title">Ожидаю данные Telegram</h2>
          <p className="status-card-text">{debugInfo}</p>
        </div>
      );
    }

    if (userStatus === "blocked") {
      return (
        <div className="status-card">
          <h2 className="status-card-title">Ваша учётная запись заблокирована</h2>
          {blockReason && (
            <p className="status-card-text">
              <strong>Причина:</strong> {blockReason}
            </p>
          )}
          <p className="status-card-text">
            Если считаете, что это ошибка — свяжитесь с администратором.
          </p>
          <div className="status-card-actions">
            {ADMIN_USERNAME ? (
              <button
                className="btn-primary"
                type="button"
                onClick={() => window.open(`https://t.me/${ADMIN_USERNAME}`, "_blank")}
              >
                Связаться с админом
              </button>
            ) : (
              <button
                className="btn-primary"
                type="button"
                onClick={() =>
                  alert(`Свяжитесь с админом: TG ID ${ADMIN_TG_ID}`)
                }
              >
                Связаться с админом
              </button>
            )}
          </div>
        </div>
      );
    }

    if (userStatus === "declined") {
      return (
        <div className="status-card">
          <h2 className="status-card-title">Заявка отклонена</h2>
          <p className="status-card-text">
            Ваша регистрация не прошла модерацию. Попробуйте отправить заявку заново.
          </p>
          <Register user={user} onRegister={fetchUserStatus} />
        </div>
      );
    }

    if (userStatus === "not_registered") {
      return (
        <div className="status-card">
          <h2 className="status-card-title">Регистрация</h2>
          <p className="status-card-text">
            Тебя не нашли в базе — пожалуйста, зарегистрируйся.
          </p>
          <Register user={user} onRegister={fetchUserStatus} />
        </div>
      );
    }

    if (userStatus === "pending") {
      return (
        <div className="status-card">
          <h2 className="status-card-title">Заявка на проверке</h2>
          <p className="status-card-text">
            Твоя заявка на проверке у админа. Жди подтверждения.
          </p>
          <div className="status-card-actions">
            <button
              className="btn-primary"
              type="button"
              onClick={fetchUserStatus}
            >
              Обновить статус
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="App">
      <div className="app-shell">
        <header className="app-header-bar">
          <div className="app-header-title">
            <span>Барахолка РУТ</span>
          </div>
          <button className="app-header-cart" type="button">
            <span className="app-header-cart-icon">🛒</span>
            <span>Корзина</span>
          </button>
        </header>

        <main className="app-main">
          <div className="app-main-inner">
            <div className="app-debug">Debug: {debugInfo}</div>

            {user && (
              <p className="app-greeting">
                Привет, {user.username || "пользователь"}! (TG ID: {user.id})
              </p>
            )}

            {renderStatusCard()}

            {isApproved && (
              <>
                <hr className="app-section-separator" />
                <div className="market-layout">
                  <aside className="market-filters">
                    <div className="market-filters-title">Создать объявление</div>
                    <CreateListing user={user} onCreate={fetchListings} />
                  </aside>
                  <section className="market-products">
                    <div className="market-products-header">Товары</div>
                    <ListingList
                      listings={listings}
                      user={user}
                      onDelete={fetchListings}
                    />
                  </section>
                </div>
              </>
            )}

            {user && user.id === ADMIN_TG_ID && (
              <>
                <hr className="app-section-separator" />
                <div>
                  <h2>Admin Panel — Pending Users</h2>
                  {pendingUsers.length === 0 && <p>Нет заявок</p>}
                  <ul>
                    {pendingUsers.map((u) => (
                      <li key={u.id} style={{ marginBottom: 12 }}>
                        <div>
                          <strong>{u.username || "No username"}</strong> — {u.dorm} (id:{" "}
                          {u.id})
                        </div>
                        {u.photo_path && (
                          <div>
                            <img
                              src={`${API_BASE.replace("/api", "")}/${u.photo_path}`}
                              alt="propusk"
                              width="100"
                            />
                          </div>
                        )}
                        <div style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => approveUser(u.id)}
                            style={{ marginRight: 8 }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => declineUser(u.id)}
                            style={{ marginRight: 8 }}
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => blockUser(u.id)}
                            style={{ marginRight: 8 }}
                          >
                            Block
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <h2 style={{ marginTop: 20 }}>Pending Listings</h2>
                  {pendingListings.length === 0 && (
                    <p>Нет объявлений на модерации</p>
                  )}
                  <ul>
                    {pendingListings.map((l) => (
                      <li key={l.id} style={{ marginBottom: 12 }}>
                        <div>
                          <strong>{l.title}</strong> by {l.username}
                        </div>
                        <p>{l.description}</p>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            marginBottom: 6,
                          }}
                        >
                          {l.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={`${API_BASE.replace("/api", "")}/${img}`}
                              alt=""
                              width="100"
                            />
                          ))}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => approveListing(l.id)}
                            style={{ marginRight: 8 }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteListing(l.id)}
                            style={{ marginRight: 8 }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <h2 style={{ marginTop: 20 }}>All Users (manage)</h2>
                  <p>Список всех пользователей (админская функция для поиска/блокировки).</p>
                  <ManageUsersPanel
                    adminTg={user.id}
                    onBlock={blockUser}
                    onUnblock={unblockUser}
                    onRefresh={fetchPending}
                  />
                </div>
              </>
            )}
          </div>
        </main>

        <footer className="app-footer">
          <div className="app-footer-title">Барахолка РУТ</div>
          <p className="app-footer-text">
            Контакты: укажи здесь ссылку на чат или бота.
          </p>
          <p className="app-footer-text">
            Тех. поддержка: добавь {ADMIN_USERNAME || "@username"} администратора.
          </p>
        </footer>
      </div>
    </div>
  );
}

// Вспомогательный простой компонент для управления (админ)
function ManageUsersPanel({ adminTg, onBlock, onUnblock, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [debug, setDebug] = useState("");

  const fetchAll = useCallback(() => {
    fetch(`${API_BASE}/admin/all_users?tg_id=${adminTg}`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${t}`);
          });
        }
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setDebug(`Fetch users err: ${err.message}`));
  }, [adminTg]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          fetchAll();
          onRefresh && onRefresh();
        }}
      >
        Refresh users
      </button>
      {debug && <p>{debug}</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id} style={{ marginBottom: 8 }}>
            {u.username || "No username"} — {u.dorm} — {u.status}
            <div style={{ marginTop: 6 }}>
              {u.status !== "blocked" ? (
                <button
                  type="button"
                  onClick={() => onBlock(u.id)}
                  style={{ marginRight: 8 }}
                >
                  Block
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onUnblock(u.id)}
                  style={{ marginRight: 8 }}
                >
                  Unblock
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
