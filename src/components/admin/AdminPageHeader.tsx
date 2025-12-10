import React from 'react';
import { Link } from 'react-router-dom';

// ================== TYPES ==================

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface ActionButton {
    label: string;
    onClick: () => void;
    icon?: string;
    variant?: 'primary' | 'secondary';
}

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumb?: BreadcrumbItem[];
    action?: ActionButton;
    actions?: React.ReactNode;
    statusBadge?: React.ReactNode;
}

// ================== MAIN COMPONENT ==================

export default function AdminPageHeader({
    title,
    subtitle,
    breadcrumb,
    action,
    actions,
    statusBadge,
}: AdminPageHeaderProps) {
    return (
        <header className="mb-6">
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    {breadcrumb.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-slate-600">/</span>}
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="hover:text-slate-300 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-slate-400">{item.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                        {statusBadge}
                    </div>
                    {subtitle && (
                        <p className="text-slate-400 mt-1">{subtitle}</p>
                    )}
                </div>

                {/* Actions (Custom Node or Single Button) */}
                {actions ? (
                    <div>{actions}</div>
                ) : action ? (
                    <button
                        onClick={action.onClick}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg ${action.variant === 'secondary'
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-slate-900/50'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25'
                            }`}
                    >
                        {action.icon && <span>{action.icon}</span>}
                        <span>{action.label}</span>
                    </button>
                ) : null}
            </div>
        </header>
    );
}
