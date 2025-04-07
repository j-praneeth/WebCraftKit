// This is a minimal example to debug the auth provider issue
import { createContext, useContext, useState, ReactNode } from "react";

// Create a context with a default value of undefined
const ExampleContext = createContext<{ value: string } | undefined>(undefined);

// Provider component that will wrap children with the context
export function ExampleProvider({ children }: { children: ReactNode }) {
  const [value] = useState("Example Value");
  
  // Return the provider with the value
  return (
    <ExampleContext.Provider value={{ value }}>
      {children}
    </ExampleContext.Provider>
  );
}

// Hook to use the context
export function useExample() {
  const context = useContext(ExampleContext);
  
  // Throw an error if used outside of provider
  if (context === undefined) {
    throw new Error("useExample must be used within an ExampleProvider");
  }
  
  return context;
}

// Component that uses the context
export function ExampleComponent() {
  const { value } = useExample();
  return <div>Value from context: {value}</div>;
}

// Component that wraps ExampleComponent with the provider
export function ExampleApp() {
  return (
    <ExampleProvider>
      <ExampleComponent />
    </ExampleProvider>
  );
}