import React, { useState } from "react";
import { API_BASE } from "./api";

// Категории
const CATEGORY_OPTIONS = [
  { id: "clothes", label: "Одежда / Обувь" },
  { id: "electronics", label: "Электроника" },
  { id: "food", label: "Продовольствие" },
  { id: "services", label: "Услуги" },
  { id: "other", label: "Другое" },
];

export default function ListingList({ listings, user, onDelete }) {
  const [filterCategories, setFilterCategories] = useState([]);

  // ФИЛЬТРАЦИЯ
  const filteredListings = listings.filter((listing) => {
    if (!listing.categories) return true;

    // если фильтры не выбраны → показать всё
    if (filterCategories.length === 0) return true;

    // показать если совпадает хотя бы 1 категория
    return listing.categories.some((c) => filterCategories.includes(c));
  });

  const handleDelete = (id) => {
    if (window.confirm("Удалить объявление?")) {
      fetch(`${API_BASE}/listings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tg_id: user.id }),
      })
        .then((res) => res.json())
        .then(() => onDelete())
        .catch((err) => console.error(err));
    }
  };

  const openChat = (listing) => {
    const text = encodeURIComponent(
      `Интересует объявление: ${listing.title}`,
    );
    window.open(`https://t.me/${listing.username}?text=${text}`, "_blank");
  };

  return (
    <div>
      <div style={{ marginBottom: 10, textAlign: "left" }}>
        <div className="market-filters-title">Фильтр по категориям</div>
        <div className="pill-checkbox-row">
          {CATEGORY_OPTIONS.map((cat) => (
            <label key={cat.id} className="pill-checkbox">
              <input
                type="checkbox"
                value={cat.id}
                checked={filterCategories.includes(cat.id)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterCategories((prev) =>
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

      {filteredListings.length === 0 && (
        <p className="market-empty">Нет объявлений по выбранным фильтрам</p>
      )}

      <div className="market-grid">
        {filteredListings.map((listing) => {
          const isOwner = listing.owner_tg_id === user.id;
          const isAdmin = user.id === 410430521;
          const showPendingBadge =
            listing.status === "pending" && listing.owner_tg_id === user.id;
          const priceLabel = listing.price || "Цена по договоренности";

          return (
            <div
              key={listing.id}
              className="product-card"
              onClick={() => openChat(listing)}
            >
              {listing.images && listing.images.length > 0 && (
                <img
                  className="product-image"
                  src={`${API_BASE.replace("/api", "")}/${listing.images[0]}`}
                  alt={listing.title}
                />
              )}

              <div className="product-title">{listing.title}</div>
              <div className="product-price">{priceLabel}</div>

              {showPendingBadge && (
                <div
                  className="status-chip status-chip-pending"
                  style={{ marginBottom: 4 }}
                >
                  На модерации
                </div>
              )}

              {listing.categories && listing.categories.length > 0 && (
                <div className="product-details">
                  Категории:{" "}
                  {listing.categories
                    .map(
                      (catId) => CATEGORY_OPTIONS.find((c) => c.id === catId)?.label,
                    )
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}

              {listing.description && (
                <div className="product-details">{listing.description}</div>
              )}

              <button
                type="button"
                className="product-buy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openChat(listing);
                }}
              >
                Написать продавцу
              </button>

              {(isOwner || isAdmin) && (
                <button
                  type="button"
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    background: isAdmin ? "#e13238" : "#ffffff",
                    color: isAdmin ? "#ffffff" : "#e13238",
                    borderRadius: 999,
                    border: "1px solid #e13238",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(listing.id);
                  }}
                >
                  {isAdmin ? "Удалить (админ)" : "Удалить"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
