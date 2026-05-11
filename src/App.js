import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Register from "./Register";
import CreateListing from "./CreateListing";
import ListingList from "./ListingList";
import AdminPanel from "./AdminPanel";
import { CATEGORIES, LISTING_TYPES } from "./constants";
import { deleteListing, fetchListings, fetchUserStatus } from "./api";
import { initializeVkMiniApp, openProfileLink } from "./vk";

const INITIAL_FILTERS = {
  search: "",
  type: "all",
  category: "all",
  onlyDorm: false,
};

function App() {
  const [bootstrapState, setBootstrapState] = useState({
    loading: true,
    error: "",
    mode: "loading",
  });
  const [viewer, setViewer] = useState(null);
  const [status, setStatus] = useState(null);
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState("");
  const [devForm, setDevForm] = useState({
    id: "900001",
    firstName: "Demo",
    lastName: "User",
  });

  const isApproved = status?.status === "approved";
  const isAdmin = Boolean(status?.isAdmin);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const session = await initializeVkMiniApp();

        if (!isMounted) {
          return;
        }

        if (session.user) {
          setViewer(session.user);
          setBootstrapState({
            loading: false,
            error: session.error || "",
            mode: session.mode,
          });
          return;
        }

        setBootstrapState({
          loading: false,
          error: session.error || "",
          mode: "browser",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBootstrapState({
          loading: false,
          error: error.message,
          mode: "browser",
        });
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!viewer?.id) {
      return;
    }

    let isMounted = true;

    async function loadStatus() {
      try {
        const userStatus = await fetchUserStatus(viewer.id);
        if (isMounted) {
          setStatus(userStatus);
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            status: "not_registered",
            isAdmin: false,
            error: error.message,
          });
        }
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [viewer]);

  useEffect(() => {
    if (!viewer?.id || !isApproved) {
      setListings([]);
      return;
    }

    let isMounted = true;

    async function loadListings() {
      setListingsLoading(true);
      setListingsError("");

      try {
        const items = await fetchListings(viewer.id, filters);
        if (isMounted) {
          setListings(items);
        }
      } catch (error) {
        if (isMounted) {
          setListingsError(error.message);
        }
      } finally {
        if (isMounted) {
          setListingsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      isMounted = false;
    };
  }, [viewer, filters, isApproved]);

  async function refreshStatus() {
    if (!viewer?.id) {
      return;
    }

    const userStatus = await fetchUserStatus(viewer.id);
    setStatus(userStatus);
  }

  async function refreshListings() {
    if (!viewer?.id || !isApproved) {
      return;
    }

    setListingsLoading(true);
    setListingsError("");

    try {
      const items = await fetchListings(viewer.id, filters);
      setListings(items);
    } catch (error) {
      setListingsError(error.message);
    } finally {
      setListingsLoading(false);
    }
  }

  async function handleDeleteListing(listingId) {
    try {
      await deleteListing(viewer.id, listingId);
      await refreshListings();
    } catch (error) {
      setListingsError(error.message);
    }
  }

  function handleDevLogin(event) {
    event.preventDefault();

    if (!devForm.id.trim()) {
      return;
    }

    setViewer({
      id: devForm.id.trim(),
      first_name: devForm.firstName.trim() || "Demo",
      last_name: devForm.lastName.trim() || "User",
      photo_200: "",
    });
    setBootstrapState({
      loading: false,
      error: "Приложение открыто вне VK, поэтому включён локальный режим предпросмотра.",
      mode: "browser",
    });
  }

  const greetingName = useMemo(() => {
    if (!viewer) {
      return "";
    }

    return [viewer.first_name, viewer.last_name].filter(Boolean).join(" ") || `id${viewer.id}`;
  }, [viewer]);

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <main className="app-layout">
        <section className="hero-card">
          <div>
            <span className="eyebrow">VK Mini App</span>
            <h1>Студенческая барахолка</h1>
            <p className="hero-copy">
              Публикуй объявления, находи нужные вещи по фильтрам и связывайся с продавцом
              напрямую через профиль VK.
            </p>
          </div>

          <div className="hero-meta">
            <span className={`status-pill ${bootstrapState.mode}`}>
              {bootstrapState.mode === "vk" ? "Режим VK" : "Локальный режим"}
            </span>
            <span className="status-pill neutral">
              {status?.status === "approved"
                ? "Профиль подтверждён"
                : status?.status === "pending"
                ? "Ожидает модерации"
                : "Требуется регистрация"}
            </span>
          </div>
        </section>

        {bootstrapState.loading ? (
          <section className="panel">
            <h2>Инициализация</h2>
            <p>Подключаем окружение VK и проверяем пользователя.</p>
          </section>
        ) : null}

        {!bootstrapState.loading && !viewer ? (
          <section className="panel">
            <h2>Локальный вход для разработки</h2>
            <p className="muted">
              Пока приложение не подключено в кабинете VK, можно тестировать интерфейс в
              браузере через mock-пользователя.
            </p>

            <form className="stack-form" onSubmit={handleDevLogin}>
              <label>
                <span>VK ID</span>
                <input
                  value={devForm.id}
                  onChange={(event) =>
                    setDevForm((current) => ({ ...current, id: event.target.value }))
                  }
                  placeholder="900001"
                  required
                />
              </label>

              <label>
                <span>Имя</span>
                <input
                  value={devForm.firstName}
                  onChange={(event) =>
                    setDevForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  placeholder="Егор"
                />
              </label>

              <label>
                <span>Фамилия</span>
                <input
                  value={devForm.lastName}
                  onChange={(event) =>
                    setDevForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  placeholder="Иванов"
                />
              </label>

              <button type="submit" className="primary-button">
                Открыть приложение
              </button>
            </form>
          </section>
        ) : null}

        {bootstrapState.error ? (
          <section className="panel warning-panel">
            <h2>Комментарий по окружению</h2>
            <p>{bootstrapState.error}</p>
          </section>
        ) : null}

        {viewer ? (
          <section className="panel profile-panel">
            <div className="profile-summary">
              <div className="profile-avatar">
                {viewer.photo_200 ? (
                  <img src={viewer.photo_200} alt={greetingName} />
                ) : (
                  <span>{greetingName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>

              <div>
                <h2>{greetingName}</h2>
                <p className="muted">VK ID: {viewer.id}</p>
              </div>
            </div>

            {status?.status === "not_registered" ? (
              <p className="muted">
                Для доступа к объявлениям нужно отправить телефон и фото пропуска студента
                общежития на модерацию.
              </p>
            ) : null}

            {status?.status === "pending" ? (
              <p className="muted">
                Заявка отправлена. После подтверждения администратором доска объявлений
                откроется автоматически.
              </p>
            ) : null}

            {status?.status === "blocked" ? (
              <p className="error-text">
                Доступ ограничен. Причина: {status.blockReason || "не указана"}.
              </p>
            ) : null}

            {status?.status === "declined" ? (
              <p className="error-text">
                Заявка отклонена. Можно отправить обновлённые данные повторно.
              </p>
            ) : null}
          </section>
        ) : null}

        {viewer && status && status.status !== "approved" && status.status !== "blocked" ? (
          <Register
            viewer={viewer}
            status={status}
            onRegistered={refreshStatus}
          />
        ) : null}

        {viewer && isApproved ? (
          <>
            <CreateListing viewer={viewer} onCreated={refreshListings} />

            <ListingList
              categories={CATEGORIES}
              currentVkUserId={String(viewer.id)}
              filters={filters}
              listings={listings}
              listingTypes={LISTING_TYPES}
              loading={listingsLoading}
              onChangeFilters={setFilters}
              onContactSeller={openProfileLink}
              onDeleteListing={handleDeleteListing}
              error={listingsError}
            />

            {isAdmin ? (
              <AdminPanel
                viewer={viewer}
                onDataChanged={() => {
                  refreshStatus();
                  refreshListings();
                }}
              />
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
