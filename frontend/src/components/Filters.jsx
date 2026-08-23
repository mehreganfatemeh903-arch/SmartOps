export default function Filters({
  projects,
  filters,
  onChange,
  onRefresh,
}) {
  function update(field, value) {
    onChange({
      ...filters,
      [field]: value,
    });
  }

  function handleReset() {
    onChange({
      project: '',
      status: '',
      priority: '',
      search: '',
    });
  }

  return (
    <section className="panel">
      <h2>فیلترها</h2>

      <div className="filters">

        <select
          value={filters.project}
          onChange={(e) =>
            update('project', e.target.value)
          }
        >
          <option value="">همه پروژه‌ها</option>

          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="جست‌وجو در عنوان..."
          value={filters.search}
          onChange={(e) =>
            update('search', e.target.value)
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            update('status', e.target.value)
          }
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="done">انجام شده</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) =>
            update('priority', e.target.value)
          }
        >
          <option value="">همه اولویت‌ها</option>
          <option value="low">کم</option>
          <option value="medium">متوسط</option>
          <option value="high">زیاد</option>
        </select>

        <button type="button" onClick={onRefresh}>
          بروزرسانی
        </button>

        <button type="button" onClick={handleReset}>
          پاک کردن فیلترها
        </button>

      </div>
    </section>
  );
}
