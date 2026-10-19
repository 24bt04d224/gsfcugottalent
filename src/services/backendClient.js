/**
 * GSFCU Got Talent 2026 - Render Backend Client
 * Connects the frontend to Render.com hosted web service with automatic offline fallback.
 */

const BACKEND_URL_STORAGE_KEY = 'gsfcu_render_backend_url';

export const getBackendUrl = () => {
  // If running in browser under HTTPS, always route to relative ""
  // to enforce same-origin /api/* and prevent Mixed Content blocks.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '';
  }

  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(BACKEND_URL_STORAGE_KEY);
    if (saved && saved.trim() && !saved.includes('onrender.com')) {
      return saved.trim().replace(/\/+$/, '');
    }
    // Default in browser is same-origin relative path
    return '';
  }

  return '';
};

export const setBackendUrl = (url) => {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
  window.dispatchEvent(new CustomEvent('backendUrlChanged', { detail: url }));
};

export const isBackendConfigured = () => {
  const url = getBackendUrl();
  // Relative path "" indicates same-origin /api serverless endpoints are active
  if (url === '') return true;
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
};

/**
 * Health check to verify backend is live and awake
 */
export const checkBackendHealth = async (customUrl = null) => {
  const base = customUrl !== null ? customUrl.trim().replace(/\/+$/, '') : getBackendUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${base}/api/health`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Backend is waking up (timeout)' : err.message };
  }
};


/**
 * Fetch registrations from Render backend
 */
export const fetchRegistrationsFromBackend = async () => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/registrations`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch (err) {
    console.warn('[Render Backend] Failed to fetch registrations:', err.message);
    return null;
  }
};

/**
 * Save new registration to Render backend
 */
export const saveRegistrationToBackend = async (registration) => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(registration)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const result = await res.json();
    return result.data || result;
  } catch (err) {
    console.warn('[Render Backend] Failed to post registration:', err.message);
    throw err;
  }
};

/**
 * Check-in participant via Render backend
 */
export const checkInParticipantOnBackend = async (idOrEnrollment) => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ id: idOrEnrollment })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const result = await res.json();
    return result.data || result;
  } catch (err) {
    console.warn('[Render Backend] Failed to check in participant:', err.message);
    return null;
  }
};

/**
 * Update registration on Render backend
 */
export const updateRegistrationOnBackend = async (id, updates) => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/registrations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.data || result;
  } catch (err) {
    console.warn('[Render Backend] Failed to update registration:', err.message);
    return null;
  }
};

/**
 * Fetch sponsors from Render backend
 */
export const fetchSponsorsFromBackend = async () => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/sponsors`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result.data || result;
  } catch (err) {
    console.warn('[Render Backend] Failed to fetch sponsors:', err.message);
    return null;
  }
};

/**
 * Delete registration from Render backend
 */
export const deleteRegistrationFromBackend = async (id) => {
  if (!isBackendConfigured()) return null;
  const base = getBackendUrl();

  try {
    const res = await fetch(`${base}/api/registrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    return result;
  } catch (err) {
    console.warn('[Render Backend] Failed to delete registration:', err.message);
    return null;
  }
};

