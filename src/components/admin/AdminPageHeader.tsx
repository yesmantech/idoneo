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
        <header className="mb-8">
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-2">
                    {breadcrumb.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-gray-300">/</span>}
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="hover:text-brand-cyan transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-500 font-bold">{item.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                        {statusBadge}
                    </div>
                    {subtitle && (
                        <p className="text-slate-500 mt-1 text-[15px]">{subtitle}</p>
                    )}
                </div>

                {/* Actions (Custom Node or Single Button) */}
                {actions ? (
                    <div>{actions}</div>
                ) : action ? (
                    <button
                        onClick={action.onClick}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 ${action.variant === 'secondary'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                            : 'bg-[#00B1FF] text-white border border-[#00B1FF] hover:bg-[#0091D5] shadow-[0_4px_12px_rgba(0,177,255,0.3)]'
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
