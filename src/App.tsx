import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// ============================================================================
// LAZY-LOADED PAGES (Code Splitting for Smaller Initial Bundle)
// ============================================================================

// Auth & Onboarding
const LoginPage = React.lazy(() => import('./app/login/page'));
const WaitlistPage = React.lazy(() => import('./app/waitlist/page'));
const WaitlistSuccessPage = React.lazy(() => import('./app/waitlist/success/page'));

// Home & Profile
const HomePage = React.lazy(() => import('./app/page'));
const ProfilePage = React.lazy(() => import('./app/profile/page'));
const ProfileSettingsPage = React.lazy(() => import('./app/profile/settings/page'));
const ProfileSetupPage = React.lazy(() => import('./app/profile/setup/page'));
const QuizStatsPage = React.lazy(() => import('./app/profile/stats/QuizStatsPage'));

// Concorsi Flow
const ConcorsiSearchPage = React.lazy(() => import('./app/concorsi/search/page'));
const ConcorsoHubPage = React.lazy(() => import('./app/concorsi/[category]/page'));
const RolePage = React.lazy(() => import('./app/concorsi/[category]/[role]/page'));
const ContestPage = React.lazy(() => import('./app/concorsi/[category]/[role]/[contestSlug]/page'));
const SimulationTypePage = React.lazy(() => import('./app/concorsi/[category]/[role]/[contestSlug]/simulazione/page'));
const QuizRulesPage = React.lazy(() => import('./app/concorsi/[category]/[role]/[contestSlug]/simulazione/[type]/regole/page'));
const CustomQuizWizardPage = React.lazy(() => import('./app/concorsi/[category]/[role]/[contestSlug]/custom/page'));

// Quiz Engine
const QuizRunnerPage = React.lazy(() => import('./app/quiz/run/[attemptId]/page'));
const QuizResultsPage = React.lazy(() => import('./app/quiz/results/[attemptId]/page'));
const ExplanationPage = React.lazy(() => import('./app/quiz/explanations/[attemptId]/[questionId]/page'));
const OfficialQuizStarterPage = React.lazy(() => import('./app/quiz/official/[id]/page'));
const PracticeStartPage = React.lazy(() => import('./app/quiz/practice/[quizId]/page'));
const ReviewPage = React.lazy(() => import('./app/quiz/review/[quizId]/page'));
const StatsPage = React.lazy(() => import('./app/stats/page'));

// Blog (User-facing)
const BlogIndexPage = React.lazy(() => import('./app/blog/page'));
const BlogPostPage = React.lazy(() => import('./app/blog/[slug]/page'));
const LeaderboardPage = React.lazy(() => import('./app/leaderboard/page'));

// Informational Pages
const PunteggiPage = React.lazy(() => import('./app/come-funziona/punteggi/page'));
const PreparazionePage = React.lazy(() => import('./app/preparazione/page'));

// Bandi Pages
const BandiListPage = React.lazy(() => import('./app/bandi/BandiListPage'));
const BandoDetailPage = React.lazy(() => import('./app/bandi/BandoDetailPage'));
const BandiWatchlistPage = React.lazy(() => import('./app/bandi/BandiWatchlistPage'));
const BandiAlertsPage = React.lazy(() => import('./app/bandi/alerts/page'));

// Demo Pages
const FlamesDemoPage = React.lazy(() => import('./app/demo/flames/page'));

