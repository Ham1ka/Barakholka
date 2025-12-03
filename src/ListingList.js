import React, { useState } from "react";
import { API_BASE } from "./api";

// Категории
const CATEGORY_OPTIONS = [
  { id: "clothes", label: "Одежда / Обувь" },
  { id: "electronics", label: "Электроника" },
  { id: "food", label: "Продовольствие" },
  { id: "services", label: "Услуги" },
  { id: "other", label: "Другое" }
];

export default function ListingList({ listings, user, onDelete }) {
  const [filterCategories, setFilterCategories] = useState([]);

  // ФИЛЬТРАЦИЯ
  const filteredListings = listings.filter(listing => {
    if (!listing.categories) return true;

    // если фильтры не выбраны → показать всё
    if (filterCategories.length === 0) return true;

    // показать если совпадает хотя бы 1 категория
    return listing.categories.some(c => filterCategories.includes(c));
  });

  const handleDelete = (id) => {
    if (window.confirm("Удалить объявление?")) {
      fetch(`${API_BASE}/listings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tg_id: user.id })
      })
        .then(res => res.json())
        .then(() => onDelete())
        .catch(err => console.error(err));
    }
  };

  return (
    <div>
      <h2>Лента объявлений</h2>

      {/* 🔥 ФИЛЬТРЫ ПО КАТЕГОРИЯМ */}
      <div style={{ marginBottom: "15px" }}>
        <h3>Фильтры</h3>

        {CATEGORY_OPTIONS.map(cat => (
          <label key={cat.id} style={{ marginRight: "12px" }}>
            <input
              type="checkbox"
              value={cat.id}
              checked={filterCategories.includes(cat.id)}
              onChange={(e) => {
                const value = e.target.value;
                setFilterCategories(prev =>
                  prev.includes(value)
                    ? prev.filter(c => c !== value)
                    : [...prev, value]
                );
              }}
            />
            {cat.label}
          </label>
        ))}
      </div>

      {/* 🔥 ЛЕНТА (ФИЛЬТРОВАННАЯ) */}
      {filteredListings.length === 0 && <p>Нет объявлений по выбранным фильтрам</p>}

      {filteredListings.map(listing => (
        <div
          key={listing.id}
          style={{
            border: "1px solid #ccc",
            margin: "10px 0",
            padding: "10px",
            borderRadius: "5px"
          }}
        >
          <h3>{listing.title}</h3>

          {/* Категории */}
          {listing.categories && listing.categories.length > 0 && (
            <p>
              Категории:{" "}
              {listing.categories
                .map(catId => CATEGORY_OPTIONS.find(c => c.id === catId)?.label)
                .join(", ")}
            </p>
          )}

          <p>{listing.description}</p>
          <p>Тип: {listing.type} | Цена: {listing.price}</p>

          {/* ФОТО */}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {listing.images.map((img, idx) => (
              <img
                key={idx}
                src={`${API_BASE.replace("/api", "")}/${img}`}
                alt=""
                width="100"
                style={{ borderRadius: "4px" }}
              />
            ))}
          </div>

          {/* КНОПКА "НАПИСАТЬ" */}
          <button
            style={{ marginTop: "10px" }}
            onClick={() =>
              window.open(
                `https://t.me/${listing.username}?text=Интересует объявление: ${listing.title}`,
                "_blank"
              )
            }
          >
            Написать продавцу
          </button>

          {/* ЕСЛИ ВЛАДЕЛЕЦ — МОЖНО УДАЛИТЬ */}
          {listing.owner_tg_id === user.id && (
            <button
              onClick={() => handleDelete(listing.id)}
              style={{ marginLeft: "10px", backgroundColor: "#ff6666" }}
            >
              Удалить
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
