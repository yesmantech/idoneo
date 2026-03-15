import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface ProgressData {
    id: string;
    date: string;
    fullDate: Date;
    score: number;
    accuracy: number;
    responseTime?: number;
}

type MetricType = 'score' | 'accuracy' | 'responseTime';
type TimeRange = '7d' | '30d' | 'all';

interface ProgressLineChartProps {
    data: ProgressData[];
    defaultMetric?: MetricType;
    defaultTimeRange?: TimeRange;
}

const metricConfig = {
    score: { label: 'Punteggio', unit: 'pt', color: '#00B1FF' },
    accuracy: { label: 'Accuratezza', unit: '%', color: '#22C55E' },
    responseTime: { label: 'Tempo medio', unit: 's', color: '#F59E0B' }
};

// ─── The Chart itself ─────────────────────────────────────────────────────────
// Fixed issues:
//   1. SVG <text> elements need fontSize/fill as SVG attributes, not Tailwind classes
//   2. Left padding increased so Y-axis labels don't get clipped
//   3. Y-axis domain uses nice rounded max/min so chart doesn't hug the bottom
//   4. Dot center-fill uses a CSS variable so it works in both light + dark mode

const W = 600;
const H = 200;
const PAD_LEFT = 42;  // room for Y-axis labels
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOT = 14;

function niceMax(v: number, metric: MetricType): number {
    if (metric === 'accuracy') return 100;
    if (v <= 0) return 10;
    // Round up to nearest nice number
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag) * mag;
}

