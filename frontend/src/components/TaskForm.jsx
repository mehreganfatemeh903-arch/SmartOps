import { useState } from 'react';

export default function TaskForm({ projects = [], onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSaving(true);

    try {
      await onCreated({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
      });

      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setProjectId('');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'ثبت کار ناموفق بود'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>افزودن کار جدید</h2>

      <form onSubmit={handleSubmit}>
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="عنوان کار"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="توضیحات"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">بدون پروژه</option>

            {projects.map((project) => (
              <option
                key={project._id}
                value={project._id}
              >
                {project.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">کم</option>
          <option value="medium">متوسط</option>
          <option value="high">زیاد</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
        >
          {saving ? 'در حال ثبت...' : 'ثبت کار'}
        </button>
      </form>
    </section>
  );
}
