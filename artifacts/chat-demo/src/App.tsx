import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setExtraHeaders } from "@workspace/api-client-react";
import ChatPage from "@/pages/chat";
import PasswordPage from "@/pages/password";
import AuditPage from "@/pages/audit";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Generate or restore a per-tab session ID for audit log grouping
function getOrCreateSessionId(): string {
  const key = "audit_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

setExtraHeaders({ "x-session-id": getOrCreateSessionId() });

function AppContent() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("app_auth") === "1");

  if (!authed) {
    return <PasswordPage onSuccess={() => setAuthed(true)} />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/audit" component={AuditPage} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
