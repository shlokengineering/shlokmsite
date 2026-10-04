import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutPage from "./pages/About";
import NotFoundPage from "./pages/NotFound";
import LoginPage from "./features/auth/LoginPage";
import SignUpPage from "./features/auth/SignUpPage";
import CaseListPage from "./features/cases/CaseListPage";
import CaseFormPage from "./features/cases/CaseFormPage";
import CaseEditPage from "./features/cases/CaseEditPage";
import CaseDetailPage from "./features/cases/CaseDetailPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ManageSurveyorsPage from "./features/admin/ManageSurveyorsPage";
import ProfilePage from "./features/auth/ProfilePage";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/about" replace />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases"
              element={
                <ProtectedRoute>
                  <CaseListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases/new"
              element={
                <ProtectedRoute requireRole="admin">
                  <CaseFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases/:id"
              element={
                <ProtectedRoute>
                  <CaseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases/:id/edit"
              element={
                <ProtectedRoute requireRole="admin">
                  <CaseEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/surveyors"
              element={
                <ProtectedRoute requireRole="superadmin">
                  <ManageSurveyorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profiles/:id"
              element={
                <ProtectedRoute requireRole="admin">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
