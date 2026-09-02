import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { ComparisonBar } from "./components/ComparisonBar";
import ThemeToggle from "./components/ThemeToggle";
import Home from "./pages/Home";
import SiteHeader from "./components/SiteHeader";
import TopBrandsBar from "./components/TopBrandsBar";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import ShoppingCart from "./pages/ShoppingCart";
import Wishlist from "./pages/Wishlist";
import Comparison from "./pages/Comparison";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import Orders from "./pages/Orders";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/products"} component={Products} />
      <Route path={"/product/:id"} component={ProductDetails} />
      <Route path={"/cart"} component={ShoppingCart} />
      <Route path={"/wishlist"} component={Wishlist} />
      <Route path={"/comparison"} component={Comparison} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/login"} component={Login} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [location] = useLocation();
  const hideHeader = location.startsWith("/admin");

  return (
    <ErrorBoundary>
      <ComparisonProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <Toaster />
            <div className="fixed left-4 top-4 z-[100]">
              <ThemeToggle compact />
            </div>
            {/* Show header and categories bar only on non-admin pages */}
            {!hideHeader && <SiteHeader />}
            {!hideHeader && <TopBrandsBar />}
            <Router />
            <ComparisonBar />
          </TooltipProvider>
        </ThemeProvider>
      </ComparisonProvider>
    </ErrorBoundary>
  );
}

export default App;
