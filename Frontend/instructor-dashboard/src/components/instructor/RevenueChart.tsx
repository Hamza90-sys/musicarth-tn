const data = [
  { m: "Jan", v: 1800 },
  { m: "Feb", v: 2400 },
  { m: "Mar", v: 2100 },
  { m: "Apr", v: 3200 },
  { m: "May", v: 2900 },
  { m: "Jun", v: 3800 },
  { m: "Jul", v: 3500 },
  { m: "Aug", v: 4200 },
  { m: "Sep", v: 4800 },
  { m: "Oct", v: 5100 },
  { m: "Nov", v: 4700 },
  { m: "Dec", v: 5600 },
];

export function RevenueChart() {
  const max = Math.max(...data.map((d) => d.v));
  const w = 600;
  const h = 180;
  const pad = 8;
  const step = (w - pad * 2) / (data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#rev)" />
        <path d={path} fill="none" stroke="oklch(0.55 0.24 295)" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="oklch(0.55 0.24 295)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-2">
        {data.map((d) => (
          <span key={d.m}>{d.m}</span>
        ))}
      </div>
    </div>
  );
}