// Admin Pages
const AdminDashboardPage = React.lazy(() => import('./app/admin/dashboard/page'));
const AdminQuestionsPage = React.lazy(() => import('./app/admin/page'));
const AdminStructurePage = React.lazy(() => import('./app/admin/structure/page'));
const AdminCategoryEditPage = React.lazy(() => import('./app/admin/structure/categories/[id]/page'));
const AdminRoleEditPage = React.lazy(() => import('./app/admin/structure/roles/[id]/page'));
const AdminQuizListPage = React.lazy(() => import('./app/admin/quiz/QuizListPage'));
const AdminSubjectsListPage = React.lazy(() => import('./app/admin/quiz/SubjectsListPage'));
const AdminQuestionEditPage = React.lazy(() => import('./app/admin/questions/[id]/page'));
const AdminImagesPage = React.lazy(() => import('./app/admin/images/page'));
const AdminUploadCsvPage = React.lazy(() => import('./app/admin/upload-csv/page'));
const AdminRulesPage = React.lazy(() => import('./app/admin/rules/page'));
const AdminLeaderboardPage = React.lazy(() => import('./app/admin/leaderboard/page'));
const AdminUsersPage = React.lazy(() => import('./app/admin/users/page'));
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
import WaitlistGuard from './components/auth/WaitlistGuard';
import AdminGuard from './components/auth/AdminGuard';
import { AuthProvider } from './context/AuthContext';
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
import { useAuth } from './context/AuthContext';
import { streakService } from './lib/streakService';

// Loading fallback for lazy-loaded components
const AdminLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--foreground)] opacity-60">Caricamento...</p>
        </div>
    </div>
);


// Component to handle side effects that require AuthContext
function AppEffects() {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            streakService.checkAndUpdateStreak(user.id);
        }
    }, [user]);

    return null;
}

export default function App() {
    // Initialize native app features on mount
    useEffect(() => {
        initializeNativeApp();
    }, []);

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <ThemeProvider>
                    <AuthProvider>
                        <SidebarProvider>
                            <OnboardingProvider>
                                <SpotlightProvider>
                                    <WaitlistGuard>
                                        <AppEffects />
                                        <OnboardingSpotlight />
                                        <SpotlightModal />
                                        <StreakCelebration />
                                        <Suspense fallback={<AdminLoading />}>
                                            <Routes>
                                                <Route path="/login" element={<LoginPage />} />
                                                <Route path="/waitlist" element={<WaitlistPage />} />
                                                <Route path="/waitlist/success" element={<WaitlistSuccessPage />} />

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

                                                {/* Concorsi Flow (Wrapped) */}
                                                <Route path="/concorsi/search" element={<MainLayout><ConcorsiSearchPage /></MainLayout>} />
                                                <Route path="/concorsi/:category" element={<MainLayout><ConcorsoHubPage /></MainLayout>} />
                                                <Route path="/concorsi/:category/:role" element={<MainLayout><RolePage /></MainLayout>} />
                                                <Route path="/concorsi/:category/:role/:contestSlug" element={<MainLayout><ContestPage /></MainLayout>} />
                                                <Route path="/concorsi/:category/:role/:contestSlug/simulazione" element={<MainLayout><SimulationTypePage /></MainLayout>} />
                                                <Route path="/concorsi/:category/:role/:contestSlug/simulazione/:type/regole" element={<MainLayout><QuizRulesPage /></MainLayout>} />
                                                <Route path="/concorsi/:category/:role/:contestSlug/custom" element={<CustomQuizWizardPage />} />

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

                                                {/* Informational Pages */}
                                                <Route path="/come-funziona/punteggi" element={<MainLayout><PunteggiPage /></MainLayout>} />
                                                <Route path="/preparazione" element={<PreparazionePage />} />

                                                {/* Demo Pages */}
                                                <Route path="/demo/flames" element={<FlamesDemoPage />} />

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
                                                    <Route path="/admin/structure/roles/:id" element={<AdminRoleEditPage />} />
                                                    <Route path="/admin/quiz" element={<AdminQuizListPage />} />
                                                    <Route path="/admin/quiz/materie" element={<AdminSubjectsListPage />} />
                                                    <Route path="/admin/questions/:id" element={<AdminQuestionEditPage />} />
                                                    <Route path="/admin/images" element={<AdminImagesPage />} />
                                                    <Route path="/admin/upload-csv" element={<AdminUploadCsvPage />} />
                                                    <Route path="/admin/rules" element={<AdminRulesPage />} />
                                                    <Route path="/admin/stats" element={<StatsPage />} />
                                                    <Route path="/admin/leaderboard" element={<AdminLeaderboardPage />} />
                                                    <Route path="/admin/users" element={<AdminUsersPage />} />
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
                                    </WaitlistGuard>
                                </SpotlightProvider>
                            </OnboardingProvider>
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

