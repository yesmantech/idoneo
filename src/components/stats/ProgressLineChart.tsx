import React from 'react';

interface ProgressData {
    date: string;
    score: number; // 0-100 or 0-30
}

interface ProgressLineChartProps {
    data: ProgressData[];
}

export default function ProgressLineChart({ data }: ProgressLineChartProps) {
    if (data.length < 2) return <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">Non ci sono abbastanza dati per mostrare il grafico.</div>;

    // Dimensions
    const width = 600;
    const height = 200;
    const padding = 20;

    // Scales
    const maxScore = Math.max(...data.map(d => d.score), 10); // Min 10
    const minScore = 0;

    // X Scale (Index based for simplicity)
    const getX = (index: number) => {
        return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    // Y Scale
    const getY = (score: number) => {
        return height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
    };

    // Path
    const pathD = data.map((d, i) => {
        const x = getX(i);
        const y = getY(d.score);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Area Path
    const areaD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06D6D3" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#06D6D3" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y Axis Grid */}
                {[0, 0.5, 1].map(t => {
                    const y = getY(minScore + (maxScore - minScore) * t);
                    return <line key={t} x1={padding} y1={y} x2={width - padding} stroke="#F3F5F7" strokeWidth="1.5" strokeDasharray="4" />;
                })}

                {/* Area */}
                <path d={areaD} fill="url(#gradientArea)" />

                {/* Line */}
                <path d={pathD} fill="none" stroke="#06D6D3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots */}
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(d.score)}
                        r="5"
                        className="fill-white stroke-brand-cyan stroke-[3] hover:r-7 transition-all cursor-pointer"
                    >
                        <title>{d.date}: {d.score.toFixed(1)}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
}
