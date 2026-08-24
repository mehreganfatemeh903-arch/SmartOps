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
  Legend,
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

const persianNumber = (value) =>
  String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

function PersianTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '10px 14px',
        direction: 'rtl',
        textAlign: 'right',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: '4px',
        }}
      >
        {item.payload.name}
      </div>

      <div>
        تعداد: {persianNumber(item.value)}
      </div>
    </div>
  );
}

function StatusLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;

  const radius =
    innerRadius +
    (outerRadius - innerRadius) * 0.55;

  const x =
    cx + radius * Math.cos(-midAngle * RADIAN);

  const y =
    cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent <= 0) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={15}
      fontWeight={700}
    >
      {persianNumber(Math.round(percent * 100))}٪
    </text>
  );
}

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
    <section
      className="panel charts"
      dir="rtl"
    >
      <h2>نمودارهای مدیریتی</h2>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>وضعیت کارها</h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                labelLine={false}
                label={StatusLabel}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name]}
                  />
                ))}
              </Pie>

              <Tooltip
                content={<PersianTooltip />}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>اولویت کارها</h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <BarChart
              data={priorityData}
              margin={{
                top: 20,
                right: 10,
                left: 0,
                bottom: 10,
              }}
            >
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 14,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                allowDecimals={false}
                allowDataOverflow={false}
                domain={[
                  0,
                  (dataMax) =>
                    Math.max(dataMax + 1, 1),
                ]}
                tickFormatter={persianNumber}
                tick={{
                  fontSize: 13,
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={<PersianTooltip />}
              />

              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                barSize={48}
              >
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
      </div>
    </section>
  );
}