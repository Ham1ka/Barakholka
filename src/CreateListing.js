import React, { useState } from "react";
import { API_BASE } from "./api";

export default function CreateListing({ onCreate }) {
  const [userId, setUserId] = useState("1"); // пример: подтверждённый юзер
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Продать");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !title || !description) {
      setMessage("Заполните все обязательные поля!");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("price", price);
    for (let i = 0; i < photos.length; i++) {
      formData.append("photos", photos[i]);
    }

    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Ответ сервера:", data);
      setMessage(data.message);

      // 🔥 обновляем ленту объявлений
      if (onCreate) onCreate();

      // чистим форму
      setTitle("");
      setDescription("");
      setPrice("");
      setPhotos([]);
    } catch (err) {
      console.error("Ошибка при отправке:", err);
      setMessage("Ошибка при создании объявления");
    }
  };

  return (
    <div>
      <h2>Создать объявление</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Продать</option>
          <option>Обменять</option>
        </select>
        <input
          type="text"
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="file"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
        />
        <button type="submit">Создать</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
