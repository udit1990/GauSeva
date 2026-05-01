import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePageSkeleton from "./components/HomePageSkeleton";
import { BrowserRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminFilterProvider } from "@/contexts/AdminFilterContext";
import ScrollToTop from "./components/ScrollToTop";
import CartIcon from "./components/CartIcon";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPrompt from "./components/InstallPrompt";
import { useAuth } from "@/hooks/useAuth";
import { usePersona } from "@/hooks/usePersona";
import PersonaPicker from "./components/PersonaPicker";

// Eagerly loaded (landing + auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded role-specific home pages
const AdminHome = lazy(() => import("./pages/AdminHome"));
const VolunteerHome = lazy(() => import("./pages/VolunteerHome"));
const AnimalWelfareHome = lazy(() => import("./pages/AnimalWelfareHome"));

// Lazy-loaded routes
const SevaDetail = lazy(() => import("./pages/SevaDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Proof = lazy(() => import("./pages/Proof"));
const VisitBooking = lazy(() => import("./pages/VisitBooking"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard"));
const VolunteerVisits = lazy(() => import("./pages/VolunteerVisits"));
const VolunteerOrders = lazy(() => import("./pages/VolunteerOrders"));
const VolunteerTasks = lazy(() => import("./pages/VolunteerTasks"));
const VolunteerUploads = lazy(() => import("./pages/VolunteerUploads"));
const VolunteerProfile = lazy(() => import("./pages/VolunteerProfile"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const AlertsPage = lazy(() => import("./pages/Alerts"));
const MyContributions = lazy(() => import("./pages/MyContributions"));
const MyVisits = lazy(() => import("./pages/MyVisits"));
const GuptDaan = lazy(() => import("./pages/GuptDaan"));
const Settings = lazy(() => import("./pages/Settings"));
const GiftCard = lazy(() => import("./pages/GiftCard"));
const ServiceCharity = lazy(() => import("./pages/ServiceCharity"));
const GuruJi = lazy(() => import("./pages/GuruJi"));
const BsfRescues = lazy(() => import("./pages/BsfRescues"));
const Gaushalas = lazy(() => import("./pages/Gaushalas"));
const About = lazy(() => import("./pages/About"));
const Payment = lazy(() => import("./pages/Payment"));

const queryClient = new QueryClient();

/** Empty fallback — splash screen stays visible underneath */
const LazyFallback = () => <HomePageSkeleton />;

/** Capture ?ref= referral code on any page load */
const ReferralCapture = () => {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("df_referral_code", ref);
  }, [searchParams]);
  return null;
};

const dismissSplash = () => (window as any).__dismissSplash?.();

/** Dismiss splash once rendered (for non-home routes) */
const SplashGate = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => { dismissSplash(); }, []);
  return <>{children}</>;
};


const HomeRouter = () => {
  const { isAdmin, isVolunteer, loading } = useAuth();
  const { persona, setPersona } = usePersona();

  useEffect(() => {
    if (!loading) dismissSplash();
  }, [loading]);

  if (loading) return <LazyFallback />;
  if (isAdmin) return <Suspense fallback={<LazyFallback />}><AdminHome /></Suspense>;
  if (isVolunteer) return <Suspense fallback={<LazyFallback />}><VolunteerHome /></Suspense>;

  // Persona selection overlay for new users
  if (persona === null) {
    return (
      <>
        <Index />
        <PersonaPicker onSelect={setPersona} />
      </>
    );
  }

  if (persona === "animal_welfare") {
    return <Suspense fallback={<LazyFallback />}><AnimalWelfareHome /></Suspense>;
  }

  return <Index />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
        <AdminFilterProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <ReferralCapture />
          <CartIcon />
          <InstallPrompt />
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/" element={<HomeRouter />} />
              <Route path="/seva/:id" element={<SevaDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/proof/:orderId" element={<Proof />} />
              <Route path="/proof" element={<Proof />} />
              <Route path="/visit" element={<VisitBooking />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
              <Route path="/volunteer" element={<ProtectedRoute requiredRole="volunteer"><VolunteerDashboard /></ProtectedRoute>} />
              <Route path="/volunteer-visits" element={<ProtectedRoute requiredRole="volunteer"><VolunteerVisits /></ProtectedRoute>} />
              <Route path="/volunteer-orders" element={<ProtectedRoute requiredRole="volunteer"><VolunteerOrders /></ProtectedRoute>} />
              <Route path="/volunteer-tasks" element={<ProtectedRoute requiredRole="volunteer"><VolunteerTasks /></ProtectedRoute>} />
              <Route path="/volunteer-task/:orderId" element={<ProtectedRoute requiredRole="volunteer"><TaskDetail /></ProtectedRoute>} />
              <Route path="/volunteer-uploads" element={<ProtectedRoute requiredRole="volunteer"><VolunteerUploads /></ProtectedRoute>} />
              <Route path="/volunteer-profile" element={<ProtectedRoute requiredRole="volunteer"><VolunteerProfile /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute requiredRole="volunteer"><AlertsPage /></ProtectedRoute>} />
              <Route path="/my-contributions" element={<ProtectedRoute><MyContributions /></ProtectedRoute>} />
              <Route path="/my-visits" element={<ProtectedRoute><MyVisits /></ProtectedRoute>} />
              <Route path="/gupt-daan" element={<GuptDaan />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/gift/:orderId" element={<GiftCard />} />
              <Route path="/service-charity" element={<ServiceCharity />} />
              <Route path="/guru-ji" element={<GuruJi />} />
              <Route path="/bsf-rescues" element={<BsfRescues />} />
              <Route path="/gaushalas" element={<Gaushalas />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </AdminFilterProvider>
      </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
