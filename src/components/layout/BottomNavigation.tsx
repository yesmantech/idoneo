import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Scroll, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

/**
 * Skitla-style bottom navigation with:
 * - Glassmorphic translucent background (light + dark mode)
 * - Animated sliding pill indicator (spring physics)
 * - Purple active state (#8B5CF6)
 * - Outline icons with scale animation
 * - Small labels with color transition
 */

const NAV_ITEMS = [
    { Icon: Home, label: 'Home', path: '/' },
    { Icon: Scroll, label: 'Bandi', path: '/bandi' },
    { Icon: Trophy, label: 'Classifiche', path: '/leaderboard' },
    { Icon: User, label: 'Profilo', path: '/profile' },
];

const ACTIVE_COLOR = '#8B5CF6';
const INACTIVE_COLOR_LIGHT = '#94A3B8';
const INACTIVE_COLOR_DARK = '#64748B';

export default function BottomNavigation() {
    const location = useLocation();
    const isNativeApp = Capacitor.isNativePlatform();
    const navRef = useRef<HTMLDivElement>(null);
    const [pillMetrics, setPillMetrics] = useState({ left: 0, width: 0 });
    const [isDark, setIsDark] = useState(false);

    // Dark mode detection
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const inactiveColor = isDark ? INACTIVE_COLOR_DARK : INACTIVE_COLOR_LIGHT;

    // Determine active index
    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    // Calculate pill position
    const updatePill = () => {
        if (!navRef.current || activeIndex < 0) return;
        const items = navRef.current.querySelectorAll('[data-nav-item]');
        const activeEl = items[activeIndex] as HTMLElement;
        if (!activeEl) return;

        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();

        setPillMetrics({
            left: itemRect.left - navRect.left,
            width: itemRect.width,
        });
    };

    useEffect(() => {
        const timer = setTimeout(updatePill, 50);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    useEffect(() => {
        window.addEventListener('resize', updatePill);
        return () => window.removeEventListener('resize', updatePill);
    }, [activeIndex]);

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
            style={{
                paddingBottom: isNativeApp
                    ? 'max(0px, env(safe-area-inset-bottom, 0px))'
                    : '0px',
            }}
        >
            <nav
                ref={navRef}
                className="relative flex items-center justify-around"
                style={{
                    background: isDark
                        ? 'rgba(15, 23, 42, 0.92)'
                        : 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderTop: isDark
                        ? '0.5px solid rgba(255, 255, 255, 0.06)'
                        : '0.5px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: isDark
                        ? '0 -4px 24px rgba(0, 0, 0, 0.15)'
                        : '0 -4px 24px rgba(0, 0, 0, 0.03)',
                    paddingTop: '8px',
                    paddingBottom: isNativeApp
                        ? 'max(8px, env(safe-area-inset-bottom, 8px))'
                        : '8px',
                }}
            >
                {/* Sliding Pill Indicator */}
                {activeIndex >= 0 && pillMetrics.width > 0 && (
                    <motion.div
                        className="absolute pointer-events-none"
                        style={{
                            top: '4px',
                            height: '44px',
                            borderRadius: '14px',
                            background: isDark
                                ? 'rgba(139, 92, 246, 0.12)'
                                : 'rgba(139, 92, 246, 0.08)',
                        }}
                        animate={{
                            left: pillMetrics.left,
                            width: pillMetrics.width,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 34,
                            mass: 0.8,
                        }}
                    />
                )}

                {/* Nav Items */}
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            data-nav-item
                            className="relative z-10 flex flex-col items-center justify-center gap-0.5 flex-1"
                            style={{
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <motion.div
                                animate={{ scale: isActive ? 1.12 : 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 28,
                                }}
                            >
                                <item.Icon
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        color: isActive ? ACTIVE_COLOR : inactiveColor,
                                        strokeWidth: 1.5,
                                        transition: 'color 0.2s ease',
                                    }}
                                />
                            </motion.div>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    color: isActive ? ACTIVE_COLOR : inactiveColor,
                                    transition: 'color 0.2s ease',
                                    lineHeight: 1.2,
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