function niceMin(v: number): number {
    if (v <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.max(0, Math.floor(v / mag) * mag);
}

// Shared filter pills used in both the "no data" state and the main chart
function FilterBar({
    metric, setMetric,
    timeRange, setTimeRange
}: {
    metric: MetricType;
    setMetric: (m: MetricType) => void;
    timeRange: TimeRange;
    setTimeRange: (t: TimeRange) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-1.5">
                {(['score', 'accuracy'] as MetricType[]).map(m => (
                    <button
                        key={m}
                        onClick={() => setMetric(m)}
                        style={{ backgroundColor: metric === m ? metricConfig[m].color : undefined }}
                        className={`px-4 py-2 text-xs font-bold rounded-full transition-all
                            ${metric === m
                                ? 'text-white'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40'}`}
                    >
                        {metricConfig[m].label}
                    </button>
                ))}
            </div>
            <div className="flex gap-1.5">
                {(['7d', '30d', 'all'] as TimeRange[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTimeRange(t)}
                        className={`px-3 py-2 text-xs font-bold rounded-full transition-all
                            ${timeRange === t
                                ? 'bg-white dark:bg-white text-black'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40'}`}
                    >
                        {t === 'all' ? 'Tutto' : t}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function ProgressLineChart({
    data,
    defaultMetric = 'score',
    defaultTimeRange = 'all'
}: ProgressLineChartProps) {
    const [metric, setMetric] = useState<MetricType>(defaultMetric);
    const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    // Filter by time range
    const filteredData = useMemo(() => {
        if (timeRange === 'all') return data;
        const now = new Date();
        const days = timeRange === '7d' ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return data.filter(d => d.fullDate >= cutoff);
    }, [data, timeRange]);

    const getValue = (d: ProgressData): number => {
        switch (metric) {
            case 'score': return d.score;
            case 'accuracy': return d.accuracy;
            case 'responseTime': return (d.responseTime || 0) / 1000;
            default: return d.score;
        }
    };

    // ── Not enough data ──────────────────────────────────────────────────────
    if (filteredData.length < 2) {
        return (
            <div className="space-y-4">
                <FilterBar metric={metric} setMetric={setMetric} timeRange={timeRange} setTimeRange={setTimeRange} />
                <div className="h-48 flex items-center justify-center text-slate-400 dark:text-white/30 italic text-sm">
                    Non ci sono abbastanza dati per questo periodo.
                </div>
            </div>
        );
    }

    // ── Domain calculation ───────────────────────────────────────────────────
    const values = filteredData.map(getValue);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);

    const domainMax = niceMax(rawMax, metric);
    const domainMin = niceMin(rawMin);
    const domainRange = domainMax - domainMin || 1;

    // ── Coordinate helpers ───────────────────────────────────────────────────
    const getX = (index: number) =>
        PAD_LEFT + (index / (filteredData.length - 1)) * (W - PAD_LEFT - PAD_RIGHT);

    const getY = (value: number) =>
        H - PAD_BOT - ((value - domainMin) / domainRange) * (H - PAD_TOP - PAD_BOT);

    // ── Smooth path (monotone cubic hermite — no overshoot) ────────────────
    const pts = filteredData.map((d, i) => ({ x: getX(i), y: getY(getValue(d)) }));

    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) {
        // Simple line for 2 points
        pathD += ` L ${pts[1].x} ${pts[1].y}`;
    } else {
        // Catmull-Rom to cubic bezier conversion (tension = 0, no overshoot)
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];

            // Tangent vectors (Catmull-Rom with factor 1/6 for cubic bezier)
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
    }

    const areaD = `${pathD} L ${W - PAD_RIGHT} ${H - PAD_BOT} L ${PAD_LEFT} ${H - PAD_BOT} Z`;

    const config = metricConfig[metric];

    // Y-axis tick values: min, mid, max
    const yTicks = [domainMin, domainMin + domainRange / 2, domainMax];

    return (
        <div className="space-y-4">
            <FilterBar metric={metric} setMetric={setMetric} timeRange={timeRange} setTimeRange={setTimeRange} />

            {/* SVG chart */}
            <div className="w-full overflow-hidden relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ overflow: 'hidden' }}>
                    <defs>
                        <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={config.color} stopOpacity="0.25" />
                            <stop offset="60%" stopColor={config.color} stopOpacity="0.06" />
                            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
                        </linearGradient>
                        {/* Clip path keeps the chart content inside the SVG bounds */}
                        <clipPath id={`clip-${metric}`}>
                            <rect x={PAD_LEFT} y={0} width={W - PAD_LEFT - PAD_RIGHT} height={H} />
                        </clipPath>
                    </defs>

                    {/* Y-axis grid lines + labels */}
                    {yTicks.map((v, i) => {
                        const y = getY(v);
                        const label = metric === 'accuracy'
                            ? `${v.toFixed(0)}%`
                            : v.toFixed(v < 10 ? 1 : 0);
                        return (
                            <g key={i}>
                                {/* Dashed grid line */}
                                <line
                                    x1={PAD_LEFT} y1={y}
                                    x2={W - PAD_RIGHT} y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.08"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    className="text-slate-900 dark:text-white"
                                />
                                {/* Y label — use SVG attributes, NOT Tailwind font-size classes */}
                                <text
                                    x={PAD_LEFT - 6}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fontWeight="500"
                                    fill="currentColor"
                                    fillOpacity="0.35"
                                    className="text-slate-900 dark:text-white"
                                >
                                    {label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Clipped group: area + line + dots stay inside chart bounds */}
                    <g clipPath={`url(#clip-${metric})`}>
                        {/* Area fill */}
                        <path d={areaD} fill={`url(#grad-${metric})`} />

                        {/* Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke={config.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Dots */}
                        {filteredData.map((d, i) => (
                            <circle
                                key={i}
                                cx={getX(i)}
                                cy={getY(getValue(d))}
                                r={hoveredPoint === i ? 7 : 4}
                                fill="transparent"
                                stroke={config.color}
                                strokeWidth="2.5"
                                className="cursor-pointer"
                                style={{ transition: 'r 0.1s ease' }}
                                onMouseEnter={() => setHoveredPoint(i)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && filteredData[hoveredPoint] && (
                    <div
                        className="absolute bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-xl border border-slate-100 dark:border-white/[0.06] p-3 z-10 pointer-events-none"
                        style={{
                            left: `${(getX(hoveredPoint) / W) * 100}%`,
                            top: `${(getY(getValue(filteredData[hoveredPoint])) / H) * 100 - 20}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <p className="text-xs text-slate-500 dark:text-white/35 mb-1">
                            {filteredData[hoveredPoint].date}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {getValue(filteredData[hoveredPoint]).toFixed(1)} {config.unit}
                        </p>
                        {filteredData[hoveredPoint].id && (
                            <Link
                                to={`/quiz/results/${filteredData[hoveredPoint].id}`}
                                className="text-[10px] font-bold text-[#00B1FF] hover:underline pointer-events-auto"
                            >
                                Vedi dettagli →
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/25 font-medium"
                style={{ paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT }}
            >
                <span>{filteredData[0]?.date}</span>
                <span>{filteredData[filteredData.length - 1]?.date}</span>
            </div>
        </div>
    );
}
