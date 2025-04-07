import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ExampleApp } from "./example";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ExampleApp />
    <App />
  </QueryClientProvider>
);
