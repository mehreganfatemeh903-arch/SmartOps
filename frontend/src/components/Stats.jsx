export default function Stats({ stats }) {
  if (!stats) {
    return (
      <section className="panel stats-panel">
        <h2>تحلیل وضعیت کارها</h2>
        <p className="loading-text">در حال بارگذاری...</p>
      </section>
    );
  }

  const total = Number(stats.total ?? 0);
  const done = Number(stats.done ?? 0);
  const pending = Number(stats.pending ?? 0);
  const overdue = Number(stats.overdue ?? 0);

  const completionRate =
    total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="panel stats-panel">
      <div className="panel-header">
        <div>
          <h2>تحلیل وضعیت کارها</h2>
          <p>نمای کلی عملکرد و وضعیت کارها</p>
        </div>

        <div className="completion-badge">
          {completionRate}٪
        </div>
      </div>

      <div id="statsContainer" className="stats-grid">

        <div className="stat-card">
          <span className="stat-label">کل کارها</span>
          <strong className="stat-value">
            {total}
          </strong>
          <span className="stat-description">
            مجموع کارهای ثبت‌شده
          </span>
        </div>

        <div className="stat-card success">
          <span className="stat-label">انجام‌شده</span>
          <strong className="stat-value">
            {done}
          </strong>
          <span className="stat-description">
            کارهای تکمیل‌شده
          </span>
        </div>

        <div className="stat-card warning">
          <span className="stat-label">در انتظار</span>
          <strong className="stat-value">
            {pending}
          </strong>
          <span className="stat-description">
            کارهای باقی‌مانده
          </span>
        </div>

        <div className="stat-card danger">
          <span className="stat-label">عقب‌افتاده</span>
          <strong className="stat-value">
            {overdue}
          </strong>
          <span className="stat-description">
            نیازمند پیگیری
          </span>
        </div>

      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>درصد تکمیل کارها</span>
          <strong>{completionRate}٪</strong>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${completionRate}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}