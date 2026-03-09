import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// DIRECT IMPORTS — User-facing pages (instant navigation, zero delay)
// ============================================================================
import LoginPage from './app/login/page';
import WaitlistPage from './app/waitlist/page';
import RecoverPasswordPage from './app/recover-password/page';
import UpdatePasswordPage from './app/update-password/page';
import HomePage from './app/page';
import ProfilePage from './app/profile/page';
import ProfileSettingsPage from './app/profile/settings/page';
import ProfileSetupPage from './app/profile/setup/page';
import QuizStatsPage from './app/profile/stats/QuizStatsPage';
import ConcorsiSearchPage from './app/concorsi/search/page';
import ConcorsoHubPage from './app/concorsi/[category]/page';
import ContestPage from './app/concorsi/[category]/[contestSlug]/page';
import SimulationTypePage from './app/concorsi/[category]/[contestSlug]/simulazione/page';
import QuizRulesPage from './app/concorsi/[category]/[contestSlug]/simulazione/[type]/regole/page';
import CustomQuizWizardPage from './app/concorsi/[category]/[contestSlug]/custom/page';
import TemplateDetailPage from './app/concorsi/[category]/[contestSlug]/template/[templateId]/page';
import QuizRunnerPage from './app/quiz/run/[attemptId]/page';
import QuizResultsPage from './app/quiz/results/[attemptId]/page';
import ExplanationPage from './app/quiz/explanations/[attemptId]/[questionId]/page';
import OfficialQuizStarterPage from './app/quiz/official/[id]/page';
import PracticeStartPage from './app/quiz/practice/[quizId]/page';
import ReviewPage from './app/quiz/review/[quizId]/page';
import StatsPage from './app/stats/page';
import BlogIndexPage from './app/blog/page';
import BlogPostPage from './app/blog/[slug]/page';
import LeaderboardPage from './app/leaderboard/page';
import AiAssistantPage from './app/ai-assistant/page';
import PunteggiPage from './app/come-funziona/punteggi/page';
import PreparazionePage from './app/preparazione/page';
import BandiListPage from './app/bandi/BandiListPage';
import BandoDetailPage from './app/bandi/BandoDetailPage';
import BandiWatchlistPage from './app/bandi/BandiWatchlistPage';
import BandiAlertsPage from './app/bandi/alerts/page';
import FlamesDemoPage from './app/demo/flames/page';
import Flame3DPage from './app/demo/flame-3d/page';
import IconsDemoPage from './app/demo/icons/page';
import StreakTestPage from './app/demo/streak-test/page';
import ConquistePage from './app/conquiste/page';

// ============================================================================
// LAZY-LOADED PAGES (Admin only — rarely accessed)
// ============================================================================

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('./app/admin/dashboard/page'));
const AdminQuestionsPage = React.lazy(() => import('./app/admin/page'));
const AdminStructurePage = React.lazy(() => import('./app/admin/structure/page'));
const AdminCategoryEditPage = React.lazy(() => import('./app/admin/structure/categories/[id]/page'));
const AdminQuizListPage = React.lazy(() => import('./app/admin/quiz/QuizListPage'));
const AdminSubjectsListPage = React.lazy(() => import('./app/admin/quiz/SubjectsListPage'));
const AdminQuestionEditPage = React.lazy(() => import('./app/admin/questions/[id]/page'));
const AdminImagesPage = React.lazy(() => import('./app/admin/images/page'));
const AdminUploadCsvPage = React.lazy(() => import('./app/admin/upload-csv/page'));
const AdminRulesPage = React.lazy(() => import('./app/admin/rules/page'));
const AdminLeaderboardPage = React.lazy(() => import('./app/admin/leaderboard/page'));
const AdminUsersPage = React.lazy(() => import('./app/admin/users/page'));
const AdminUserDetailPage = React.lazy(() => import('./app/admin/users/[id]/page'));
const AdminReportsPage = React.lazy(() => import('./app/admin/reports/page'));
const AdminAnalyticsPage = React.lazy(() => import('./app/admin/analytics/page'));

