// TypeScript types for the Blog system

export type BlogPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type BlogTagType = 'concorso' | 'materia' | 'tema';

export interface BlogCategory {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
}

export interface BlogTag {
    id: string;
    slug: string;
    name: string;
    type: BlogTagType;
    concorso_id: string | null;
    created_at: string;
}

export interface BlogAuthor {
    id: string;
    user_id: string | null;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    status: BlogPostStatus;
    content: ContentBlock[];
    cover_image_url: string | null;
    author_id: string | null;
    category_id: string | null;
    reading_time_minutes: number;
    published_at: string | null;
    updated_at: string;
    created_at: string;
    // SEO
    seo_title: string | null;
    seo_description: string | null;
    canonical_url: string | null;
    og_image_url: string | null;
    is_noindex: boolean;
    is_featured: boolean;
    view_count: number;
    // Joined data
    category?: BlogCategory;
    author?: BlogAuthor;
    tags?: BlogTag[];
}

// Content Block Types for the block-based editor
export type ContentBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; level: 2 | 3; text: string }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'callout'; variant: 'tip' | 'warning' | 'note' | 'example'; title: string; text: string }
    | { type: 'faq'; items: { question: string; answer: string }[] }
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'cta'; title: string; description: string; buttonText: string; buttonUrl: string }
    | { type: 'image'; url: string; alt: string; caption?: string };

// Status labels and colors for UI
export const STATUS_CONFIG: Record<BlogPostStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Bozza', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    scheduled: { label: 'Programmato', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    published: { label: 'Pubblicato', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    archived: { label: 'Archiviato', color: 'text-amber-600', bgColor: 'bg-amber-100' },
};
