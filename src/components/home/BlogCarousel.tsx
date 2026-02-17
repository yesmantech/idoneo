import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';

interface BlogCarouselProps {
    posts: BlogPost[];
}

// Configuration handles responsive visual tuning
const GAP_MOBILE = 12;
const GAP_DESKTOP = 24;

export default function BlogCarousel({ posts }: BlogCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Update container width on mount/resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
                setIsMobile(window.innerWidth < 768);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP;

    // "Native Giant" Strategy:
    // We start from the left with a branding-defined margin (24px).
    // Peek is visible on the right (~28px).
    const leftMargin = isMobile ? 24 : 160;
    const rightPeek = isMobile ? 28 : 160;

    const cardWidth = useMemo(() => {
        if (isMobile) {
            // "Native Giant" Logic:
            // Calculate the exact width needed to fit the viewport with margin, gap, and peek.
            // Width = Viewport - LeftPadding - Gap - RightPeek
            return containerWidth - leftMargin - gap - rightPeek;
        }

        const maxWidth = containerWidth - leftMargin - rightPeek;
        return Math.min(1200, Math.max(240, maxWidth));
    }, [containerWidth, isMobile, leftMargin, rightPeek, gap]);

    return (
        <div className="relative w-full group/carousel">
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 relative z-10"
                style={{
                    scrollBehavior: 'smooth',
                    gap: `${gap}px`,
                    paddingLeft: `${leftMargin}px`,
                    paddingRight: `${leftMargin}px`,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {posts.map((post, index) => (
                    <CarouselItem
                        key={post.id}
                        post={post}
                        index={index}
                        cardWidth={cardWidth}
                        priority={index < 4}
                    />
                ))}
            </div>
        </div>
    );
}

// ================== INDIVIDUAL CARD ITEM ==================

interface CarouselItemProps {
    post: BlogPost;
    index: number;
    cardWidth: number;
    priority: boolean;
}

function CarouselItem({ post, cardWidth, priority }: CarouselItemProps) {
    return (
        <div
            className="snap-start shrink-0 relative flex flex-col items-center justify-center p-0 transition-all"
            style={{
                width: `${cardWidth}px`,
                // No scaling, no dynamic margins. Pure native layout.
            }}
        >
            <Link
                to={`/blog/${post.slug}`}
                className="block w-full relative overflow-hidden rounded-[28px] md:rounded-[32px] shadow-lg transition-transform duration-500 ease-out active:scale-[0.98] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 group"
                style={{
                    aspectRatio: '16 / 9',
                }}
            >
                {/* Image */}
                <div className="absolute inset-0 w-full h-full">
                    {post.cover_image_url ? (
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            loading={priority ? "eager" : "lazy"}
                            decoding="async"
                            // @ts-ignore
                            fetchpriority={priority ? "high" : "auto"}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col items-start gap-1 md:gap-3">
                    {post.category?.name && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 border border-white/20">
                            {post.category.name}
                        </span>
                    )}

                    <h3 className="text-xl md:text-3xl font-bold text-white line-clamp-2 leading-tight drop-shadow-lg">
                        {post.title}
                    </h3>

                    <p className="hidden md:block text-sm text-slate-200/90 line-clamp-2 mt-1">
                        {post.subtitle}
                    </p>
                </div>
            </Link>
        </div>
    );
}