// Blog Admin
const AdminBlogListPage = React.lazy(() => import('./app/admin/blog/page'));
const AdminBlogEditorPage = React.lazy(() => import('./app/admin/blog/editor/page'));
const AdminBlogCategoriesPage = React.lazy(() => import('./app/admin/blog/categories/page'));
const AdminBlogTagsPage = React.lazy(() => import('./app/admin/blog/tags/page'));

// Bandi Admin
const AdminBandiListPage = React.lazy(() => import('./app/admin/bandi/page'));
const AdminBandoEditorPage = React.lazy(() => import('./app/admin/bandi/[id]/page'));
const AdminBandiImportPage = React.lazy(() => import('./app/admin/bandi/import/page'));
const AdminBandiCategoriesPage = React.lazy(() => import('./app/admin/bandi/categorie/page'));
const AdminEntiListPage = React.lazy(() => import('./app/admin/enti/page'));

// ============================================================================
// STATIC IMPORTS (Required at startup, cannot be lazy)
// ============================================================================
import AdminGuard from './components/auth/AdminGuard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import { OnboardingProvider } from './context/OnboardingProvider';
import { SpotlightProvider } from './context/SpotlightContext';
import MainLayout from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initializeNativeApp } from './lib/nativeConfig';
import OnboardingSpotlight from './components/onboarding/OnboardingSpotlight';
import SpotlightModal from './components/spotlight/SpotlightModal';
import { StreakCelebration } from './components/gamification/StreakCelebration';
import { BadgeUnlockCelebration } from './components/gamification/BadgeUnlockCelebration';
// REMOVED: streakService import — streak is now 100% server-side (handle_new_attempt_xp trigger)
import { CinematicGrain } from './components/ui/CinematicGrain';
import { removeBootLoader } from './lib/domUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LazyMotion, domAnimation } from 'framer-motion';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

// V7-RET-1: Daily check-in — streak updates on app engagement, not just quiz completion.
// The RPC is SECURITY DEFINER and a no-op if already checked in today (zero overhead).
// Fire-and-forget: no await, no UI blocking.
function fireDailyCheckin() {
    supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
            supabase.rpc('daily_checkin').then(({ data: result }) => {
                if (result?.updated && result?.streak > 1) {
                    window.dispatchEvent(new CustomEvent('streak_updated', {
                        detail: { streak: result.streak, isMilestone: result.streak % 7 === 0 }
                    }));
                }
            });
        }
    });
}

// Loading fallback for lazy-loaded components
const AdminLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--foreground)] opacity-60">Caricamento...</p>
        </div>
    </div>
);

