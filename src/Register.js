import React, { useState } from "react";
import { API_BASE } from "./api";

export default function Register({ user, onRegister }) {
  const [dorm, setDorm] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("dorm", dorm);
    formData.append("photo", photo);
    formData.append("tg_id", user.id);
    formData.append("username", user.username || '');

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'declined') {
        alert("Ваша заявка отклонена.\nПричина: " + (data.decline_reason || "не указана"));
      }
      if (data.status === 'blocked') {
        alert("Вы заблокированы.\nПричина: " + (data.block_reason || "не указана"));
      }
      setMessage(data.message);
      if (onRegister) onRegister(); // Refresh status
    } catch (err) {
      setMessage("Ошибка");
    }
  };

  return (
    <div>
      <h2>Регистрация в барахолке</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Корпус и комната"
          value={dorm}
          onChange={(e) => setDorm(e.target.value)}
          required
        />
        <input
          type="file"
          onChange={(e) => setPhoto(e.target.files[0])}
          required
        />
        <button type="submit">Отправить</button>
        {user?.status === "declined" && (
          <button type="button" onClick={() => onRegister()}>
            Отправить заявку заново
          </button>
        )}
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}