import { API_CONFIG } from '../config/api.config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiFetch = async (endpoint, options = {}) => {
    const { method = 'GET', body, headers = {}, ...rest } = options;

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...headers,
    };

    const config = {
        method,
        headers: defaultHeaders,
        ...rest,
    };

    if (body && !(body instanceof FormData)) {
        config.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
        // Fetch will set the correct content-type for FormData automatically
        delete config.headers['Content-Type'];
        config.body = body;
    }

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            // Optional: handle token expiration
            console.error('Unauthorized access - potential token expiration');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error);
        throw error;
    }
};

export const apiService = {
    get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
