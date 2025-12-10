import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { BlogCategory, BlogTag, ContentBlock, BlogPostStatus } from '@/types/blog';

// ================== TYPES ==================

export interface BlogEditorFormState {
    title: string;
    subtitle: string;
    slug: string;
    status: BlogPostStatus;
    categoryId: string;
    selectedTags: string[];
    coverImageUrl: string;
    content: ContentBlock[];
    publishedAt: string;
    isFeatured: boolean;
    // SEO
    seoTitle: string;
    seoDescription: string;
    canonicalUrl: string;
    isNoindex: boolean;
}

export interface UseBlogEditorReturn {
    // Data
    formState: BlogEditorFormState;
    categories: BlogCategory[];
    allTags: BlogTag[];

    // Status
    isNew: boolean;
    loading: boolean;
    saving: boolean;
    uploading: boolean;

    // Actions
    updateField: <K extends keyof BlogEditorFormState>(field: K, value: BlogEditorFormState[K]) => void;
    handleTitleChange: (title: string) => void;
    handleSave: () => Promise<void>;
    handleImageUpload: (file: File) => Promise<void>;

    // Content block actions
    addBlock: (type: ContentBlock['type']) => void;
    updateBlock: (index: number, updates: Partial<ContentBlock>) => void;
    removeBlock: (index: number) => void;
    moveBlock: (index: number, direction: 'up' | 'down') => void;

    // Navigation
    navigate: ReturnType<typeof useNavigate>;
}

// ================== UTILITIES ==================

const INITIAL_FORM_STATE: BlogEditorFormState = {
    title: '',
    subtitle: '',
    slug: '',
    status: 'draft',
    categoryId: '',
    selectedTags: [],
    coverImageUrl: '',
    content: [],
    publishedAt: '',
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    isNoindex: false,
};

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function calculateReadingTime(content: ContentBlock[]): number {
    let wordCount = 0;

    for (const block of content) {
        switch (block.type) {
            case 'paragraph':
            case 'heading':
                wordCount += block.text.split(/\s+/).filter(Boolean).length;
                break;
            case 'list':
                for (const item of block.items) {
                    wordCount += item.split(/\s+/).filter(Boolean).length;
                }
                break;
            case 'callout':
                wordCount += block.text.split(/\s+/).filter(Boolean).length;
                wordCount += block.title.split(/\s+/).filter(Boolean).length;
                break;
            case 'faq':
                for (const item of block.items) {
                    wordCount += item.question.split(/\s+/).filter(Boolean).length;
                    wordCount += item.answer.split(/\s+/).filter(Boolean).length;
                }
                break;
            case 'cta':
                wordCount += block.title.split(/\s+/).filter(Boolean).length;
                wordCount += block.description.split(/\s+/).filter(Boolean).length;
                break;
        }
    }

    return Math.max(1, Math.ceil(wordCount / 200));
}

function createEmptyBlock(type: ContentBlock['type']): ContentBlock | null {
    switch (type) {
        case 'paragraph':
            return { type: 'paragraph', text: '' };
        case 'heading':
            return { type: 'heading', level: 2, text: '' };
        case 'list':
            return { type: 'list', ordered: false, items: [''] };
        case 'callout':
            return { type: 'callout', variant: 'tip', title: '', text: '' };
        case 'faq':
            return { type: 'faq', items: [{ question: '', answer: '' }] };
        case 'cta':
            return { type: 'cta', title: '', description: '', buttonText: '', buttonUrl: '' };
        default:
            return null;
    }
}

// ================== HOOK ==================