export default function App() {
    // Initialize native app features on mount
    useEffect(() => {
        initializeNativeApp();
        removeBootLoader();
        fireDailyCheckin(); // V7-RET-1: streak on engagement
    }, []);

    // Prefetch core page chunks in the background for instant navigation
    useEffect(() => {
        const prefetchCore = setTimeout(() => {
            // Prefetch the most visited pages immediately
            import('./app/page');
            import('./app/profile/page');
            import('./app/concorsi/[category]/page');
            import('./app/concorsi/[category]/[contestSlug]/page');
            import('./app/concorsi/[category]/[contestSlug]/custom/page');
            import('./app/leaderboard/page');
            import('./app/ai-assistant/page');
            import('./app/bandi/BandiListPage');
        }, 2000); // Start prefetching 2s after mount (after initial render settles)

        const prefetchSecondary = setTimeout(() => {
            // Prefetch secondary pages after 5s
            import('./app/quiz/run/[attemptId]/page');
            import('./app/quiz/results/[attemptId]/page');
            import('./app/quiz/official/[id]/page');
            import('./app/concorsi/search/page');
            import('./app/profile/settings/page');
            import('./app/blog/page');
        }, 5000);

        return () => {
            clearTimeout(prefetchCore);
            clearTimeout(prefetchSecondary);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ErrorBoundary>
                    <ThemeProvider>
                        <AuthProvider>
                            <SidebarProvider>
                                <OnboardingProvider>
                                    <SpotlightProvider>
                                        <LazyMotion features={domAnimation}>
                                            {/* REMOVED: <AppEffects /> — V3 CRIT-1 */}
                                            <CinematicGrain />
                                            <OnboardingSpotlight />
                                            <SpotlightModal />
                                            <StreakCelebration />
                                            <BadgeUnlockCelebration />
                                            <Suspense fallback={null}>
                                                <Routes>
                                                    <Route path="/login" element={<LoginPage />} />
                                                    <Route path="/recover-password" element={<RecoverPasswordPage />} />
                                                    <Route path="/update-password" element={<UpdatePasswordPage />} />
                                                    <Route path="/waitlist" element={<WaitlistPage />} />

                                                    {/* Main App Layout */}
                                                    <Route path="/" element={
                                                        <MainLayout>
                                                            <HomePage />
                                                        </MainLayout>
                                                    } />

                                                    <Route path="/profile" element={
                                                        <MainLayout>
                                                            <ProfilePage />
                                                        </MainLayout>
                                                    } />
                                                    <Route path="/profile/setup" element={<ProfileSetupPage />} />
                                                    <Route path="/profile/settings" element={
                                                        <MainLayout>
                                                            <ProfileSettingsPage />
                                                        </MainLayout>
                                                    } />
                                                    <Route path="/profile/stats/:quizId" element={
                                                        <MainLayout>
                                                            <QuizStatsPage />
                                                        </MainLayout>
                                                    } />

                                                    {/* Conquiste (Badge achievements page) */}
                                                    <Route path="/conquiste" element={<MainLayout><ConquistePage /></MainLayout>} />

                                                    {/* Concorsi Flow (Wrapped) */}
                                                    <Route path="/concorsi/search" element={<MainLayout><ConcorsiSearchPage /></MainLayout>} />
                                                    <Route path="/concorsi/:category" element={<MainLayout><ConcorsoHubPage /></MainLayout>} />
                                                    <Route path="/concorsi/:category/:contestSlug" element={<MainLayout><ContestPage /></MainLayout>} />
                                                    <Route path="/concorsi/:category/:contestSlug/simulazione" element={<MainLayout><SimulationTypePage /></MainLayout>} />
                                                    <Route path="/concorsi/:category/:contestSlug/simulazione/:type/regole" element={<MainLayout><QuizRulesPage /></MainLayout>} />
                                                    <Route path="/concorsi/:category/:contestSlug/custom" element={<CustomQuizWizardPage />} />
                                                    <Route path="/concorsi/:category/:contestSlug/template/:templateId" element={<TemplateDetailPage />} />

                                                    {/* Quiz Engine (Wrapped) */}
                                                    <Route path="/quiz/:id/official" element={<OfficialQuizStarterPage />} />
                                                    <Route path="/quiz/:quizId/practice" element={<MainLayout><PracticeStartPage /></MainLayout>} />
                                                    <Route path="/quiz/:quizId/review" element={<MainLayout><ReviewPage /></MainLayout>} />
                                                    <Route path="/quiz/run/:attemptId" element={<QuizRunnerPage />} />
                                                    <Route path="/quiz/results/:attemptId" element={<MainLayout><QuizResultsPage /></MainLayout>} />
                                                    <Route path="/quiz/explanations/:attemptId/:questionId" element={<MainLayout><ExplanationPage /></MainLayout>} />
                                                    {/* <Route path="/stats" element={<MainLayout><StatsPage /></MainLayout>} /> */}

                                                    {/* Bandi (Public Tenders) */}
                                                    <Route path="/bandi" element={<MainLayout><BandiListPage /></MainLayout>} />
                                                    <Route path="/bandi/watchlist" element={<MainLayout><BandiWatchlistPage /></MainLayout>} />
                                                    <Route path="/bandi/alerts" element={<MainLayout><BandiAlertsPage /></MainLayout>} />
                                                    <Route path="/bandi/:slug" element={<MainLayout><BandoDetailPage /></MainLayout>} />

                                                    {/* Blog (User-facing) (Wrapped) */}
                                                    <Route path="/blog" element={<MainLayout><BlogIndexPage /></MainLayout>} />
                                                    <Route path="/blog/:slug" element={<MainLayout><BlogPostPage /></MainLayout>} />
                                                    <Route path="/leaderboard" element={<MainLayout><LeaderboardPage /></MainLayout>} />
                                                    <Route path="/ai-assistant" element={<MainLayout><AiAssistantPage /></MainLayout>} />

                                                    {/* Informational Pages */}
                                                    <Route path="/come-funziona/punteggi" element={<MainLayout><PunteggiPage /></MainLayout>} />
                                                    <Route path="/preparazione" element={<PreparazionePage />} />

                                                    {/* Demo Pages */}
                                                    <Route path="/demo/flames" element={<FlamesDemoPage />} />
                                                    <Route path="/demo/flame-3d" element={<Flame3DPage />} />
                                                    <Route path="/demo/icons" element={<IconsDemoPage />} />
                                                    <Route path="/demo/streak-test" element={<StreakTestPage />} />

                                                    {/* Skitla Landing Page */}

                                                    {/* Admin - Protected with AdminGuard + Lazy loaded */}
                                                    <Route element={
                                                        <AdminGuard>
                                                            <Suspense fallback={<AdminLoading />}>
                                                                <Outlet />
                                                            </Suspense>
                                                        </AdminGuard>
                                                    }>
                                                        <Route path="/admin" element={<AdminDashboardPage />} />
                                                        <Route path="/admin/questions" element={<AdminQuestionsPage />} />
                                                        <Route path="/admin/structure" element={<AdminStructurePage />} />
                                                        <Route path="/admin/structure/categories/:id" element={<AdminCategoryEditPage />} />
                                                        <Route path="/admin/quiz" element={<AdminQuizListPage />} />
                                                        <Route path="/admin/quiz/materie" element={<AdminSubjectsListPage />} />
                                                        <Route path="/admin/questions/:id" element={<AdminQuestionEditPage />} />
                                                        <Route path="/admin/images" element={<AdminImagesPage />} />
                                                        <Route path="/admin/upload-csv" element={<AdminUploadCsvPage />} />
                                                        <Route path="/admin/rules" element={<AdminRulesPage />} />
                                                        <Route path="/admin/stats" element={<StatsPage />} />
                                                        <Route path="/admin/leaderboard" element={<AdminLeaderboardPage />} />
                                                        <Route path="/admin/users" element={<AdminUsersPage />} />
                                                        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                                                        <Route path="/admin/reports" element={<AdminReportsPage />} />
                                                        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />

                                                        {/* Admin Blog */}
                                                        <Route path="/admin/blog" element={<AdminBlogListPage />} />
                                                        <Route path="/admin/blog/categorie" element={<AdminBlogCategoriesPage />} />
                                                        <Route path="/admin/blog/tag" element={<AdminBlogTagsPage />} />
                                                        <Route path="/admin/blog/nuovo" element={<AdminBlogEditorPage />} />
                                                        <Route path="/admin/blog/:id" element={<AdminBlogEditorPage />} />

                                                        {/* Admin Bandi */}
                                                        <Route path="/admin/bandi" element={<AdminBandiListPage />} />
                                                        <Route path="/admin/bandi/nuovo" element={<AdminBandoEditorPage />} />
                                                        <Route path="/admin/bandi/import" element={<AdminBandiImportPage />} />
                                                        <Route path="/admin/bandi/categorie" element={<AdminBandiCategoriesPage />} />
                                                        <Route path="/admin/bandi/:id" element={<AdminBandoEditorPage />} />

                                                        {/* Admin Enti */}
                                                        <Route path="/admin/enti" element={<AdminEntiListPage />} />
                                                    </Route>
                                                </Routes>
                                            </Suspense>
                                        </LazyMotion>
                                    </SpotlightProvider>
                                </OnboardingProvider>
                            </SidebarProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
