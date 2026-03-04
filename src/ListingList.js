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
  const [filterType, setFilterType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);

  const parsePrice = (price) => {
    if (!price) return Infinity;
    const digits = String(price).replace(/[^\d]/g, "");
    if (!digits) return Infinity;
    return parseInt(digits, 10);
  };

  // ФИЛЬТРАЦИЯ
  const filteredListings = listings.filter((listing) => {
    // категории
    if (filterCategories.length > 0) {
      const cats = listing.categories || [];
      const hasMatch = cats.some((c) => filterCategories.includes(c));
      if (!hasMatch) return false;
    }

    // тип объявления
    if (filterType !== "all") {
      if (!listing.type || listing.type !== filterType) return false;
    }

    // цена до
    if (maxPrice.trim() !== "") {
      const limit = parseInt(maxPrice, 10);
      if (!Number.isNaN(limit)) {
        const priceValue = parsePrice(listing.price);
        if (priceValue > limit) return false;
      }
    }

    return true;
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
        <div className="market-filters-title">Фильтры</div>
        <div className="market-filters-row" style={{ marginBottom: 8 }}>
          <div className="market-filters-col">
            <div className="market-filters-label">Тип объявления</div>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="Продать">Продать</option>
              <option value="Обменять">Обменять</option>
            </select>
          </div>
          <div className="market-filters-col">
            <div className="market-filters-label">Цена до (₽)</div>
            <input
              type="number"
              className="form-input"
              placeholder="Например: 15000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <div className="market-filters-label">Категории</div>
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
        <div className="market-empty-card">
          <div className="market-empty-title">Пока нет объявлений</div>
          <p className="market-empty-text">
            Попробуй изменить фильтры или создать своё первое объявление.
          </p>
          {(filterCategories.length > 0 ||
            filterType !== "all" ||
            maxPrice.trim() !== "") && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFilterCategories([]);
                setFilterType("all");
                setMaxPrice("");
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      <div className="market-grid">
        {filteredListings.map((listing) => {
          const isOwner = listing.owner_tg_id === user.id;
          const isAdmin = user.id === 410430521;
          const showPendingBadge =
            listing.status === "pending" && listing.owner_tg_id === user.id;
          const priceLabel = listing.price || "Цена по договоренности";
          const isExpanded = expandedIds.includes(listing.id);
          const typeLabel = listing.type || "Объявление";

          return (
            <div
              key={listing.id}
              className={`product-card ${
                isOwner ? "product-card-owner" : ""
              }`}
              onClick={() => openChat(listing)}
            >
              <div className="product-badge-row">
                <span className="product-type-badge">{typeLabel}</span>
                {isOwner && (
                  <span className="product-owner-badge">Моё объявление</span>
                )}
              </div>

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
                <div className="product-details">
                  {isExpanded || listing.description.length <= 140
                    ? listing.description
                    : `${listing.description.slice(0, 140)}...`}
                  {listing.description.length > 140 && (
                    <button
                      type="button"
                      className="product-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIds((prev) =>
                          prev.includes(listing.id)
                            ? prev.filter((id) => id !== listing.id)
                            : [...prev, listing.id],
                        );
                      }}
                    >
                      {isExpanded ? "Свернуть" : "Показать ещё"}
                    </button>
                  )}
                </div>
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
                  className="admin-btn admin-btn-danger"
                  style={{ marginTop: 6, fontSize: 11 }}
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
