import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "./components/routing";
import { PublicWrapper } from "./components/public-wrapper";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <PublicWrapper>
      <AppRoutes />
      <App />
    </PublicWrapper>
  </QueryClientProvider>
);
