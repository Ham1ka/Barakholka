import React, { useEffect, useRef, useState } from "react";
import {
  approveListing,
  approveUser,
  declineUser,
  fetchPendingListings,
  fetchPendingUsers,
  removeListingAsAdmin,
} from "./api";
import { API_BASE } from "./api";

function AdminPanel({ viewer, onDataChanged }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const viewerIdRef = useRef(viewer.id);

  useEffect(() => {
    viewerIdRef.current = viewer.id;
  }, [viewer.id]);

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const [users, listings] = await Promise.all([
        fetchPendingUsers(viewerIdRef.current),
        fetchPendingListings(viewerIdRef.current),
      ]);
      setPendingUsers(users);
      setPendingListings(listings);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleApproveUser(userId) {
    await approveUser(viewer.id, userId);
    await loadAdminData();
    await onDataChanged();
  }

  async function handleDeclineUser(userId) {
    const reason = window.prompt("Причина отклонения заявки", "Данные не читаются");
    await declineUser(viewer.id, userId, reason || "");
    await loadAdminData();
  }

  async function handleApproveListing(listingId) {
    await approveListing(viewer.id, listingId);
    await loadAdminData();
    await onDataChanged();
  }

  async function handleDeleteListing(listingId) {
    await removeListingAsAdmin(viewer.id, listingId);
    await loadAdminData();
    await onDataChanged();
  }

  return (
    <section className="panel admin-panel">
      <div className="section-head">
        <div>
          <h2>Админ-панель</h2>
          <p className="muted">
            Здесь подтверждаются регистрации и публикации. После модерации данные сразу
            появляются в приложении.
          </p>
        </div>
      </div>

      {loading ? <p className="muted">Загружаем очереди модерации...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="admin-grid">
        <div className="admin-column">
          <h3>Заявки пользователей</h3>
          {pendingUsers.length === 0 ? <p className="muted">Нет новых заявок.</p> : null}

          {pendingUsers.map((user) => (
            <article className="admin-card" key={user.id}>
              <div>
                <strong>{user.fullName || `id${user.vkUserId}`}</strong>
                <p className="muted">Телефон: {user.phone}</p>
                <p className="muted">
                  {user.dorm}
                  {user.room ? `, комната ${user.room}` : ""}
                </p>
              </div>

              {user.photoPath ? (
                <img
                  className="admin-preview"
                  src={`${API_BASE.replace(/\/api$/, "")}/${user.photoPath}`}
                  alt={user.fullName || "Пропуск"}
                />
              ) : null}

              <div className="admin-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleApproveUser(user.id)}
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDeclineUser(user.id)}
                >
                  Отклонить
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-column">
          <h3>Заявки объявлений</h3>
          {pendingListings.length === 0 ? <p className="muted">Нет объявлений на проверке.</p> : null}

          {pendingListings.map((listing) => (
            <article className="admin-card" key={listing.id}>
              <div>
                <strong>{listing.title}</strong>
                <p className="muted">{listing.seller?.name || "Пользователь"}</p>
                <p className="muted">
                  {listing.type} · {listing.category}
                </p>
              </div>

              <p>{listing.description}</p>

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

              <div className="admin-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleApproveListing(listing.id)}
                >
                  Опубликовать
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDeleteListing(listing.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
