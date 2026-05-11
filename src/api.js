export const API_BASE = process.env.REACT_APP_API_BASE || "/api";

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Ошибка запроса");
  }

  return data;
}

export async function fetchUserStatus(vkUserId) {
  const response = await fetch(
    `${API_BASE}/user_status${buildQuery({ vk_user_id: vkUserId })}`
  );
  return parseResponse(response);
}

export async function registerUser({
  vkUserId,
  firstName,
  lastName,
  phone,
  dorm,
  room,
  vkAvatar,
  studentPassPhoto,
}) {
  const formData = new FormData();
  formData.append("vk_user_id", vkUserId);
  formData.append("first_name", firstName || "");
  formData.append("last_name", lastName || "");
  formData.append("full_name", [firstName, lastName].filter(Boolean).join(" "));
  formData.append("phone", phone);
  formData.append("dorm", dorm);
  formData.append("room", room || "");
  formData.append("vk_avatar", vkAvatar || "");
  formData.append("studentPassPhoto", studentPassPhoto);

  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

export async function fetchListings(vkUserId, filters) {
  const response = await fetch(
    `${API_BASE}/listings${buildQuery({
      vk_user_id: vkUserId,
      search: filters.search,
      type: filters.type,
      category: filters.category,
      onlyDorm: filters.onlyDorm ? 1 : 0,
    })}`
  );

  return parseResponse(response);
}

export async function createListing(vkUserId, payload) {
  const formData = new FormData();
  formData.append("vk_user_id", vkUserId);
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("type", payload.type);
  formData.append("price", payload.price);
  formData.append("category", payload.category);

  Array.from(payload.photos || []).forEach((photo) => {
    formData.append("photos", photo);
  });

  const response = await fetch(`${API_BASE}/listings`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

export async function deleteListing(vkUserId, listingId) {
  const response = await fetch(
    `${API_BASE}/listings/${listingId}${buildQuery({ vk_user_id: vkUserId })}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vk_user_id: vkUserId }),
    }
  );

  return parseResponse(response);
}

export async function fetchPendingUsers(vkUserId) {
  const response = await fetch(
    `${API_BASE}/admin/pending${buildQuery({ vk_user_id: vkUserId })}`
  );
  return parseResponse(response);
}

export async function fetchPendingListings(vkUserId) {
  const response = await fetch(
    `${API_BASE}/admin/pending_listings${buildQuery({ vk_user_id: vkUserId })}`
  );
  return parseResponse(response);
}

export async function approveUser(vkUserId, userId) {
  const response = await fetch(
    `${API_BASE}/admin/approve/${userId}${buildQuery({ vk_user_id: vkUserId })}`,
    {
      method: "POST",
    }
  );
  return parseResponse(response);
}

export async function declineUser(vkUserId, userId, reason) {
  const response = await fetch(
    `${API_BASE}/admin/decline/${userId}${buildQuery({ vk_user_id: vkUserId })}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );
  return parseResponse(response);
}

export async function approveListing(vkUserId, listingId) {
  const response = await fetch(
    `${API_BASE}/admin/approve_listing/${listingId}${buildQuery({ vk_user_id: vkUserId })}`,
    {
      method: "POST",
    }
  );
  return parseResponse(response);
}

export async function removeListingAsAdmin(vkUserId, listingId) {
  const response = await fetch(
    `${API_BASE}/admin/delete_listing/${listingId}${buildQuery({ vk_user_id: vkUserId })}`,
    {
      method: "POST",
    }
  );
  return parseResponse(response);
}
