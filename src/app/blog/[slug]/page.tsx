import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory, ContentBlock } from "@/types/blog";
import { SEO, JsonLd, generateBlogPostJsonLd, generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/components/SEO";

// Content Block Renderer
function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
    return (
        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'paragraph':
                        return <p key={idx} className="leading-loose">{block.text}</p>;

                    case 'heading':
                        const Tag = `h${block.level}` as 'h2' | 'h3';
                        return <Tag key={idx} id={`heading-${idx}`} className="scroll-mt-24 text-text-primary">{block.text}</Tag>;

                    case 'list':
                        const ListTag = block.ordered ? 'ol' : 'ul';
                        return (
                            <ListTag key={idx} className={`my-6 pl-2 space-y-3 ${block.ordered ? 'list-decimal' : 'list-none'}`}>
                                {block.items.map((item, i) => (
                                    <li key={i} className="flex gap-4 text-text-secondary leading-relaxed items-start">
                                        {!block.ordered && (
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-cyan/10 flex items-center justify-center mt-1">
                                                <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                                            </span>
                                        )}
                                        {block.ordered && (
                                            <span className="flex-shrink-0 w-6 h-6 rounded-squircle bg-brand-cyan/10 text-brand-cyan font-bold text-xs flex items-center justify-center mt-1">
                                                {i + 1}
                                            </span>
                                        )}
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ListTag>
                        );

                    case 'callout':
                        const variants = {
                            tip: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: '💡', color: 'text-emerald-800' },
                            warning: { bg: 'bg-brand-orange/10', border: 'border-brand-orange/20', icon: '⚠️', color: 'text-brand-orange' },
                            note: { bg: 'bg-brand-blue/10', border: 'border-brand-blue/20', icon: '📝', color: 'text-brand-blue' },
                            example: { bg: 'bg-brand-purple/10', border: 'border-brand-purple/20', icon: '📌', color: 'text-brand-purple' },
                        };
                        const v = variants[block.variant];
                        return (
                            <div key={idx} className={`${v.bg} ${v.border} border rounded-2xl p-6 my-8 not-prose shadow-sm`}>
                                <div className={`font-bold ${v.color} mb-2 flex items-center gap-2`}>
                                    <span className="text-xl">{v.icon}</span> {block.title}
                                </div>
                                <div className={`${v.color} opacity-80 leading-relaxed font-medium`}>{block.text}</div>
                            </div>
                        );

                    case 'faq':
                        return (
                            <div key={idx} className="space-y-4 my-10 not-prose">
                                {block.items.map((item, i) => (
                                    <details key={i} className="bg-canvas-light rounded-2xl border border-transparent hover:border-text-tertiary/20 overflow-hidden group transition-all duration-200">
                                        <summary className="px-6 py-5 cursor-pointer font-bold text-text-primary hover:text-brand-cyan list-none flex items-center justify-between">
                                            {item.question}
                                            <span className="text-text-tertiary group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="px-6 pb-5 text-text-secondary leading-relaxed border-t border-text-tertiary/10 pt-4 mx-6 mt-0">{item.answer}</div>
                                    </details>
                                ))}
                            </div>
                        );

                    case 'cta':
                        return (
                            <div key={idx} className="bg-gradient-to-br from-brand-cyan to-brand-blue rounded-3xl p-8 my-10 text-white not-prose text-center shadow-card relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-3xl absolute inset-0 pointer-events-none" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-3">{block.title}</h3>
                                    <p className="opacity-90 mb-6 font-medium text-lg leading-relaxed max-w-lg mx-auto">{block.description}</p>
                                    <Link to={block.buttonUrl} className="inline-block bg-white text-brand-blue font-bold px-8 py-3.5 rounded-pill shadow-lg hover:scale-105 transition-transform">
                                        {block.buttonText}
                                    </Link>
                                </div>
                            </div>
                        );

                    case 'image':
                        return (
                            <figure key={idx} className="my-10">
                                <img src={block.url} alt={block.alt} className="rounded-2xl w-full shadow-soft" />
                                {block.caption && <figcaption className="text-center text-sm text-text-tertiary mt-3 font-medium">{block.caption}</figcaption>}
                            </figure>
                        );

                    case 'table':
                        return (
                            <div key={idx} className="overflow-x-auto my-8 rounded-2xl border border-canvas-light shadow-sm">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-canvas-light">
                                        <tr>
                                            {block.headers.map((h, i) => <th key={i} className="text-left px-6 py-4 font-bold text-text-primary text-sm">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-canvas-light">
                                        {block.rows.map((row, ri) => (
                                            <tr key={ri} className="hover:bg-canvas-light/50 transition-colors">
                                                {row.map((cell, ci) => <td key={ci} className="px-6 py-4 text-sm text-text-secondary">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}

// Table of Contents
function TableOfContents({ blocks }: { blocks: ContentBlock[] }) {
    const headings = blocks
        .map((b, idx) => b.type === 'heading' ? { ...b, idx } : null)
        .filter(Boolean) as ({ type: 'heading'; level: 2 | 3; text: string; idx: number })[];

    if (headings.length === 0) return null;

    return (
        <nav className="bg-canvas-light rounded-2xl p-6 mb-10 border border-transparent hover:border-text-tertiary/10 transition-colors">
            <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">📑 Indice dell'articolo</h4>
            <ul className="space-y-2.5">
                {headings.map(h => (
                    <li key={h.idx} className={h.level === 3 ? 'ml-4' : ''}>
                        <a
                            href={`#heading-${h.idx}`}
                            className="text-text-secondary hover:text-brand-cyan text-sm font-medium transition-colors block py-0.5"
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        loadPost();
    }, [slug]);

    const loadPost = async () => {
        // Fetch the post
        const { data: postData, error } = await supabase
            .from('blog_posts')
            .select(`
                *,
                category:blog_categories(*),
                author:blog_authors(*)
            `)
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !postData) {
            navigate('/blog');
            return;
        }

        setPost(postData as BlogPost);

        // Increment view count
        await supabase
            .from('blog_posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', postData.id);

        // Fetch related posts (same category)
        if (postData.category_id) {
            const { data: related } = await supabase
                .from('blog_posts')
                .select('id, slug, title, subtitle, cover_image_url, published_at, reading_time_minutes')
                .eq('category_id', postData.category_id)
                .eq('status', 'published')
                .neq('id', postData.id)
                .limit(3);
            if (related) setRelatedPosts(related as BlogPost[]);
        }

        setLoading(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Share URLs
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = post?.title || '';

    // Generate structured data
    const blogPostJsonLd = useMemo(() => post ? generateBlogPostJsonLd({
        title: post.seo_title || post.title,
        description: post.seo_description || post.subtitle || undefined,
        slug: post.slug,
        coverImage: post.og_image_url || post.cover_image_url || undefined,
        authorName: post.author?.display_name,
        publishedAt: post.published_at || undefined,
        updatedAt: post.updated_at,
        categoryName: post.category?.name,
    }) : null, [post]);

    const breadcrumbJsonLd = useMemo(() => {
        const items = [
            { name: 'Home', url: 'https://idoneo.it/' },
            { name: 'Blog', url: 'https://idoneo.it/blog' },
        ];
        if (post?.category) {
            items.push({ name: post.category.name, url: `https://idoneo.it/blog/categoria/${post.category.slug}` });
        }
        if (post) {
            items.push({ name: post.title, url: `https://idoneo.it/blog/${post.slug}` });
        }
        return generateBreadcrumbJsonLd(items);
    }, [post]);

    // Extract FAQ items for structured data
    const faqItems = useMemo(() => {
        if (!post?.content) return [];
        const faqs: { question: string; answer: string }[] = [];
        post.content.forEach(block => {
            if (block.type === 'faq') {
                faqs.push(...block.items);
            }
        });
        return faqs;
    }, [post]);

    if (loading) {
        return (
            <div className="min-h-screen bg-canvas-light flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-text-tertiary font-medium">Caricamento post...</div>
                </div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-canvas-light text-text-primary font-sans">
            {/* SEO Meta Tags */}
            <SEO
                title={`${post.seo_title || post.title} | IDONEO Blog`}
                description={post.seo_description || post.subtitle || undefined}
                canonical={post.canonical_url || `https://idoneo.it/blog/${post.slug}`}
                ogTitle={post.seo_title || post.title}
                ogDescription={post.seo_description || post.subtitle || undefined}
                ogImage={post.og_image_url || post.cover_image_url || undefined}
                noindex={post.is_noindex}
                type="article"
                publishedTime={post.published_at || undefined}
                modifiedTime={post.updated_at}
                author={post.author?.display_name}
            />

            {/* JSON-LD Structured Data */}
            <JsonLd data={[
                blogPostJsonLd,
                breadcrumbJsonLd,
                ...(faqItems.length > 0 ? [generateFaqJsonLd(faqItems)] : [])
            ].filter(Boolean)} />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-squircle bg-brand-cyan text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">I</div>
                        <span className="text-lg font-black tracking-tight text-text-primary">IDONEO</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link to="/blog" className="text-text-secondary hover:text-brand-cyan font-bold text-sm transition-colors">← Torna al Blog</Link>
                    </nav>
                </div>
            </header>

            <main className="py-12 px-4 sm:px-6">
                <article className="max-w-4xl mx-auto bg-white rounded-[32px] p-6 md:p-12 shadow-soft">
                    {/* Breadcrumbs */}
                    <nav className="text-xs text-text-tertiary mb-8 font-medium">
                        <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
                        <span className="mx-2 text-text-tertiary/50">/</span>
                        <Link to="/blog" className="hover:text-text-primary transition-colors">Blog</Link>
                        {post.category && (
                            <>
                                <span className="mx-2 text-text-tertiary/50">/</span>
                                <span className="text-text-secondary">{post.category.name}</span>
                            </>
                        )}
                    </nav>

                    {/* Category Pill */}
                    {post.category && (
                        <span className="inline-block px-4 py-1.5 bg-brand-cyan/10 text-brand-cyan text-xs font-black rounded-pill uppercase tracking-wider mb-6">
                            {post.category.name}
                        </span>
                    )}

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-black text-text-primary mb-6 leading-[1.15] tracking-tight">{post.title}</h1>

                    {/* Subtitle */}
                    {post.subtitle && (
                        <p className="text-xl text-text-secondary mb-8 leading-relaxed font-medium">{post.subtitle}</p>
                    )}

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary mb-10 pb-10 border-b border-canvas-light">
                        {post.author && (
                            <div className="flex items-center gap-3">
                                {post.author.avatar_url && (
                                    <img src={post.author.avatar_url} alt="" className="w-10 h-10 rounded-squircle object-cover bg-canvas-light shadow-sm" />
                                )}
                                <div>
                                    <div className="font-bold text-text-primary text-sm">{post.author.display_name}</div>
                                    <div className="text-xs text-text-tertiary">Autore</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-4 ml-auto sm:ml-0">
                            <span className="flex items-center gap-1.5 font-medium"><span className="text-lg">📅</span> {formatDate(post.published_at)}</span>
                            <span className="flex items-center gap-1.5 font-medium"><span className="text-lg">⏱️</span> {post.reading_time_minutes} min lettura</span>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {post.cover_image_url && (
                        <div className="rounded-2xl overflow-hidden shadow-soft mb-12 transform hover:scale-[1.01] transition-transform duration-500">
                            <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}

                    {/* Table of Contents */}
                    <TableOfContents blocks={post.content || []} />

                    {/* Content */}
                    <ContentRenderer blocks={post.content || []} />

                    {/* Bottom CTA */}
                    <div className="bg-text-primary rounded-[32px] p-8 md:p-12 my-16 text-white text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-brand-cyan/30 transition-colors" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black mb-4">Inizia a prepararti con IDONEO</h3>
                            <p className="opacity-80 mb-8 text-lg max-w-lg mx-auto leading-relaxed">Simulazioni, quiz e statistiche per vincere il tuo concorso. Migliaia di studenti si allenano già qui.</p>
                            <Link to="/concorsi" className="inline-block bg-brand-cyan text-white font-bold px-10 py-4 rounded-pill hover:bg-brand-cyan/90 hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg hover:shadow-cyan-500/25">
                                Esplora i Concorsi
                            </Link>
                        </div>
                    </div>

                    {/* Share Section */}
                    <div className="flex flex-col items-center gap-4 py-8 border-t border-canvas-light">
                        <span className="text-text-tertiary text-sm font-bold uppercase tracking-widest">Condividi questo articolo</span>
                        <div className="flex items-center gap-3">
                            <a href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`} target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-canvas-light flex items-center justify-center text-xl hover:bg-[#25D366] hover:text-white transition-all transform hover:scale-110">📱</a>
                            <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-canvas-light flex items-center justify-center text-xl hover:bg-[#0088cc] hover:text-white transition-all transform hover:scale-110">✈️</a>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-canvas-light flex items-center justify-center text-xl hover:bg-[#1DA1F2] hover:text-white transition-all transform hover:scale-110">🐦</a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-canvas-light flex items-center justify-center text-xl hover:bg-[#0077b5] hover:text-white transition-all transform hover:scale-110">💼</a>
                        </div>
                    </div>
                </article>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="max-w-4xl mx-auto mt-16 px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-text-primary">Articoli correlati</h3>
                            <Link to="/blog" className="text-brand-cyan font-bold hover:underline">Vedi tutti</Link>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {relatedPosts.map(p => (
                                <Link
                                    key={p.id}
                                    to={`/blog/${p.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                                >
                                    {p.cover_image_url && (
                                        <div className="aspect-[4/3] overflow-hidden bg-canvas-light relative">
                                            <img
                                                src={p.cover_image_url}
                                                alt={p.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h4 className="font-bold text-lg text-text-primary group-hover:text-brand-cyan transition-colors line-clamp-2 mb-3">{p.title}</h4>
                                        <div className="mt-auto flex items-center justify-between text-xs text-text-tertiary font-medium">
                                            <span>{formatDate(p.published_at)}</span>
                                            <span>{p.reading_time_minutes} min</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-canvas-light py-10 mt-12">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm text-text-tertiary font-medium">
                    <p>© {new Date().getFullYear()} IDONEO - La piattaforma per prepararti ai concorsi pubblici</p>
                    <div className="mt-4 flex justify-center gap-6 opacity-70">
                        <Link to="/privacy" className="hover:text-text-primary">Privacy</Link>
                        <Link to="/terms" className="hover:text-text-primary">Termini</Link>
                        <Link to="/contact" className="hover:text-text-primary">Contatti</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
