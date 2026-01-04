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
    score: { label: 'Punteggio', unit: 'pt', color: '#06D6D3' },
    accuracy: { label: 'Accuratezza', unit: '%', color: '#22C55E' },
    responseTime: { label: 'Tempo medio', unit: 's', color: '#F59E0B' }
};

export default function ProgressLineChart({
    data,
    defaultMetric = 'score',
    defaultTimeRange = 'all'
}: ProgressLineChartProps) {
    const [metric, setMetric] = useState<MetricType>(defaultMetric);
    const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    // Filter data by time range
    const filteredData = useMemo(() => {
        if (timeRange === 'all') return data;

        const now = new Date();
        const days = timeRange === '7d' ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return data.filter(d => d.fullDate >= cutoff);
    }, [data, timeRange]);

    // Get metric value
    const getValue = (d: ProgressData): number => {
        switch (metric) {
            case 'score': return d.score;
            case 'accuracy': return d.accuracy;
            case 'responseTime': return (d.responseTime || 0) / 1000; // Convert to seconds
            default: return d.score;
        }
    };

    if (filteredData.length < 2) {
        return (
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-1">
                        {(['score', 'accuracy'] as MetricType[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMetric(m)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-pill transition-all ${metric === m ? 'bg-brand-cyan text-white' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {metricConfig[m].label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        {(['7d', '30d', 'all'] as TimeRange[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-pill transition-all ${timeRange === t ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {t === 'all' ? 'Tutto' : t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">
                    Non ci sono abbastanza dati per questo periodo.
                </div>
            </div>
        );
    }

    // Dimensions
    const width = 600;
    const height = 200;
    const padding = 30;

    // Scales
    const values = filteredData.map(getValue);
    const maxValue = Math.max(...values, 10);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    const getX = (index: number) => {
        return padding + (index / (filteredData.length - 1)) * (width - padding * 2);
    };

    const getY = (value: number) => {
        return height - padding - ((value - minValue) / valueRange) * (height - padding * 2);
    };

    // Path
    const pathD = filteredData.map((d, i) => {
        const x = getX(i);
        const y = getY(getValue(d));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Area Path
    const areaD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    const config = metricConfig[metric];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-1">
                    {(['score', 'accuracy'] as MetricType[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-pill transition-all ${metric === m ? 'bg-brand-cyan text-white' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {metricConfig[m].label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {(['7d', '30d', 'all'] as TimeRange[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-pill transition-all ${timeRange === t ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {t === 'all' ? 'Tutto' : t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="w-full overflow-hidden relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={config.color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Y Axis Grid + Labels */}
                    {[0, 0.5, 1].map(t => {
                        const value = minValue + valueRange * t;
                        const y = getY(value);
                        return (
                            <g key={t}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1.5" strokeDasharray="4" />
                                <text x={padding - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[var(--foreground)] opacity-40 font-medium">
                                    {value.toFixed(0)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area */}
                    <path d={areaD} fill={`url(#gradient-${metric})`} />

                    {/* Line */}
                    <path d={pathD} fill="none" stroke={config.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Dots */}
                    {filteredData.map((d, i) => (
                        <g key={i}>
                            <circle
                                cx={getX(i)}
                                cy={getY(getValue(d))}
                                r={hoveredPoint === i ? 8 : 5}
                                fill="var(--card)"
                                stroke={config.color}
                                strokeWidth="3"
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredPoint(i)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        </g>
                    ))}
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && filteredData[hoveredPoint] && (
                    <div
                        className="absolute bg-[var(--card)] rounded-xl shadow-lg border border-[var(--card-border)] p-3 z-10 pointer-events-none transition-colors"
                        style={{
                            left: `${(getX(hoveredPoint) / width) * 100}%`,
                            top: `${(getY(getValue(filteredData[hoveredPoint])) / height) * 100 - 20}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <p className="text-xs text-[var(--foreground)] opacity-40 mb-1">{filteredData[hoveredPoint].date}</p>
                        <p className="text-sm font-bold text-[var(--foreground)]">
                            {getValue(filteredData[hoveredPoint]).toFixed(1)} {config.unit}
                        </p>
                        {filteredData[hoveredPoint].id && (
                            <Link
                                to={`/quiz/results/${filteredData[hoveredPoint].id}`}
                                className="text-[10px] font-bold text-brand-cyan hover:underline pointer-events-auto"
                            >
                                Vedi dettagli →
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* X Axis Labels (First and Last) */}
            <div className="flex justify-between text-[10px] text-text-tertiary font-medium px-2">
                <span>{filteredData[0]?.date}</span>
                <span>{filteredData[filteredData.length - 1]?.date}</span>
            </div>
        </div>
    );
}
