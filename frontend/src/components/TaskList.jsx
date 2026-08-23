function getDeadlineClass(task) {
  if (!task.dueDate || task.status === 'done') return '';

  const due = new Date(task.dueDate);
  const now = new Date();

  const diffDays =
    (due - now) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'near-deadline';

  return '';
}

const priorityLabel = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
};

const statusLabel = {
  pending: 'در انتظار',
  done: 'انجام شده',
};

export default function TaskList({
  tasks,
  onToggleStatus,
  onDelete,
}) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <section className="panel">
        <h2>لیست کارها</h2>

        <p>
          کاری برای نمایش وجود ندارد.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>لیست کارها</h2>

      <div id="tasksContainer">
        {tasks.map((task) => (
          <div
            key={task._id}
            className={`task-card ${getDeadlineClass(task)}`}
          >
            <h3>{task.title}</h3>

            {task.description && (
              <p>{task.description}</p>
            )}

            <p>
              اولویت:{' '}
              {priorityLabel[task.priority] ||
                task.priority}

              {' | '}

              وضعیت:{' '}
              {statusLabel[task.status] ||
                task.status}

              {task.dueDate && (
                <>
                  {' | '}
                  مهلت:{' '}
                  {new Date(
                    task.dueDate
                  ).toLocaleDateString('fa-IR')}
                </>
              )}
            </p>

            <div className="task-actions">
              <button
                type="button"
                onClick={() =>
                  onToggleStatus(task)
                }
              >
                {task.status === 'done'
                  ? 'برگرداندن به در انتظار'
                  : 'علامت‌گذاری انجام‌شده'}
              </button>

              <button
                type="button"
                onClick={() =>
                  onDelete(task._id)
                }
                className="danger-btn"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
