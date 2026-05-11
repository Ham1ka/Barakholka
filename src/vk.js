import bridge from "@vkontakte/vk-bridge";

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function formatBridgeError(error) {
  return error?.message || "Не удалось получить данные пользователя VK.";
}

function buildUserFromLaunchParams(params) {
  const vkUserId = params.get("vk_user_id");

  if (!vkUserId) {
    return null;
  }

  return {
    id: vkUserId,
    first_name: "",
    last_name: "",
    photo_200: "",
  };
}

export async function initializeVkMiniApp() {
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const launchParams = new URLSearchParams(window.location.search);
  const hasVkLaunchParams = launchParams.has("vk_app_id") || launchParams.has("vk_platform");
  const fallbackUser = buildUserFromLaunchParams(launchParams);

  if (isLocalhost) {
    return {
      mode: "browser",
      user: null,
      error: "Локальный запуск: вне VK будет доступен тестовый browser-режим.",
    };
  }

  try {
    await withTimeout(
      bridge.send("VKWebAppInit"),
      2500,
      "VK Bridge не ответил на инициализацию."
    ).catch(() => null);

    const user = await withTimeout(
      bridge.send("VKWebAppGetUserInfo"),
      5000,
      "Не удалось получить данные пользователя VK."
    );

    return {
      mode: "vk",
      user,
      error: "",
    };
  } catch (error) {
    if (fallbackUser) {
      return {
        mode: "vk",
        user: fallbackUser,
        error: `Bridge не вернул профиль, используем launch params: ${formatBridgeError(error)}`,
      };
    }

    return {
      mode: hasVkLaunchParams ? "vk" : "browser",
      user: null,
      error: hasVkLaunchParams
        ? `VK открыт, но bridge не вернул пользователя: ${formatBridgeError(error)}`
        : "Не удалось получить данные пользователя VK. Для локальной проверки доступен browser-режим.",
    };
  }
}

export function openProfileLink(url) {
  if (!url) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
