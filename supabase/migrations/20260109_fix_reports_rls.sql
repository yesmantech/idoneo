-- Fix question_reports RLS for admin access
-- The current admin policy might not work correctly due to nested RLS checks

-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can view and update all reports" ON public.question_reports;

-- Create a simpler SELECT policy for admins (using a function to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Allow admins to SELECT all reports
CREATE POLICY "Admins can view all reports"
    ON public.question_reports FOR SELECT
    USING (public.is_admin());

-- Allow admins to UPDATE all reports
CREATE POLICY "Admins can update all reports"
    ON public.question_reports FOR UPDATE
    USING (public.is_admin());

-- Allow admins to DELETE reports
CREATE POLICY "Admins can delete reports"
    ON public.question_reports FOR DELETE
    USING (public.is_admin());
