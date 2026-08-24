import api from './client';

export function getOverview() {
  return api
    .get('/admin/overview')
    .then((res) => {
      const data = res.data;

      if (data && data.data) {
        return data.data;
      }

      return data;
    });
}

export function getTasksByPriority(params) {
  params = params || {};

  return api
    .get('/admin/tasks-by-priority', {
      params,
    })
    .then((res) => {
      const data = res.data;

      if (data && data.data) {
        return data.data;
      }

      return data;
    });
}

export function getUsers(search) {
  search = search || '';

  return api
    .get('/admin/users', {
      params: search
        ? { search }
        : {},
    })
    .then((res) => {
      const data = res.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (data && Array.isArray(data.users)) {
        return data.users;
      }

      if (data && Array.isArray(data.data)) {
        return data.data;
      }

      console.warn(
        'unexpected /admin/users response shape:',
        data
      );

      return [];
    });
}

export function updateUserRole(id, role) {
  return api
    .patch(`/admin/users/${id}/role`, {
      role,
    })
    .then((res) => res.data);
}

export function updateUserStatus(id, status) {
  return api
    .patch(`/admin/users/${id}/status`, {
      status,
    })
    .then((res) => res.data);
}

async function downloadBlob(path, filename) {
  const res = await api.get(path, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(
    new Blob([res.data])
  );

  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}

export function exportPdf() {
  return downloadBlob(
    '/admin/export/pdf',
    'smartops-report.pdf'
  );
}

export function exportExcel() {
  return downloadBlob(
    '/admin/export/excel',
    'smartops-report.xlsx'
  );
}