import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogCategory } from "@/types/blog";
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    EmptyState,
} from '@/components/admin';

export default function AdminBlogCategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order', { ascending: true });
        if (data) setCategories(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare la categoria "${name}"?`)) return;
        await supabase.from('blog_categories').delete().eq('id', id);
        loadData();
    };

    const columns = [
        {
            key: 'name',
            label: 'Nome',
            render: (cat: BlogCategory) => (
                <div>
                    <div className="font-medium text-slate-900">{cat.name}</div>
                    <div className="text-xs text-slate-500 font-mono">/blog/category/{cat.slug}</div>
                </div>
            )
        },
        {
            key: 'sort_order',
            label: 'Ordine',
            width: '100px',
            render: (cat: BlogCategory) => (
                <span className="text-sm text-slate-500 font-mono">
                    {cat.sort_order}
                </span>
            )
        }
    ];

    const rowActions = (cat: BlogCategory) => [
        {
            label: 'Elimina',
            icon: '🗑️',
            onClick: () => handleDelete(cat.id, cat.name),
            variant: 'destructive' as const
        }
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Categorie Blog"
                subtitle="Gestisci le categorie degli articoli"
                breadcrumb={[
                    { label: 'Admin', path: '/admin' },
                    { label: 'Blog', path: '/admin/blog' },
                    { label: 'Categorie' }
                ]}
                action={{
                    label: 'Nuova Categoria',
                    icon: '+',
                    onClick: () => alert('Feature coming soon!') // Placeholder
                }}
            />

            <AdminTable
                columns={columns}
                data={categories}
                loading={loading}
                rowKey={c => c.id}
                rowActions={rowActions}
                emptyState={
                    <EmptyState
                        icon="🏷️"
                        title="Nessuna categoria"
                        description="Non ci sono categorie definite."
                    />
                }
            />
        </AdminLayout>
    );
}
