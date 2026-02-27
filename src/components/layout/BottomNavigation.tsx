import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

/**
 * Praktika-style bottom navigation (Skitla reference).
 *
 * - Solid white background, taller bar
 * - Single icon style (always filled) — only color changes
 * - Bold label when active, medium when inactive
 * - 5 tabs: Home, Bandi, AI (center), Classifiche, Profilo
 * - Brand blue (#0095FF) active color
 */

// ──────────────────────────────────────
// SVG Icons — always same style, only color changes
// ──────────────────────────────────────

function HomeIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.71 2.29a1 1 0 00-1.42 0l-9 9a1 1 0 001.42 1.42L4 12.41V21a1 1 0 001 1h5a1 1 0 001-1v-5h2v5a1 1 0 001 1h5a1 1 0 001-1v-8.59l.29.3a1 1 0 001.42-1.42l-9-9z" />
        </svg>
    );
}

function BandiIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <path d="M14 2v6h6" opacity="0.4" />
            <path d="M8 13h8M8 17h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function AiIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
            <path d="M20 3v4M22 5h-4" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function ClassificheIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4h-.53A5.99 5.99 0 0113 15.92V18h2a3 3 0 013 3H6a3 3 0 013-3h2v-2.08A5.99 5.99 0 017.53 12H7c-2.21 0-4-1.79-4-4V5a1 1 0 011-1h3zm-3 1v3c0 1.66 1.34 3 3 3h.68A6.02 6.02 0 017 8.5V5H4zm16 0h-3v3.5A6.02 6.02 0 0116.32 11H17c1.66 0 3-1.34 3-3V5z" />
        </svg>
    );
}

function ProfileIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21a6.5 6.5 0 0113 0z" />
        </svg>
    );
}

// ──────────────────────────────────────
// Nav Items
// ──────────────────────────────────────

const NAV_ITEMS = [
    { label: 'Home', path: '/', IconComponent: HomeIcon },
    { label: 'Bandi', path: '/bandi', IconComponent: BandiIcon },
    { label: 'AI', path: '/ai-assistant', IconComponent: AiIcon },
    { label: 'Classifiche', path: '/leaderboard', IconComponent: ClassificheIcon },
    { label: 'Profilo', path: '/profile', IconComponent: ProfileIcon },
];

const ACTIVE_COLOR = '#0095FF';
const INACTIVE_COLOR = '#9CA3AF';

// ──────────────────────────────────────
// Component
// ──────────────────────────────────────

export default function BottomNavigation() {
    const location = useLocation();
    const isNativeApp = Capacitor.isNativePlatform();

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
            style={{
                paddingBottom: isNativeApp
                    ? 'env(safe-area-inset-bottom, 0px)'
                    : '0px',
            }}
        >
            <nav
                className="flex items-end justify-around"
                style={{
                    background: '#FFFFFF',
                    paddingTop: '14px',
                    paddingBottom: isNativeApp
                        ? 'max(10px, env(safe-area-inset-bottom, 10px))'
                        : '10px',
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
                            <div
                                style={{
                                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.15s ease',
                                }}
                            >
                                <item.IconComponent />
                            </div>
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                                    transition: 'color 0.15s ease',
                                    lineHeight: 1.3,
                                    letterSpacing: '-0.01em',
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
