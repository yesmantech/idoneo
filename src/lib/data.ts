/**
 * @file data.ts
 * @description Core data fetching utilities for categories, roles, and quizzes.
 *
 * This module provides typed fetcher functions for the Supabase database.
 * It serves as the data access layer between components and the database.
 *
 * ## Entity Hierarchy
 *
 * ```
 * Category (e.g., "Polizia di Stato")
 *    └── Role (e.g., "Allievo Agente")
 *          └── Quiz/Contest (e.g., "2024 Official")
 * ```
 *
 * ## Fetchers
 *
 * | Function               | Returns           | Description                    |
 * |------------------------|-------------------|--------------------------------|
 * | `getCategories()`      | `Category[]`      | All categories, sorted by title|
 * | `getCategoryBySlug()`  | `Category | null` | Single category by slug        |
 * | `getRolesByCategory()` | `Role[]`          | Roles in a category            |
 * | `getContestBySlug()`   | `Contest | null`  | Single quiz/contest by slug    |
 * | `getContestsByRole()`  | `Contest[]`       | All quizzes for a role         |
 * | `getAllSearchableItems()`| `SearchItem[]`  | All items for spotlight search |
 *
 * ## Search Integration
 *
 * `getAllSearchableItems()` returns a flat array of all Categories, Roles,
 * and Quizzes with their URLs for spotlight search indexing.
 *
 * @example
 * ```typescript
 * import { getCategories, getRolesByCategory } from '@/lib/data';
 *
 * const categories = await getCategories();
 * const roles = await getRolesByCategory('polizia-di-stato');
 * ```
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// --- Types ---
export interface Category {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  home_banner_url?: string;
  inner_banner_url?: string;
  is_new?: boolean;
  year?: number | string;
  available_seats?: number;
}

export interface Contest {
  id: string;
  slug: string;
  title: string;
  year: number | string;
  description: string;
  categorySlug: string;
}

// --- Fetchers ---

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_archived", false)
    .order("title");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle || undefined,
    description: c.description || "",
    home_banner_url: c.home_banner_url || undefined,
    inner_banner_url: c.inner_banner_url || undefined,
    is_new: c.is_new || false,
    year: c.year || undefined,
    available_seats: c.available_seats || undefined,
  }));
};

export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_archived", false)
    .single();

  if (error || !data) {
    if (error) console.error("Supabase getCategoryBySlug error:", error.message);
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description || "",
    home_banner_url: data.home_banner_url || undefined,
    inner_banner_url: data.inner_banner_url || undefined,
  };
};

export const getQuizzesByCategory = async (
  categorySlug: string
): Promise<Contest[]> => {
  // 1. Get Category ID
  const { data: cat, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (catError || !cat) {
    if (catError)
      console.error("Supabase getQuizzesByCategory (cat) error:", catError.message);
    return [];
  }

  // 2. Get Quizzes (excluding archived)
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("category_id", cat.id)
    .eq("is_archived", false)
    .order("title");

  if (error) {
    console.error("Supabase getQuizzesByCategory error:", error.message);
    return [];
  }

  return (data || []).map((q: any) => ({
    id: q.id,
    slug: q.slug || q.id,
    title: q.title,
    year: q.year,
    description: q.description || "",
    categorySlug: categorySlug,
  }));
};

export const getContestBySlug = async (
  slug: string
): Promise<Contest | null> => {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      category:categories (slug)
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !quiz) {
    if (error) console.error("Supabase getContestBySlug error:", error.message);
    return null;
  }

  return {
    id: quiz.id,
    slug: quiz.slug || quiz.id,
    title: quiz.title,
    year: quiz.year || "",
    description: quiz.description || "",
    categorySlug: (quiz as any).category?.slug || "",
  };
};

// [REMOVED] getContestsByRole as roles no longer exist.
// Replaced by getQuizzesByCategory above.

export interface SearchItem {
  id: string;
  title: string;
  type: 'category' | 'contest';
  url: string;
}

export const getAllSearchableItems = async (): Promise<SearchItem[]> => {
  const items: SearchItem[] = [];

  // 1. Categories (excluding archived)
  const { data: cats } = await supabase.from('categories').select('id, title, slug').eq('is_archived', false);
  if (cats) {
    cats.forEach((c: any) => items.push({
      id: c.id,
      title: c.title,
      type: 'category',
      url: `/concorsi/${c.slug}`
    }));
  }

  // 2. Quizzes (excluding archived)
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      id, title, slug,
      category:categories (slug)
    `)
    .eq('is_archived', false)
    .limit(100);

  if (quizzes) {
    quizzes.forEach((q: any) => {
      const catSlug = (q as any).category?.slug;
      if (catSlug) {
        items.push({
          id: q.id,
          title: q.title,
          type: 'contest',
          url: `/concorsi/${catSlug}/${q.slug}`
        });
      }
    });
  }

  return items;
};
