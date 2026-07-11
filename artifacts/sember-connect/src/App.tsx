import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Opportunities from "@/pages/Opportunities";
import OpportunityDetail from "@/pages/OpportunityDetail";
import Organizations from "@/pages/Organizations";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Panel from "@/pages/Panel";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import { RequireAuth } from "@/components/RequireAuth";
import { LanguageSync } from "@/components/LanguageSync";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/oportunidades" component={Opportunities} />
      <Route path="/oportunidades/:id/:slug" component={OpportunityDetail} />
      <Route path="/oportunidades/:id" component={OpportunityDetail} />
      <Route path="/organizaciones" component={Organizations} />
      <Route path="/registro" component={Register} />
      <Route path="/registro-organizacion">
        <Redirect to="/registro?tipo=empresa" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/perfil">
        <RequireAuth roles={["postulante"]}>
          <Profile />
        </RequireAuth>
      </Route>
      <Route path="/panel">
        <RequireAuth roles={["empresa", "admin"]}>
          <Panel />
        </RequireAuth>
      </Route>
      <Route path="/admin">
        <RequireAuth roles={["admin"]}>
          <Admin />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageSync />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
