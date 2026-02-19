import React, { useState } from "react";

export default function ListingList({ listings }) {
  const [openedId, setOpenedId] = useState(null);

  const toggleCard = (id) => {
    setOpenedId((current) => (current === id ? null : id));
  };

  return (
    <div className="market-layout">
      <aside className="market-filters">
        <div className="market-filters-title">Фильтры</div>
        <label className="market-filters-label" htmlFor="maxPrice">
          Максимальная цена:
        </label>
        <input
          id="maxPrice"
          type="number"
          className="market-filters-input"
          placeholder="Например, 3000"
        />
        <button className="btn-primary" type="button">
          Применить
        </button>
      </aside>

      <section className="market-products">
        <div className="market-products-header">Товары:</div>

        {listings.length === 0 ? (
          <div className="market-empty">Объявлений пока нет</div>
        ) : (
          <>
            <div className="market-grid">
              {listings.map((listing) => {
                const isOpened = openedId === listing.id;

                return (
                  <article
                    className={`product-card ${isOpened ? "product-card--expanded" : ""}`}
                    key={listing.id}
                    onClick={() => toggleCard(listing.id)}
                  >
                  {listing.images && listing.images.length > 0 && (
                    <img
                      className="product-image"
                      src={`http://localhost:3000/${listing.images[0]}`}
                      alt={listing.title}
                    />
                  )}
                  <div className="product-title">{listing.title}</div>
                  <div className="product-price">
                    {listing.price ? `${listing.price} ₽` : "Цена по договоренности"}
                  </div>
                  {listing.description && (
                    <div className="product-details">
                      {listing.description}
                    </div>
                  )}
                  <button
                    className="product-buy-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://t.me/username`, "_blank");
                    }}
                  >
                    Купить
                  </button>
                  </article>
                );
              })}
            </div>

            <div className="market-pagination">
              <button className="market-page-btn" type="button">
                Предыдущая
              </button>
              <button className="market-page-btn market-page-btn-active" type="button">
                1
              </button>
              <button className="market-page-btn" type="button">
                2
              </button>
              <button className="market-page-btn" type="button">
                3
              </button>
              <button className="market-page-btn" type="button">
                Следующая
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

