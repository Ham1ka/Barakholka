import React from "react";
import { API_BASE } from "./api";

function ListingList({
  categories,
  currentVkUserId,
  filters,
  listings,
  listingTypes,
  loading,
  onChangeFilters,
  onContactSeller,
  onDeleteListing,
  error,
}) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Доска объявлений</h2>
          <p className="muted">
            Ищи нужные вещи по словам, категориям и типу объявления. В карточке сразу
            доступна ссылка на продавца во VK.
          </p>
        </div>
      </div>

      <div className="filter-grid">
        <label>
          <span>Поиск</span>
          <input
            value={filters.search}
            onChange={(event) =>
              onChangeFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="Например, чайник"
          />
        </label>

        <label>
          <span>Тип</span>
          <select
            value={filters.type}
            onChange={(event) =>
              onChangeFilters((current) => ({ ...current, type: event.target.value }))
            }
          >
            <option value="all">Все</option>
            {listingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Категория</span>
          <select
            value={filters.category}
            onChange={(event) =>
              onChangeFilters((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="all">Все</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={filters.onlyDorm}
            onChange={(event) =>
              onChangeFilters((current) => ({ ...current, onlyDorm: event.target.checked }))
            }
          />
          <span>Только моё общежитие</span>
        </label>
      </div>

      {loading ? <p className="muted">Загружаем объявления...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!loading && listings.length === 0 ? (
        <p className="muted">По этим фильтрам объявлений пока нет.</p>
      ) : null}

      <div className="listing-grid">
        {listings.map((listing) => {
          const isOwner = String(listing.seller?.vkUserId) === String(currentVkUserId);

          return (
            <article className="listing-card" key={listing.id}>
              <div className="listing-top">
                <div>
                  <span className="category-chip">{listing.category}</span>
                  <h3>{listing.title}</h3>
                </div>
                <span className="price-badge">
                  {listing.price ? `${listing.price} ₽` : "Цена по договорённости"}
                </span>
              </div>

              <p className="listing-description">{listing.description}</p>

              <div className="listing-tags">
                <span>{listing.type}</span>
                {listing.seller?.dorm ? <span>{listing.seller.dorm}</span> : null}
                {listing.seller?.room ? <span>Комната {listing.seller.room}</span> : null}
              </div>

              {listing.images?.length ? (
                <div className="image-row">
                  {listing.images.map((image, index) => (
                    <img
                      key={`${listing.id}-${index}`}
                      src={`${API_BASE.replace(/\/api$/, "")}/${image}`}
                      alt={listing.title}
                    />
                  ))}
                </div>
              ) : null}

              <div className="seller-card">
                <div>
                  <strong>{listing.seller?.name || "Продавец"}</strong>
                  <p className="muted">
                    {listing.seller?.phone
                      ? `Телефон: ${listing.seller.phone}`
                      : "Телефон скрыт"}
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onContactSeller(listing.seller?.profileUrl)}
                >
                  Открыть профиль VK
                </button>
              </div>

              {isOwner ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onDeleteListing(listing.id)}
                >
                  Удалить объявление
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ListingList;
