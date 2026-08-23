import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS = {
  'در انتظار': '#f59e0b',
  'انجام شده': '#34d399',
};

const PRIORITY_COLORS = {
  کم: '#60a5fa',
  متوسط: '#a78bfa',
  زیاد: '#ef4444',
};

export default function Charts({ tasks }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const statusData = [
    {
      name: 'در انتظار',
      value: safeTasks.filter(
        (task) => task.status === 'pending'
      ).length,
    },
    {
      name: 'انجام شده',
      value: safeTasks.filter(
        (task) => task.status === 'done'
      ).length,
    },
  ];

  const priorityData = [
    {
      name: 'کم',
      value: safeTasks.filter(
        (task) => task.priority === 'low'
      ).length,
    },
    {
      name: 'متوسط',
      value: safeTasks.filter(
        (task) => task.priority === 'medium'
      ).length,
    },
    {
      name: 'زیاد',
      value: safeTasks.filter(
        (task) => task.priority === 'high'
      ).length,
    },
  ];

  return (
    <section className="panel charts">
      <h2>نمودارهای مدیریتی</h2>

      <div className="chart-box">
        <h3>وضعیت کارها</h3>

        <ResponsiveContainer
          width="100%"
          height={220}
        >
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {statusData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-box">
        <h3>اولویت کارها</h3>

        <ResponsiveContainer
          width="100%"
          height={220}
        >
          <BarChart data={priorityData}>
            <XAxis
              dataKey="name"
              stroke="#e5e7eb"
            />

            <YAxis
              stroke="#e5e7eb"
              allowDecimals={false}
            />

            <Tooltip />

            <Bar dataKey="value">
              {priorityData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PRIORITY_COLORS[entry.name]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
