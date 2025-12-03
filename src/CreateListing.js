import React, { useState } from "react";
import { API_BASE } from "./api";

const CATEGORY_OPTIONS = [
  { id: "clothes", label: "Одежда / Обувь" },
  { id: "electronics", label: "Электроника" },
  { id: "food", label: "Продовольствие" },
  { id: "services", label: "Услуги" },
  { id: "other", label: "Другое" }
];

export default function CreateListing({ user, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Продать");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("tg_id", user.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("price", price);
    formData.append("categories", JSON.stringify(categories));

    for (let i = 0; i < photos.length; i++) {
      formData.append("photos", photos[i]);
    }

    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (res.ok && onCreate) onCreate();
      setTitle(""); setDescription(""); setType("Продать"); setPrice(""); setPhotos([]); setCategories([]);
    } catch (err) {
      setMessage("Ошибка");
    }
  };

  return (
    <div>
      <h2>Создать объявление</h2>
      <form onSubmit={handleSubmit}>

        <input type="text" placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} required />
        
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Продать</option>
          <option>Обменять</option>
        </select>

        <input type="text" placeholder="Цена" value={price} onChange={(e) => setPrice(e.target.value)} />

        {/* 🔥 ВОТ ЭТО — КАТЕГОРИИ 🔥 */}
        <h4>Категории</h4>
        {CATEGORY_OPTIONS.map(cat => (
          <label key={cat.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              value={cat.id}
              checked={categories.includes(cat.id)}
              onChange={(e) => {
                const value = e.target.value;
                setCategories(prev =>
                  prev.includes(value)
                    ? prev.filter(c => c !== value)
                    : [...prev, value]
                );
              }}
            />
            {cat.label}
          </label>
        ))}

        <input type="file" multiple onChange={(e) => setPhotos(e.target.files)} />

        <button type="submit">Создать</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
