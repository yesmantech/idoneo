import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';
import { isStandaloneApp } from '@/lib/standalone';

/**
 * Praktika-style bottom navigation with dark mode support.
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const ACTIVE_COLOR = '#0095FF';

export default function BottomNavigation() {
    const location = useLocation();
    const isStandalone = isStandaloneApp();

    // Dark mode detection
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const inactiveColor = isDark ? '#6B7280' : '#9CA3AF'; // gray-500 in dark, gray-400 in light
    const bgColor = isDark ? '#000000' : '#FFFFFF';       // true black in dark, white in light

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
            style={{ background: bgColor }}
        >
            <nav
                className="flex items-end justify-around"
                style={{
                    paddingTop: '12px',
                    paddingBottom: '8px',
                    transition: 'background-color 0.3s ease',
                }}
            >
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-end flex-1"
                            style={{
                                gap: '4px',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                        >
                            <item.Icon
                                size={24}
                                color={isActive ? ACTIVE_COLOR : inactiveColor}
                                strokeWidth={2}
                                style={{ transition: 'color 0.15s ease' }}
                            />
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? ACTIVE_COLOR : inactiveColor,
                                    transition: 'color 0.15s ease',
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
            {/* Safe area fill — extends the background into the home indicator area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
    );
}

