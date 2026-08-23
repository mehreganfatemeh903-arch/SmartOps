import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

import {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
} from '../api/tasks';

import {
  getProjects,
  createProject,
} from '../api/projects';

import Filters from '../components/Filters';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import Stats from '../components/Stats';
import Charts from '../components/Charts';
import AdminPanel from '../components/AdminPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({
    project: '',
    status: '',
    priority: '',
    search: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getTasks(filters);

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'بارگذاری کارها ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getTaskStats();
      setStats(data);
    } catch (err) {
      console.error('Task stats error:', err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();

      setProjects(
        Array.isArray(data)
          ? data
          : data?.projects || []
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'بارگذاری پروژه‌ها ناموفق بود'
      );
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadStats();
  }, [loadProjects, loadStats]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreateProject(data) {
    try {
      setError('');

      await createProject(data);

      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'ایجاد پروژه ناموفق بود'
      );
    }
  }

  async function handleCreateTask(data) {
    try {
      setError('');

      await createTask(data);

      await loadTasks();
      await loadStats();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'ایجاد کار ناموفق بود'
      );
    }
  }

  async function handleToggleStatus(task) {
    try {
      setError('');

      const newStatus =
        task.status === 'done'
          ? 'pending'
          : 'done';

      await updateTask(task._id, {
        status: newStatus,
      });

      await loadTasks();
      await loadStats();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'تغییر وضعیت کار ناموفق بود'
      );
    }
  }

  async function handleDeleteTask(id) {
    try {
      setError('');

      await deleteTask(id);

      await loadTasks();
      await loadStats();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'حذف کار ناموفق بود'
      );
    }
  }

  return (
    <div className="dashboard" dir="rtl">

      <header className="dashboard-header">

        <div className="brand-section">
          <h1>SmartOps</h1>

          <p>
            داشبورد مدیریت کارها، پروژه‌ها و تحلیل هوشمند
          </p>
        </div>

        <div className="user-bar">

          <div className="user-info">
            <span className="user-name">
              {user?.name || 'کاربر'}
            </span>

            <span className="user-email">
              {user?.email}
            </span>

            {user?.role === 'admin' && (
              <span className="admin-badge">
                مدیر سیستم
              </span>
            )}
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={logout}
          >
            خروج
          </button>

        </div>

      </header>

      <main className="dashboard-main">

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <section className="dashboard-section">
          <Filters
            projects={projects}
            filters={filters}
            onChange={setFilters}
            onRefresh={loadTasks}
          />
        </section>

        <section className="dashboard-grid">

          <ProjectForm
            onCreated={handleCreateProject}
          />

          <TaskForm
            projects={projects}
            onCreated={handleCreateTask}
          />

        </section>

        <section className="dashboard-section">

          {loading ? (
            <div className="loading-box">
              در حال بارگذاری کارها...
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
            />
          )}

        </section>

        <section className="dashboard-grid">

          <Stats stats={stats} />

          <Charts tasks={tasks} />

        </section>

        {user?.role === 'admin' && (
          <section className="dashboard-section admin-section">
            <AdminPanel />
          </section>
        )}

      </main>

      <footer className="dashboard-footer">
        <span>
          SmartOps
        </span>

        <span>
          سیستم مدیریت و تحلیل عملیات
        </span>
      </footer>

    </div>
  );
}
