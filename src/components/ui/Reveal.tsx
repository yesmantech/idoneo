import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface RevealProps {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    duration?: number;
    blur?: boolean;
    y?: number;
    className?: string;
    stagger?: number;
}

// Tier S easing — snappy entry, smooth settle
const TIER_S_EASE = [0.22, 1, 0.36, 1] as const;

export const Reveal = ({
    children,
    width = 'fit-content',
    delay = 0,
    duration = 0.25,   // Was 0.5 — halved for instant feel
    blur = false,
    y = 8,             // Was 20 — subtle lift only
    className = "",
    stagger = 0
}: RevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -5% 0px" });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    const variants = {
        hidden: {
            opacity: 0,
            y,
            // No blur by default — GPU expensive
            ...(blur ? { filter: "blur(8px)" } : {})
        },
        visible: {
            opacity: 1,
            y: 0,
            ...(blur ? { filter: "blur(0px)" } : {}),
            transition: {
                duration,
                delay,
                ease: TIER_S_EASE,
                staggerChildren: stagger
            }
        }
    };

    return (
        <div ref={ref} style={{ width, position: 'relative' }} className={className}>
            <motion.div
                variants={variants as any}
                initial="hidden"
                animate={mainControls}
            >
                {children}
            </motion.div>
        </div>
    );
};

// Container for staggered children
export const RevealGroup = ({
    children,
    className,
    stagger = 0.06,   // Was 0.1
    delay = 0
}: {
    children: React.ReactNode;
    className?: string;
    stagger?: number;
    delay?: number;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -5% 0px" });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView]);

    return (
        <motion.div
            ref={ref}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: stagger, delayChildren: delay }
                }
            }}
            initial="hidden"
            animate={controls}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const RevealItem = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 6 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.2, ease: TIER_S_EASE }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
