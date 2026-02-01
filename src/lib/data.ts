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

// ... (Role and Contest types restored)
export interface Role {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
}

export interface Contest {
  id: string;
  slug: string;
  title: string;
  year: number | string;
  description: string;
  roleSlug: string;
  categorySlug: string;
}

// --- Fetchers ---

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
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

export const getRolesByCategory = async (
  categorySlug: string
): Promise<Role[]> => {
  // 1. Get Category ID
  const { data: cat, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (catError || !cat) {
    if (catError)
      console.error("Supabase getRolesByCategory (cat) error:", catError.message);
    return [];
  }

  // 2. Get Roles
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("category_id", cat.id)
    .order("title");

  if (error) {
    console.error("Supabase getRolesByCategory error:", error.message);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
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
      role:roles (
        slug,
        category:categories (slug)
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !quiz) {
    if (error) console.error("Supabase getContestBySlug error:", error.message);
    return null;
  }

  const anyQ = quiz as any;
  return {
    id: anyQ.id,
    slug: anyQ.slug,
    title: anyQ.title,
    year: anyQ.year || "",
    description: anyQ.description || "",
    roleSlug: anyQ.role?.slug || "",
    categorySlug: anyQ.role?.category?.slug || "",
  };
};

export const getContestsByRole = async (
  roleSlug: string
): Promise<Contest[]> => {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, category:categories(slug)")
    .eq("slug", roleSlug)
    .single();

  if (roleError || !role) {
    if (roleError)
      console.error("Supabase getContestsByRole (role) error:", roleError.message);
    return [];
  }

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("role_id", (role as any).id)
    .eq("is_archived", false)
    .order("year", { ascending: false });

  if (error) {
    console.error("Supabase getContestsByRole error:", error.message);
    return [];
  }

  const anyRole = role as any;

  return (data || []).map((q: any) => ({
    id: q.id,
    slug: q.slug || q.id,
    title: q.title,
    year: q.year,
    description: q.description,
    roleSlug: roleSlug,
    categorySlug: anyRole.category?.slug || "",
  }));
};

export interface SearchItem {
  id: string;
  title: string;
  type: 'category' | 'contest' | 'role';
  url: string;
}

export const getAllSearchableItems = async (): Promise<SearchItem[]> => {
  const items: SearchItem[] = [];

  // 1. Categories
  const { data: cats } = await supabase.from('categories').select('id, title, slug');
  if (cats) {
    cats.forEach((c: any) => items.push({
      id: c.id,
      title: c.title,
      type: 'category',
      url: `/concorsi/${c.slug}`
    }));
  }

  // 2. Roles (NEW - Fix for navigation mismatch)
  const { data: roles } = await supabase
    .from('roles')
    .select(`
      id, title, slug,
      category:categories(slug)
    `);

  if (roles) {
    roles.forEach((r: any) => {
      const catSlug = r.category?.slug;
      if (catSlug) {
        items.push({
          id: r.id,
          title: r.title,
          type: 'role',
          url: `/concorsi/${catSlug}/${r.slug}`
        });
      }
    });
  }

  // 3. Quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      id, title, slug,
      role:roles (
        slug,
        category:categories (slug)
      )
    `)
    .eq('is_archived', false)
    .limit(100);

  if (quizzes) {
    quizzes.forEach((q: any) => {
      const roleSlug = q.role?.slug;
      const catSlug = q.role?.category?.slug;
      if (roleSlug && catSlug) {
        items.push({
          id: q.id,
          title: q.title,
          type: 'contest',
          url: `/concorsi/${catSlug}/${roleSlug}` // Redirect to Role Hub (Tier S) instead of legacy Contest Page
        });
      }
    });
  }

  return items;
};
