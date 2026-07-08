import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Opportunities from "@/pages/Opportunities";
import OpportunityDetail from "@/pages/OpportunityDetail";
import Organizations from "@/pages/Organizations";
import RegisterOrganization from "@/pages/RegisterOrganization";
import Profile from "@/pages/Profile";
import Panel from "@/pages/Panel";
import Admin from "@/pages/Admin";

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
      <Route path="/oportunidades/:id" component={OpportunityDetail} />
      <Route path="/organizaciones" component={Organizations} />
      <Route path="/registro-organizacion" component={RegisterOrganization} />
      <Route path="/perfil" component={Profile} />
      <Route path="/panel" component={Panel} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
