import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types/blog';

interface BlogCarouselProps {
    posts: BlogPost[];
}

// Configuration handles responsive visual tuning
const GAP_MOBILE = 12; // Slightly wider for better separation of massive cards
const GAP_DESKTOP = 24;

export default function BlogCarousel({ posts }: BlogCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Aggressive preloading of first few images to avoid transition lag
    useEffect(() => {
        const preloadLimit = Math.min(posts.length, 5);
        for (let i = 0; i < preloadLimit; i++) {
            if (posts[i].cover_image_url) {
                const img = new Image();
                img.src = posts[i].cover_image_url!;
            }
        }
    }, [posts]);

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

    // Scroll progress with Spring smoothing
    const { scrollX } = useScroll({ container: containerRef });

    // Physics tuned for "Tier S" smoothness
    const scrollXSpring = useSpring(scrollX, {
        stiffness: 100,
        damping: 30,
        mass: 1,
        restDelta: 0.001
    });

    const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP;

    // sidePadding is the margin between viewport edge and card edge when centered.
    // Peek = sidePadding - gap.
    // To get a very prominent peek (~58px): sidePadding = 70px.
    const sidePadding = isMobile ? 70 : 160;

    const cardWidth = useMemo(() => {
        const maxWidth = containerWidth - (sidePadding * 2);
        return Math.min(1200, Math.max(240, maxWidth));
    }, [containerWidth, isMobile, sidePadding]);

    // Symmetrical padding for perfect centering
    const centerPadding = Math.max(0, (containerWidth - cardWidth) / 2);

    return (
        <div className="relative w-full group/carousel">
            <div
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 relative z-10"
                style={{
                    scrollBehavior: 'smooth',
                    gap: `${gap}px`,
                    paddingLeft: `${centerPadding}px`,
                    paddingRight: `${centerPadding}px`,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {posts.map((post, index) => (
                    <CarouselItem
                        key={post.id}
                        post={post}
                        index={index}
                        scrollX={scrollXSpring}
                        cardWidth={cardWidth}
                        gap={gap}
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
    scrollX: MotionValue<number>;
    cardWidth: number;
    gap: number;
    priority: boolean;
}

function CarouselItem({ post, index, scrollX, cardWidth, gap, priority }: CarouselItemProps) {
    // Exact center position for this item in the scroll view
    const itemPosition = (cardWidth + gap) * index;
    const distance = cardWidth + gap;

    // "Tier S" Ultra-Dominant Scaling (match reference)
    // We boost the scale to 1.25x to make the centered card fill much of the viewport 
    // while maintaining the large layout "peek" signal.
    const scale = useTransform(
        scrollX,
        [
            itemPosition - distance,
            itemPosition,
            itemPosition + distance
        ],
        [0.8, 1.25, 0.8]
    );

    const opacity = useTransform(
        scrollX,
        [
            itemPosition - distance,
            itemPosition,
            itemPosition + distance
        ],
        [0.3, 1, 0.3]
    );

    return (
        <motion.div
            className="snap-center shrink-0 relative flex flex-col items-center justify-center p-4"
            style={{
                width: `${cardWidth}px`,
                scale,
                opacity,
                zIndex: 1,
                willChange: 'transform, opacity',
            }}
        >
            <Link
                to={`/blog/${post.slug}`}
                className="block w-full relative overflow-hidden rounded-[40px] md:rounded-[48px] shadow-xl transition-all duration-700 ease-out hover:shadow-[0_20px_60px_-15px_rgba(0,177,255,0.4)] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 group"
                style={{
                    aspectRatio: '16 / 9',
                    perspective: '1200px',
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
                            className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent opacity-60" />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col items-start gap-2 md:gap-4">
                    {post.category?.name && (
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl text-white text-[8px] md:text-xs font-bold uppercase tracking-widest mb-1 border border-white/20">
                            {post.category.name}
                        </span>
                    )}

                    <h3 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white line-clamp-2 leading-tight tracking-tight drop-shadow-2xl">
                        {post.title}
                    </h3>

                    <p className="hidden md:block text-xs md:text-base text-slate-200/90 line-clamp-2 max-w-2xl mt-1 font-medium">
                        {post.subtitle}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
