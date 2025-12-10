import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogTag } from "@/types/blog";
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    EmptyState,
} from '@/components/admin';

export default function AdminBlogTagsPage() {
    const navigate = useNavigate();
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('blog_tags')
            .select('*')
            .order('name', { ascending: true });
        if (data) setTags(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare il tag "${name}"?`)) return;
        await supabase.from('blog_tags').delete().eq('id', id);
        loadData();
    };

    const columns = [
        {
            key: 'name',
            label: 'Nome',
            render: (tag: BlogTag) => (
                <div>
                    <div className="font-medium text-slate-900">{tag.name}</div>
                    <div className="text-xs text-slate-500 font-mono">#{tag.slug}</div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Tipo',
            width: '150px',
            render: (tag: BlogTag) => (
                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${tag.type === 'concorso' ? 'bg-blue-100 text-blue-700' :
                        tag.type === 'materia' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                    }`}>
                    {tag.type}
                </span>
            )
        }
    ];

    const rowActions = (tag: BlogTag) => [
        {
            label: 'Elimina',
            icon: '🗑️',
            onClick: () => handleDelete(tag.id, tag.name),
            variant: 'destructive' as const
        }
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Tag Blog"
                subtitle="Gestisci i tag per filtrare gli articoli"
                breadcrumb={[
                    { label: 'Admin', path: '/admin' },
                    { label: 'Blog', path: '/admin/blog' },
                    { label: 'Tag' }
                ]}
                action={{
                    label: 'Nuovo Tag',
                    icon: '+',
                    onClick: () => alert('Feature coming soon!') // Placeholder
                }}
            />

            <AdminTable
                columns={columns}
                data={tags}
                loading={loading}
                rowKey={t => t.id}
                rowActions={rowActions}
                emptyState={
                    <EmptyState
                        icon="#️⃣"
                        title="Nessun tag"
                        description="Non ci sono tag definiti."
                    />
                }
            />
        </AdminLayout>
    );
}
