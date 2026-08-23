import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// هر درخواست: اگه توکن تو localStorage باشه، به هدر اضافه می‌شه
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartops_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// اگه سرور 401 برگردوند
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartops_token');
      localStorage.removeItem('smartops_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;