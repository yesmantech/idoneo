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

// Blog Admin
const AdminBlogListPage = React.lazy(() => import('./app/admin/blog/page'));
const AdminBlogEditorPage = React.lazy(() => import('./app/admin/blog/editor/page'));
const AdminBlogCategoriesPage = React.lazy(() => import('./app/admin/blog/categories/page'));
const AdminBlogTagsPage = React.lazy(() => import('./app/admin/blog/tags/page'));

// ============================================================================
// STATIC IMPORTS (Required at startup, cannot be lazy)
// ============================================================================
import WaitlistGuard from './components/auth/WaitlistGuard';
import AdminGuard from './components/auth/AdminGuard';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initializeNativeApp } from './lib/nativeConfig';

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
    }, []);

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <ThemeProvider>
                    <AuthProvider>
                        <SidebarProvider>
                            <WaitlistGuard>
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

                                        {/* Blog (User-facing) (Wrapped) */}
                                        <Route path="/blog" element={<MainLayout><BlogIndexPage /></MainLayout>} />
                                        <Route path="/blog/:slug" element={<MainLayout><BlogPostPage /></MainLayout>} />
                                        <Route path="/leaderboard" element={<MainLayout><LeaderboardPage /></MainLayout>} />

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

                                            {/* Admin Blog */}
                                            <Route path="/admin/blog" element={<AdminBlogListPage />} />
                                            <Route path="/admin/blog/categorie" element={<AdminBlogCategoriesPage />} />
                                            <Route path="/admin/blog/tag" element={<AdminBlogTagsPage />} />
                                            <Route path="/admin/blog/nuovo" element={<AdminBlogEditorPage />} />
                                            <Route path="/admin/blog/:id" element={<AdminBlogEditorPage />} />
                                        </Route>
                                    </Routes>
                                </Suspense>
                            </WaitlistGuard>
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

