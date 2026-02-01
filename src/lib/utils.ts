/**
 * @file utils.ts
 * @description Shared utility functions used across the application.
 *
 * ## cn() - Class Name Merger
 *
 * The `cn` function combines `clsx` and `tailwind-merge` to intelligently
 * merge Tailwind CSS class names. This is essential for component composition
 * where base styles can be overridden by props.
 *
 * @example
 * ```typescript
 * import { cn } from '@/lib/utils';
 *
 * // Merges classes, resolving Tailwind conflicts
 * cn('px-2 py-1', 'px-4')  // → 'py-1 px-4'
 *
 * // Handles conditional classes
 * cn('base-class', isActive && 'active-class', className)
 * ```
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// CLASS UTILITIES
// ============================================================================

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
