import { Route, Routes, Navigate } from "react-router-dom";
import { LandingPage } from "./routes/landingPage.tsx";
import { SearchSandbox } from "./routes/SearchSandbox.tsx";
import { SideBar } from "./components/admin/sideBar.tsx";
import { NavbarLayout } from "./components/navbar.tsx";
import { Login } from "./routes/login.tsx";
import { ProtectedRoute } from "./components/protectedRoute.tsx";
import { PermissionRoute } from "./components/permissionRoute.tsx";
import { GuestRoute } from "./components/guestRoute.tsx";
import { UserIndex } from "./routes/admin/user/userIndex.tsx";
import { NotFound } from "./routes/notFound.tsx";
import { Unauthorized } from "./routes/unauthorized.tsx";
import { useAuth } from "./contexts/AuthContext.tsx";
import { Loading } from "./components/loading.tsx";
import { PERMISSIONS } from "./config/permissions.ts";
import OnboardingPage from "./routes/onboarding/onboardingPage.tsx";
import { MfaChallenge } from "./routes/mfaChallenge.tsx";
import Dashboard from "./routes/admin/dashboard/dashboard.tsx";
import { Upload } from "./routes/upload.tsx";

function App() {
  const { isLoading } = useAuth();

  // Attendre que l'authentification soit vérifiée avant de rendre les routes
  // Évite les redirections indésirables et le flicker
  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Routes with Navbar Layout */}
      <Route element={<NavbarLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="search" element={<SearchSandbox />} />
        <Route path="upload" element={<Upload />} />
      </Route>

      {/* Routes for guests only (not authenticated) */}
      <Route element={<GuestRoute />}>
        <Route path="login" element={<Login />} />
      </Route>

      {/* Onboarding route */}
      <Route path="onboarding" element={<OnboardingPage />} />

      {/* MFA challenge route */}
      <Route path="mfa-challenge" element={<MfaChallenge />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="admin" element={<SideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="toto" element={<LandingPage />} />

          {/* Permission-protected routes */}
          <Route
            element={
              <PermissionRoute
                requiredPermissions={[PERMISSIONS.MANAGE_USERS]}
              />
            }
          >
            <Route path="users" element={<UserIndex />} />
          </Route>
        </Route>
      </Route>

      {/* Error pages */}
      <Route path="unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
