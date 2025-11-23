import React, { useState } from "react";
import { API_BASE } from "./api";

export default function Register() {
  const [dorm, setDorm] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("dorm", dorm);
    formData.append("photo", photo);

    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setMessage(data.message);
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
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
