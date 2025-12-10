import { supabase } from "./supabaseClient";

// --- Types ---
export interface Category {
  id: string;
  slug: string;
  title: string;
  description: string;
  home_banner_url?: string;
  inner_banner_url?: string;
  is_new?: boolean;
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
    description: c.description || "",
    home_banner_url: c.home_banner_url || undefined,
    inner_banner_url: c.inner_banner_url || undefined,
    is_new: c.is_new || false,
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