export function useBlogEditor(): UseBlogEditorReturn {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = !id || id === 'nuovo';

    // Consolidated form state (reduces from 15+ useState to 1)
    const [formState, setFormState] = useState<BlogEditorFormState>(INITIAL_FORM_STATE);

    // Reference data
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [allTags, setAllTags] = useState<BlogTag[]>([]);

    // UI state
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Generic field updater
    const updateField = useCallback(<K extends keyof BlogEditorFormState>(
        field: K,
        value: BlogEditorFormState[K]
    ) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }, []);

    // Title change with auto-slug
    const handleTitleChange = useCallback((newTitle: string) => {
        setFormState(prev => {
            const shouldUpdateSlug = isNew || prev.slug === generateSlug(prev.title);
            return {
                ...prev,
                title: newTitle,
                slug: shouldUpdateSlug ? generateSlug(newTitle) : prev.slug,
            };
        });
    }, [isNew]);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load categories and tags in parallel
                const [catsRes, tagsRes] = await Promise.all([
                    supabase.from('blog_categories').select('*').order('sort_order'),
                    supabase.from('blog_tags').select('*').order('name'),
                ]);

                if (catsRes.error) throw catsRes.error;
                if (tagsRes.error) throw tagsRes.error;

                if (catsRes.data) setCategories(catsRes.data);
                if (tagsRes.data) setAllTags(tagsRes.data);

                // Load existing post if editing
                if (!isNew && id) {
                    const { data: post, error: postError } = await supabase
                        .from('blog_posts')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (postError) throw postError;

                    if (post) {
                        setFormState({
                            title: post.title,
                            subtitle: post.subtitle || '',
                            slug: post.slug,
                            status: post.status,
                            categoryId: post.category_id || '',
                            coverImageUrl: post.cover_image_url || '',
                            content: post.content || [],
                            publishedAt: post.published_at ? post.published_at.slice(0, 16) : '',
                            isFeatured: post.is_featured,
                            seoTitle: post.seo_title || '',
                            seoDescription: post.seo_description || '',
                            canonicalUrl: post.canonical_url || '',
                            isNoindex: post.is_noindex,
                            selectedTags: [],
                        });
                    }

                    // Load post tags
                    const { data: postTags } = await supabase
                        .from('blog_post_tags')
                        .select('tag_id')
                        .eq('post_id', id);

                    if (postTags) {
                        setFormState(prev => ({
                            ...prev,
                            selectedTags: postTags.map(pt => pt.tag_id),
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load blog editor data:', error);
                alert('Errore durante il caricamento dei dati.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, isNew]);

    // Save handler
    const handleSave = useCallback(async () => {
        const { title, slug, status, categoryId, coverImageUrl, content, publishedAt, isFeatured, subtitle, seoTitle, seoDescription, canonicalUrl, isNoindex, selectedTags } = formState;

        if (!title.trim()) {
            alert('Il titolo è obbligatorio');
            return;
        }
        if (!slug.trim()) {
            alert('Lo slug è obbligatorio');
            return;
        }

        setSaving(true);

        const postData = {
            title,
            subtitle: subtitle || null,
            slug,
            status,
            category_id: categoryId || null,
            cover_image_url: coverImageUrl || null,
            content,
            reading_time_minutes: calculateReadingTime(content),
            published_at: status === 'published' && !publishedAt ? new Date().toISOString() : publishedAt || null,
            is_featured: isFeatured,
            seo_title: seoTitle || null,
            seo_description: seoDescription || null,
            canonical_url: canonicalUrl || null,
            is_noindex: isNoindex,
            updated_at: new Date().toISOString(),
        };

        try {
            let postId = id;

            if (isNew) {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .insert(postData)
                    .select('id')
                    .single();
                if (error) throw error;
                postId = data.id;
            } else {
                const { error } = await supabase
                    .from('blog_posts')
                    .update(postData)
                    .eq('id', id);
                if (error) throw error;
            }

            // Update tags
            if (postId) {
                await supabase.from('blog_post_tags').delete().eq('post_id', postId);
                if (selectedTags.length > 0) {
                    const { error: tagError } = await supabase.from('blog_post_tags').insert(
                        selectedTags.map(tagId => ({ post_id: postId, tag_id: tagId }))
                    );
                    if (tagError) throw tagError;
                }
            }

            alert('Articolo salvato con successo!');
            navigate('/admin/blog');
        } catch (error: unknown) {
            console.error('Save error:', error);
            const message = error instanceof Error ? error.message : 'Errore sconosciuto';
            alert(`Errore: ${message}`);
        } finally {
            setSaving(false);
        }
    }, [formState, id, isNew, navigate]);

    // Image upload handler
    const handleImageUpload = useCallback(async (file: File) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Per favore seleziona un file immagine (JPG, PNG, WebP)');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            alert('Il file è troppo grande (max 5MB)');
            return;
        }

        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(fileName);

            updateField('coverImageUrl', publicUrl);
        } catch (error: unknown) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : 'Controlla che il bucket "blog-images" esista e sia pubblico';
            alert(`Errore durante il caricamento: ${message}`);
        } finally {
            setUploading(false);
        }
    }, [updateField]);

    // Content block helpers
    const addBlock = useCallback((type: ContentBlock['type']) => {
        const newBlock = createEmptyBlock(type);
        if (newBlock) {
            setFormState(prev => ({
                ...prev,
                content: [...prev.content, newBlock],
            }));
        }
    }, []);

    const updateBlock = useCallback((index: number, updates: Partial<ContentBlock>) => {
        setFormState(prev => {
            const newContent = [...prev.content];
            newContent[index] = { ...newContent[index], ...updates } as ContentBlock;
            return { ...prev, content: newContent };
        });
    }, []);

    const removeBlock = useCallback((index: number) => {
        setFormState(prev => ({
            ...prev,
            content: prev.content.filter((_, i) => i !== index),
        }));
    }, []);

    const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        setFormState(prev => {
            if (newIndex < 0 || newIndex >= prev.content.length) return prev;
            const newContent = [...prev.content];
            [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
            return { ...prev, content: newContent };
        });
    }, []);

    return {
        formState,
        categories,
        allTags,
        isNew,
        loading,
        saving,
        uploading,
        updateField,
        handleTitleChange,
        handleSave,
        handleImageUpload,
        addBlock,
        updateBlock,
        removeBlock,
        moveBlock,
        navigate,
    };
}
