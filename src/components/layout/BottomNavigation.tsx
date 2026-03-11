import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';

/**
 * Floating pill-style bottom navigation (Skitla reference).
 * - Semi-transparent dark glass pill floating above the safe area
 * - Icon-only navigation (no labels)
 * - Active item gets a glowing pill highlight
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const ACTIVE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.45)';

export default function BottomNavigation() {
    const location = useLocation();

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
            <nav
                className="pointer-events-auto flex items-center justify-around"
                style={{
                    background: 'rgba(15, 15, 20, 0.85)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    borderRadius: '28px',
                    padding: '10px 8px',
                    width: 'min(92%, 420px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset',
                }}
            >
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center justify-center relative"
                            style={{
                                width: isActive ? '56px' : '48px',
                                height: '44px',
                                borderRadius: '20px',
                                background: isActive
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                            aria-label={item.label}
                        >
                            <item.Icon
                                size={isActive ? 24 : 22}
                                color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                                strokeWidth={isActive ? 2.2 : 1.8}
                                style={{
                                    transition: 'all 0.2s ease',
                                    filter: isActive ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))' : 'none',
                                }}
                            />
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
