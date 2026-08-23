import { useState } from 'react';

export default function ProjectForm({ onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onCreated({ name, description });
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'ثبت پروژه ناموفق بود');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <h2>پروژه جدید</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <input
          type="text"
          placeholder="نام پروژه"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="توضیحات پروژه"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'در حال ثبت...' : 'ثبت پروژه'}
        </button>
      </form>
    </section>
  );
}
