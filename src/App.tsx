import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import OngDashboard from "./pages/OngDashboard";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import OpportunityDetails from "./pages/OpportunityDetails";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/voluntario" element={<VolunteerDashboard />} />
            <Route path="/ong" element={<OngDashboard />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/perfil/:id" element={<PublicProfile />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/vaga/:id" element={<OpportunityDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
