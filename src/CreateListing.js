import React, { useState } from "react";
import { API_BASE } from "./api";

const CATEGORY_OPTIONS = [
  { id: "clothes", label: "Одежда / Обувь" },
  { id: "electronics", label: "Электроника" },
  { id: "food", label: "Продовольствие" },
  { id: "services", label: "Услуги" },
  { id: "other", label: "Другое" },
];

export default function CreateListing({ user, onCreate }) {
  const userStatus = user?.status;
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

    if (userStatus === "blocked") {
      alert("Вы заблокированы и не можете создавать объявления.");
      return;
    }
    if (userStatus === "declined") {
      alert("Ваша регистрация отклонена. Вы не можете создавать объявления.");
      return;
    }
    if (userStatus === "pending") {
      alert("Ваша заявка ещё не одобрена.");
      return;
    }

    for (let i = 0; i < photos.length; i += 1) {
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
      setTitle("");
      setDescription("");
      setType("Продать");
      setPrice("");
      setPhotos([]);
      setCategories([]);
    } catch (err) {
      setMessage("Ошибка");
    }
  };

  return (
    <div className="form-card">
      <h3 className="form-title">Новое объявление</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Заголовок</label>
          <input
            type="text"
            className="form-input"
            placeholder="Например: Продам ноутбук"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            className="form-textarea"
            placeholder="Состояние, комплектация, условия встречи..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Тип объявления</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Продать</option>
            <option>Обменять</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Цена (можно оставить пустым)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Например: 15000 ₽"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Категории</label>
          <div className="pill-checkbox-row">
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat.id} className="pill-checkbox">
                <input
                  type="checkbox"
                  value={cat.id}
                  checked={categories.includes(cat.id)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategories((prev) =>
                      prev.includes(value)
                        ? prev.filter((c) => c !== value)
                        : [...prev, value],
                    );
                  }}
                />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Фото товара</label>
          <input
            type="file"
            className="form-file-input"
            multiple
            onChange={(e) => setPhotos(e.target.files)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Создать
          </button>
        </div>
      </form>
      {message && <p className="app-debug">{message}</p>}
    </div>
  );
}
