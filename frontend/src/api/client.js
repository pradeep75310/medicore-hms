

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/* =========================================================
 * AUTH STORAGE
 * ========================================================= */

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const setAuthSession = (access, refresh, user) => {
  if (access) {
    localStorage.setItem("token", access);
  }

  if (refresh) {
    localStorage.setItem("refreshToken", refresh);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role) {
      localStorage.setItem("role", user.role);
    }
  }
};

export const clearAuthSession = () => {
  [
    "token",
    "refreshToken",
    "user",
    "role",
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredRole = () => {
  return (
    localStorage.getItem("role") ||
    getStoredUser()?.role ||
    null
  );
};

/* =========================================================
 * ERROR HANDLING
 * ========================================================= */

export const extractErrorMessage = (errorData) => {
  if (!errorData) {
    return "An unexpected error occurred.";
  }

  if (typeof errorData === "string") {
    return errorData;
  }

  if (errorData.detail) {
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.join(", ");
    }

    return String(errorData.detail);
  }

  if (errorData.message) {
    if (Array.isArray(errorData.message)) {
      return errorData.message.join(", ");
    }

    return String(errorData.message);
  }

  if (typeof errorData === "object") {
    for (const [key, value] of Object.entries(errorData)) {
      const fieldName = key.replace(/_/g, " ");

      if (Array.isArray(value) && value.length) {
        const first = value[0];

        if (typeof first === "object") {
          return `${fieldName}: ${extractErrorMessage(first)}`;
        }

        return `${fieldName}: ${first}`;
      }

      if (typeof value === "string") {
        return `${fieldName}: ${value}`;
      }

      if (value && typeof value === "object") {
        const nested = extractErrorMessage(value);

        if (nested) {
          return `${fieldName}: ${nested}`;
        }
      }
    }
  }

  return "Server responded with an error.";
};

/* =========================================================
 * URL BUILDER
 * ========================================================= */

const buildUrl = (endpoint, params = null) => {
  const rawUrl = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${
        endpoint.startsWith("/api")
          ? endpoint
          : `/api${
              endpoint.startsWith("/")
                ? endpoint
                : `/${endpoint}`
            }`
      }`;

  const url = new URL(
    rawUrl,
    window.location.origin
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            url.searchParams.append(key, item);
          });
        } else {
          url.searchParams.set(key, value);
        }
      }
    });
  }

  return url.toString();
};

/* =========================================================
 * RESPONSE PARSER
 * ========================================================= */

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text();

  return text || null;
};

/* =========================================================
 * TOKEN REFRESH
 *
 * Important:
 * If multiple API requests receive 401 at the same time,
 * only ONE refresh request is sent.
 * All other requests wait for the same promise.
 * ========================================================= */

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(
        buildUrl("/api/accounts/token/refresh/"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok || !data?.access) {
        throw new Error(
          extractErrorMessage(data)
        );
      }
      
      setAuthSession(
        data.access,
        data.refresh || refresh,
        getStoredUser()
      );

      return data.access;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  try {
    return await refreshPromise;
  } catch {
    clearAuthSession();
    return null;
  }
};

/* =========================================================
 * MAIN API FETCH
 * ========================================================= */

export async function apiFetch(
  endpoint,
  options = {},
  retry = true
) {
  const {
    params,
    skipAuth = false,
    ...fetchOptions
  } = options;

  const url = buildUrl(endpoint, params);

  const token = getToken();

  const isFormData =
    fetchOptions.body instanceof FormData;

  const headers = {
    ...(token && !skipAuth
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(!isFormData
      ? {
          "Content-Type": "application/json",
        }
      : {}),

    ...(fetchOptions.headers || {}),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const data = await parseResponse(response);

  /*
   * ACCESS TOKEN EXPIRED
   */
  if (
    response.status === 401 &&
    retry &&
    !endpoint.includes("/token/refresh/")
  ) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      return apiFetch(
        endpoint,
        options,
        false
      );
    }
  }

  /*
   * SERVER ERROR
   */
  if (!response.ok) {
    const error = new Error(
      extractErrorMessage(data)
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/* =========================================================
 * BODY HELPER
 * ========================================================= */

const prepareBody = (data) => {
  if (data instanceof FormData) {
    return data;
  }

  if (
    data === undefined ||
    data === null
  ) {
    return undefined;
  }

  return JSON.stringify(data);
};

/* =========================================================
 * API METHODS
 * ========================================================= */

export const api = {
  get: (endpoint, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: "GET",
    }),

  post: (
    endpoint,
    data,
    options = {}
  ) =>
    apiFetch(endpoint, {
      ...options,
      method: "POST",
      body: prepareBody(data),
    }),

  put: (
    endpoint,
    data,
    options = {}
  ) =>
    apiFetch(endpoint, {
      ...options,
      method: "PUT",
      body: prepareBody(data),
    }),

  patch: (
    endpoint,
    data,
    options = {}
  ) =>
    apiFetch(endpoint, {
      ...options,
      method: "PATCH",
      body: prepareBody(data),
    }),

  delete: (
    endpoint,
    options = {}
  ) =>
    apiFetch(endpoint, {
      ...options,
      method: "DELETE",
    }),

  /* =======================================================
   * AUTH
   * ======================================================= */

  login: async (
    usernameOrEmail,
    password
  ) => {
    const data = await api.post(
      "/accounts/login/",
      {
        username: usernameOrEmail,
        password,
      },
      {
        skipAuth: true,
      }
    );

    if (data?.access) {
      setAuthSession(
        data.access,
        data.refresh,
        data.user
      );
    }

    return data;
  },

  logout: async () => {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await api.post(
          "/accounts/logout/",
          {
            refresh,
          },
          {
            skipAuth: false,
          }
        );
      }
    } catch {
     
    } finally {
      clearAuthSession();
    }
  },

  getCurrentUser: () =>
    api.get("/accounts/me/"),
};

/* =========================================================
 * DEFAULT EXPORT
 * ========================================================= */

export default api;