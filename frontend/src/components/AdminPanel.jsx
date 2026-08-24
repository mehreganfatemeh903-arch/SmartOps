import { useEffect, useState } from 'react';
import {
  getOverview,
  getTasksByPriority,
  getUsers,
  updateUserRole,
  updateUserStatus,
  exportPdf,
  exportExcel,
} from '../api/admin';

export default function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [priorityStats, setPriorityStats] = useState({});
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setError('');

      const [ov, pr, us] = await Promise.all([
        getOverview(),
        getTasksByPriority(),
        getUsers(),
      ]);

      setOverview(ov || {});
      setPriorityStats(pr || {});
      setUsers(Array.isArray(us) ? us : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'بارگذاری اطلاعات پنل ادمین ناموفق بود'
      );
    }
  }

  async function handleSearch(e) {
    e.preventDefault();

    try {
      setError('');

      const result = await getUsers(search.trim());
      setUsers(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'جست‌وجوی کاربران ناموفق بود'
      );
    }
  }

  async function handleRoleChange(id, role) {
    try {
      setError('');

      await updateUserRole(id, role);

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? { ...user, role }
            : user
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'تغییر نقش کاربر ناموفق بود'
      );
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setError('');

      await updateUserStatus(id, status);

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? { ...user, status }
            : user
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'تغییر وضعیت کاربر ناموفق بود'
      );
    }
  }

  async function handleExport(type) {
    try {
      setError('');
      setExporting(type);

      if (type === 'pdf') {
        await exportPdf();
      } else if (type === 'excel') {
        await exportExcel();
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'دانلود فایل خروجی ناموفق بود'
      );
    } finally {
      setExporting('');
    }
  }

  const totalTasks =
    (overview?.doneTasksCount || 0) +
    (overview?.pendingTasksCount || 0);

  return (
    <section className="panel admin-panel" dir="rtl">
      <h2>پنل ادمین</h2>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div id="adminOverview">
        {overview ? (
          <>
            <div className="stat-item">
              <strong>کل کاربران:</strong>{' '}
              {overview.usersCount ?? 0}
            </div>

            <div className="stat-item">
              <strong>کل پروژه‌ها:</strong>{' '}
              {overview.projectsCount ?? 0}
            </div>

            <div className="stat-item">
              <strong>کل کارها:</strong>{' '}
              {totalTasks}
            </div>

            <div className="stat-item">
              <strong>کارهای انجام‌شده:</strong>{' '}
              {overview.doneTasksCount ?? 0}
            </div>

            <div className="stat-item">
              <strong>کارهای در انتظار:</strong>{' '}
              {overview.pendingTasksCount ?? 0}
            </div>
          </>
        ) : (
          <p>در حال بارگذاری اطلاعات...</p>
        )}
      </div>

      <div id="adminPriorityStats">
        <div className="stat-item">
          <strong>توزیع اولویت کارها:</strong>
          <span> کم: {priorityStats.low || 0}</span>
          <span> | متوسط: {priorityStats.medium || 0}</span>
          <span> | زیاد: {priorityStats.high || 0}</span>
        </div>
      </div>

      <div id="adminUsers">
        <form
          onSubmit={handleSearch}
          className="admin-search"
        >
          <input
            type="text"
            placeholder="جست‌وجوی کاربر بر اساس نام یا ایمیل..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <button type="submit">
            جست‌وجو
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              loadAll();
            }}
          >
            نمایش همه
          </button>
        </form>

        {users.length === 0 ? (
          <p>کاربری برای نمایش وجود ندارد.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>ایمیل</th>
                  <th>نقش</th>
                  <th>وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.name || '-'}
                    </td>

                    <td>
                      {user.email || '-'}
                    </td>

                    <td>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) =>
                          handleRoleChange(
                            user._id,
                            e.target.value
                          )
                        }
                      >
                        <option value="user">
                          کاربر
                        </option>

                        <option value="admin">
                          مدیر
                        </option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={user.status || 'active'}
                        onChange={(e) =>
                          handleStatusChange(
                            user._id,
                            e.target.value
                          )
                        }
                      >
                        <option value="active">
                          فعال
                        </option>

                        <option value="suspended">
                          تعلیق‌شده
                        </option>

                        <option value="inactive">
                          غیرفعال
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="export-buttons">
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          disabled={exporting === 'pdf'}
        >
          {exporting === 'pdf'
            ? 'در حال آماده‌سازی...'
            : 'دانلود PDF'}
        </button>

        <button
          type="button"
          onClick={() => handleExport('excel')}
          disabled={exporting === 'excel'}
        >
          {exporting === 'excel'
            ? 'در حال آماده‌سازی...'
            : 'دانلود Excel'}
        </button>
      </div>
    </section>
  );
}