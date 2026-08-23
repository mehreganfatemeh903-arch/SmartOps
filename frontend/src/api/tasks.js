import api from './client';

export function getTasks(filters = {}) {
  const params = {};

  if (filters.project) {
    params.projectId = filters.project;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.priority) {
    params.priority = filters.priority;
  }

  if (filters.search) {
    params.q = filters.search;
  }

  return api
    .get('/tasks', { params })
    .then((res) => res.data);
}

export function getTaskStats() {
  return api
    .get('/tasks/stats')
    .then((res) => res.data);
}

export function createTask(data) {
  return api
    .post('/tasks', data)
    .then((res) => res.data);
}

export function updateTask(id, data) {
  return api
    .put(`/tasks/${id}`, data)
    .then((res) => res.data);
}

export function deleteTask(id) {
  return api
    .delete(`/tasks/${id}`)
    .then((res) => res.data);
}
