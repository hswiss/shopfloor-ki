import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, PieChart, Pie, Tooltip } from "recharts";

const CATEGORY_COLORS = {
  "Wertschöpfung": "#34D399",
  "Rüsten": "#FBBF24",
  "Warten": "#EF4444",
  "Suchen/Laufen": "#EF4444",
  "EDV": "#FBBF24",
  "Gespräche": "#EF4444",
};

const FORMAT_OPTIONS = [
  { id: "bar", label: "Balken" },
  { id: "pie", label: "Kreis" },
  { id: "table", label: "Tabelle" },
  { id: "text", label: "Text" },
];

function getColor(name) {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (name.includes(key) || key.includes(name)) return color;
  }
  return "#60A5FA";
}

function buildChartData(percentages, totals) {
  if (!percentages) return [];
  return Object.entries(percentages)
    .map(([name, pct]) => ({
      name,
      pct: Number(pct) || 0,
      count: totals?.[name] || 0,
    }))
    .sort((a, b) => b.pct - a.pct);
}

function BarView({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(250, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 45, top: 0, bottom: 0 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={28} label={RenderBarLabel}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={getColor(entry.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RenderBarLabel({ x, y, width, value }) {
  return (
    <text x={x + width + 6} y={y + 18} fill="#e4e4e7" fontSize={13} fontWeight={600}>
      {value.toFixed(1)}%
    </text>
  );
}

function PieView({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="pct"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          strokeWidth={2}
          stroke="#18181b"
          label={({ name, pct }) => `${pct.toFixed(0)}%`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={getColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: 8 }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(val) => `${val.toFixed(1)}%`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TableView({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400">
            <th className="text-left py-2 font-medium">Kategorie</th>
            <th className="text-right py-2 font-medium">Anzahl</th>
            <th className="text-right py-2 font-medium">Prozent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name} className="border-b border-zinc-800/50">
              <td className="py-2 text-zinc-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: getColor(row.name) }} />
                {row.name}
              </td>
              <td className="py-2 text-right text-zinc-300">{row.count}</td>
              <td className="py-2 text-right text-zinc-300">{row.pct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextView({ data, totals }) {
  const total = Object.values(totals || {}).reduce((s, v) => s + v, 0);
  return (
    <div className="space-y-2 text-sm text-zinc-300">
      <p>Insgesamt <span className="text-zinc-100 font-semibold">{total} Beobachtungen</span> ausgewertet:</p>
      {data.map((row) => (
        <p key={row.name}>
          <span style={{ color: getColor(row.name) }} className="font-semibold">{row.name}</span>
          {": "}
          {row.count}x ({row.pct.toFixed(1)}%)
        </p>
      ))}
    </div>
  );
}

export default function DataChart({ percentages, totals, format, onFormatChange }) {
  const data = buildChartData(percentages, totals);
  if (data.length === 0) return null;

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-[250px]">
        {format === "bar" && <BarView data={data} />}
        {format === "pie" && <PieView data={data} />}
        {format === "table" && <TableView data={data} />}
        {format === "text" && <TextView data={data} totals={totals} />}
      </div>

      {/* Format switcher */}
      <div className="flex gap-2 mt-3">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onFormatChange(opt.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              format === opt.id
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
