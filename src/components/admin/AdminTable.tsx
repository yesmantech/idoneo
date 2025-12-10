import React from 'react';

// ================== TYPES ==================

interface Column<T> {
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
}

interface MenuItem {
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyState?: React.ReactNode;
    rowKey: (item: T) => string;
    onRowClick?: (item: T) => void;
    rowActions?: (item: T) => MenuItem[];
}

// ================== ROW ACTIONS MENU ==================

interface RowActionsMenuProps {
    actions: MenuItem[];
}

function RowActionsMenu({ actions }: RowActionsMenuProps) {
    const [open, setOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
                ⋮
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                action.onClick();
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${action.variant === 'destructive'
                                    ? 'text-rose-400 hover:bg-rose-500/10'
                                    : 'text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            {action.icon && <span>{action.icon}</span>}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ================== LOADING SKELETON ==================

function TableSkeleton({ columns }: { columns: number }) {
    return (
        <div className="animate-pulse">
            {[1, 2, 3, 4, 5].map(row => (
                <div key={row} className="flex gap-4 px-4 py-3 border-b border-slate-800/50">
                    {Array.from({ length: columns }).map((_, col) => (
                        <div key={col} className="flex-1 h-4 bg-slate-800 rounded" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ================== MAIN COMPONENT ==================

export default function AdminTable<T>({
    columns,
    data,
    loading = false,
    emptyState,
    rowKey,
    onRowClick,
    rowActions,
}: AdminTableProps<T>) {
    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                <TableSkeleton columns={columns.length} />
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                {emptyState}
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    {/* Header */}
                    <thead className="bg-slate-900/80 border-b border-slate-800">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider ${col.align === 'center' ? 'text-center' :
                                            col.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {rowActions && (
                                <th className="py-3 px-4 w-12" />
                            )}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-slate-800/50">
                        {data.map((item, rowIndex) => (
                            <tr
                                key={rowKey(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`transition-colors ${onRowClick
                                        ? 'cursor-pointer hover:bg-slate-800/50'
                                        : 'hover:bg-slate-800/30'
                                    }`}
                            >
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`py-3 px-4 text-slate-300 ${col.align === 'center' ? 'text-center' :
                                                col.align === 'right' ? 'text-right' : 'text-left'
                                            }`}
                                    >
                                        {col.render
                                            ? col.render(item, rowIndex)
                                            : String((item as Record<string, unknown>)[col.key] ?? '-')
                                        }
                                    </td>
                                ))}
                                {rowActions && (
                                    <td className="py-3 px-4">
                                        <RowActionsMenu actions={rowActions(item)} />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
