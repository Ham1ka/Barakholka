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
    formData.append("username", user.username || "");

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "declined") {
        alert(
          "Ваша заявка отклонена.\nПричина: " +
            (data.decline_reason || "не указана"),
        );
      }
      if (data.status === "blocked") {
        alert(
          "Вы заблокированы.\nПричина: " +
            (data.block_reason || "не указана"),
        );
      }
      setMessage(data.message);
      if (onRegister) onRegister(); // Refresh status
    } catch (err) {
      setMessage("Ошибка");
    }
  };

  return (
    <div className="form-card">
      <h3 className="form-title">Регистрация в барахолке</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Общежитие и комната</label>
          <input
            type="text"
            className="form-input"
            placeholder="Например: 3 корпус, комната 412"
            value={dorm}
            onChange={(e) => setDorm(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Фото пропуска / студенческого</label>
          <input
            type="file"
            className="form-file-input"
            onChange={(e) => setPhoto(e.target.files[0])}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Отправить
          </button>
          {user?.status === "declined" && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onRegister()}
            >
              Отправить заявку заново
            </button>
          )}
        </div>
      </form>
      {message && <p className="app-debug">{message}</p>}
    </div>
  );
}