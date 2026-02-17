"use client";

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

interface CounterProps {
    value: number;
    duration?: number;
    className?: string;
    precision?: number;
}

export default function Counter({ value, duration = 2, className, precision = 0 }: CounterProps) {
    const spring = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const display = useTransform(spring, (current) =>
        current.toLocaleString('it-IT', {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        })
    );

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return (
        <motion.span className={className}>
            {display}
        </motion.span>
    );
}
