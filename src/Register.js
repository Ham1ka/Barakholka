import React, { useState } from "react";
import { registerUser } from "./api";

function Register({ viewer, status, onRegistered }) {
  const [form, setForm] = useState({
    phone: "",
    dorm: status?.dorm || "",
    room: status?.room || "",
    studentPassPhoto: null,
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
      const response = await registerUser({
        vkUserId: viewer.id,
        firstName: viewer.first_name,
        lastName: viewer.last_name,
        phone: form.phone,
        dorm: form.dorm,
        room: form.room,
        vkAvatar: viewer.photo_200,
        studentPassPhoto: form.studentPassPhoto,
      });

      setMessage(response.message || "Заявка отправлена.");
      await onRegistered();
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
          <h2>Регистрация и модерация</h2>
          <p className="muted">
            Отправь телефон, номер общежития и фото пропуска. После проверки админом
            доступ к доске откроется автоматически.
          </p>
        </div>
      </div>

      {status?.declineReason ? (
        <p className="error-text">Причина отклонения: {status.declineReason}</p>
      ) : null}

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          <span>Телефон</span>
          <input
            type="tel"
            placeholder="+7 900 000-00-00"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            required
          />
        </label>

        <label>
          <span>Общежитие</span>
          <input
            type="text"
            placeholder="Например, корпус 2"
            value={form.dorm}
            onChange={(event) =>
              setForm((current) => ({ ...current, dorm: event.target.value }))
            }
            required
          />
        </label>

        <label>
          <span>Комната</span>
          <input
            type="text"
            placeholder="Например, 418"
            value={form.room}
            onChange={(event) =>
              setForm((current) => ({ ...current, room: event.target.value }))
            }
          />
        </label>

        <label>
          <span>Фото пропуска студента</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                studentPassPhoto: event.target.files?.[0] || null,
              }))
            }
            required
          />
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Отправляем..." : "Отправить на модерацию"}
        </button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

export default Register;
