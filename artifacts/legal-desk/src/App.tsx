import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";

import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Cases from "@/pages/cases";
import CaseDetail from "@/pages/case-detail";
import Tasks from "@/pages/tasks";
import Hearings from "@/pages/hearings";
import Consultations from "@/pages/consultations";
import Payments from "@/pages/payments";
import PowersOfAttorney from "@/pages/powers-of-attorney";
import Users from "@/pages/users";
import Notifications from "@/pages/notifications";
import Documents from "@/pages/documents";
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <Component {...props} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={Clients} />}
      </Route>
      <Route path="/clients/:id">
        {(params: { id: string }) => <ProtectedRoute component={ClientDetail} id={params.id} />}
      </Route>
      <Route path="/cases">
        {() => <ProtectedRoute component={Cases} />}
      </Route>
      <Route path="/cases/:id">
        {(params: { id: string }) => <ProtectedRoute component={CaseDetail} id={params.id} />}
      </Route>
      <Route path="/tasks">
        {() => <ProtectedRoute component={Tasks} />}
      </Route>
      <Route path="/hearings">
        {() => <ProtectedRoute component={Hearings} />}
      </Route>
      <Route path="/consultations">
        {() => <ProtectedRoute component={Consultations} />}
      </Route>
      <Route path="/payments">
        {() => <ProtectedRoute component={Payments} />}
      </Route>
      <Route path="/powers-of-attorney">
        {() => <ProtectedRoute component={PowersOfAttorney} />}
      </Route>
      <Route path="/users">
        {() => <ProtectedRoute component={Users} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={Notifications} />}
      </Route>
      <Route path="/documents">
        {() => <ProtectedRoute component={Documents} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
