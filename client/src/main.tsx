import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "./components/routing";
import { PublicWrapper } from "./components/public-wrapper";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <PublicWrapper>
        <AppRoutes />
        <App />
      </PublicWrapper>
    </BrowserRouter>
  </QueryClientProvider>
);
