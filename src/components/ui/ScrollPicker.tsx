"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hapticSelection } from "@/lib/haptics";

interface ScrollPickerProps {
    items: { label: string; value: number }[];
    value: number;
    onChange: (value: number) => void;
    label?: string;
    height?: number;
    itemHeight?: number;
}

export default function ScrollPicker({ items, value, onChange, label, height = 200, itemHeight = 44 }: ScrollPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Initial scroll position
    useEffect(() => {
        if (containerRef.current) {
            const index = items.findIndex(i => i.value === value);
            if (index !== -1) {
                containerRef.current.scrollTop = index * itemHeight;
                setScrollTop(index * itemHeight);
            }
        }
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const top = e.currentTarget.scrollTop;
        setScrollTop(top);

        const index = Math.round(top / itemHeight);
        const newValue = items[index]?.value;

        if (newValue !== undefined && newValue !== value) {
            hapticSelection();
            onChange(newValue);
        }
    };

    return (
        <div className="relative flex items-center justify-center h-full px-0 w-[110px]"> {/* Increased width for native alignment */}

            <div
                ref={containerRef}
                className="overflow-y-auto snap-y snap-mandatory no-scrollbar w-full relative z-10"
                style={{
                    height,
                    perspective: '1000px',
                    maskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
                }}
                onScroll={handleScroll}
            >
                <div style={{ height: (height - itemHeight) / 2 }} />

                {items.map((item, index) => {
                    const itemOffset = index * itemHeight;
                    const distanceFromCenter = Math.abs(scrollTop - itemOffset);
                    const normalizedDistance = Math.min(distanceFromCenter / (height / 2), 1);

                    const rotateX = (scrollTop - itemOffset) * 0.12;
                    const opacity = 1 - (normalizedDistance * 0.6);
                    const isSelected = item.value === value;

                    return (
                        <div
                            key={item.value}
                            className={`snap-center flex items-center justify-end pr-[58px] tabular-nums text-[23px] transition-colors duration-150 ${isSelected
                                ? "font-semibold text-black dark:text-white"
                                : "font-normal text-black/40 dark:text-white/40"
                                }`}
                            style={{
                                height: itemHeight,
                                transform: `rotateX(${rotateX}deg)`,
                                opacity,
                                transformStyle: 'preserve-3d'
                            }}
                            onClick={() => {
                                if (containerRef.current) {
                                    containerRef.current.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
                                }
                            }}
                        >
                            {item.label}
                        </div>
                    );
                })}

                <div style={{ height: (height - itemHeight) / 2 }} />
            </div>

            {/* Label - Properly pinned to the right of the center line */}
            <div className="absolute left-[56px] top-1/2 -translate-y-1/2 flex items-center h-[34px] pointer-events-none z-20">
                <span className="text-[15px] font-semibold text-black/90 dark:text-white/90 lowercase">
                    {label}
                </span>
            </div>
        </div>
    );
}
