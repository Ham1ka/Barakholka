import React, { useEffect, useState } from "react";
import { API_BASE } from "./api";

function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [debug, setDebug] = useState("");

  const tg = window.Telegram.WebApp;
  const tg_id = tg.initDataUnsafe?.user?.id;

  const fetchPending = () => {
    fetch(`${API_BASE}/admin/pending?tg_id=${tg_id}`)
      .then(res => res.json())
      .then(data => setPending(data))
      .catch(err => setDebug("Ошибка: " + err.message));
  };

  const approveUser = (id) => {
    fetch(`${API_BASE}/admin/approve/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id })
    })
      .then(res => res.json())
      .then(() => fetchPending());
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div>
      <h2>Admin Panel (Pending Users)</h2>
      <p>{debug}</p>
      {pending.length === 0 && <p>Нет заявок</p>}
      <ul>
        {pending.map(user => (
          <li key={user.id}>
            {user.username || "No username"} — {user.dorm}
            <button onClick={() => approveUser(user.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;
