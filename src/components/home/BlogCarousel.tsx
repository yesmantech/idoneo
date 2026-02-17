import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';

interface BlogCarouselProps {
    posts: BlogPost[];
}

export default function BlogCarousel({ posts }: BlogCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Update dimensions on mount and resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                // We measure the scroll container's width.
                // This includes the padding if we use box-sizing border-box.
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    // We use the same constants as RecentlyUsedSection for perfect sync
    const gap = isMobile ? 16 : 24;
    const padding = isMobile ? 16 : 32; // Matches px-4 and px-8
    const rightPeek = isMobile ? 28 : (containerWidth > 1440 ? 400 : 200);

    const cardWidth = useMemo(() => {
        if (containerWidth === 0) return 300;

        // Width Calculation:
        // Card must fill the viewport less the left padding, the gap to the next card, and the peek.
        // Formula: CardWidth = TotalWidth - PaddingLeft - Gap - Peek
        return containerWidth - padding - gap - rightPeek;
    }, [containerWidth, padding, gap, rightPeek]);

    return (
        <div className="w-full max-w-7xl lg:mx-auto overflow-hidden">
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-pl-4 lg:scroll-pl-8 scrollbar-hide pb-8 pt-2 relative z-10 pl-4 lg:pl-8"
                style={{
                    scrollBehavior: 'smooth',
                    gap: `${gap}px`,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {posts.map((post, index) => (
                    <CarouselItem
                        key={post.id}
                        post={post}
                        cardWidth={cardWidth}
                        priority={index < 4}
                    />
                ))}

                {/* Right spacer to allow scrolling padding at the end */}
                <div className="min-w-[16px] lg:min-w-[32px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

// ================== INDIVIDUAL CARD ITEM ==================

interface CarouselItemProps {
    post: BlogPost;
    cardWidth: number;
    priority: boolean;
}

function CarouselItem({ post, cardWidth, priority }: CarouselItemProps) {
    return (
        <div
            className="snap-start shrink-0 relative flex flex-col items-center justify-center p-0"
            style={{ width: `${cardWidth}px` }}
        >
            <Link
                to={`/blog/${post.slug}`}
                className="block w-full relative overflow-hidden rounded-[28px] md:rounded-[32px] 
                           shadow-lg transition-transform duration-500 ease-out 
                           active:scale-[0.98] bg-white dark:bg-slate-800 
                           border border-slate-100 dark:border-slate-700/50 group"
                style={{ aspectRatio: '16 / 9' }}
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
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start gap-1 md:gap-3">
                    {post.category?.name && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900/40 backdrop-blur-md text-white text-[10px] md:text-xs font-black uppercase tracking-wider mb-1 border border-white/20">
                            {post.category.name}
                        </span>
                    )}

                    <h3 className="text-xl md:text-3xl font-extrabold text-white line-clamp-2 leading-tight drop-shadow-lg">
                        {post.title}
                    </h3>

                    <p className="hidden md:block text-slate-200/90 text-sm font-medium line-clamp-2 mt-1">
                        {post.subtitle}
                    </p>
                </div>
            </Link>
        </div>
    );
}
