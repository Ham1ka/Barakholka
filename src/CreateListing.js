import React, { useState } from "react";
import { createListing } from "./api";
import { CATEGORIES, LISTING_TYPES } from "./constants";

function CreateListing({ viewer, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: LISTING_TYPES[0],
    price: "",
    category: CATEGORIES[0],
    photos: [],
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await createListing(viewer.id, form);
      setMessage(response.message || "Объявление отправлено.");
      setForm({
        title: "",
        description: "",
        type: LISTING_TYPES[0],
        price: "",
        category: CATEGORIES[0],
        photos: [],
      });
      await onCreated();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Новое объявление</h2>
          <p className="muted">
            После отправки объявление попадёт на модерацию. Добавь до 4 фото и выбери
            категорию, чтобы его было проще найти.
          </p>
        </div>
      </div>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          <span>Заголовок</span>
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Например, продаю настольную лампу"
            required
          />
        </label>

        <label>
          <span>Описание</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Состояние, размеры, что входит в комплект"
            required
          />
        </label>

        <div className="form-grid">
          <label>
            <span>Тип</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value }))
              }
            >
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Категория</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span>Цена</span>
          <input
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
            placeholder="Например, 1500"
          />
        </label>

        <label>
          <span>Фото товара</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                photos: Array.from(event.target.files || []).slice(0, 4),
              }))
            }
          />
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Отправляем..." : "Создать объявление"}
        </button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

export default CreateListing;
