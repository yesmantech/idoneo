import React from 'react';

interface SubjectData {
    subject: string;
    accuracy: number; // 0-100
    total: number;
}

interface SubjectRadarChartProps {
    data: SubjectData[];
}

export default function SubjectRadarChart({ data }: SubjectRadarChartProps) {
    if (data.length < 3) {
        return <FallbackBarChart data={data} />;
    }

    // Radar Logic
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 40; // Padding
    const axisCount = data.length;

    // Helper to get coordinates
    const getCoordinates = (value: number, index: number) => {
        const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
        const x = center + (radius * (value / 100)) * Math.cos(angle);
        const y = center + (radius * (value / 100)) * Math.sin(angle);
        return { x, y };
    };

    // Calculate Points for Data Polygon
    const points = data.map((d, i) => {
        const { x, y } = getCoordinates(d.accuracy, i);
        return `${x},${y}`;
    }).join(' ');

    // Calculate Axis Lines & Labels
    const axes = data.map((d, i) => {
        const { x, y } = getCoordinates(100, i);
        // Label offset slightly further
        const angle = (Math.PI * 2 * i) / axisCount - Math.PI / 2;
        const lx = center + (radius + 20) * Math.cos(angle);
        const ly = center + (radius + 20) * Math.sin(angle);

        return { x, y, lx, ly, label: d.subject };
    });

    // Grid Levels (20%, 40%, 60%, 80%, 100%)
    const levels = [20, 40, 60, 80, 100];

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Webs */}
                {levels.map(level => {
                    const levelPoints = data.map((_, i) => {
                        const { x, y } = getCoordinates(level, i);
                        return `${x},${y}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={level}
                            points={levelPoints}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Axes */}
                {axes.map((axis, i) => (
                    <g key={i}>
                        <line x1={center} y1={center} x2={axis.x} y2={axis.y} stroke="#e2e8f0" strokeWidth="1" />
                        <text
                            x={axis.lx}
                            y={axis.ly}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] fill-slate-500 font-bold uppercase"
                        >
                            {axis.label.substring(0, 15)}
                        </text>
                    </g>
                ))}

                {/* Data Polygon */}
                <polygon
                    points={points}
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Data Points */}
                {data.map((d, i) => {
                    const { x, y } = getCoordinates(d.accuracy, i);
                    return (
                        <circle key={i} cx={x} cy={y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                    );
                })}
            </svg>
        </div>
    );
}

function FallbackBarChart({ data }: { data: SubjectData[] }) {
    return (
        <div className="space-y-4 w-full">
            {data.map(d => (
                <div key={d.subject}>
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-slate-700">{d.subject}</span>
                        <span className="text-sm font-medium text-slate-500">{d.accuracy.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${d.accuracy >= 70 ? 'bg-emerald-500' : d.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${d.accuracy}%` }}
                        />
                    </div>
                </div>
            ))}
            {data.length === 0 && <p className="text-slate-400 text-sm text-center">Nessun dato materia.</p>}
        </div>
    );
}
