import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./app/App";
import "./styles/index.css";

const rootEl = document.getElementById("root") as HTMLElement;
const clerkPublishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "").trim();

if (!clerkPublishableKey) {
  createRoot(rootEl).render(
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 8 }}>Clerk is not configured</p>
      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5 }}>
        Set <code style={{ background: "#eee", padding: "2px 6px", borderRadius: 4 }}>VITE_CLERK_PUBLISHABLE_KEY</code>{" "}
        in Vercel → Project → Settings → Environment Variables, then redeploy. Also add{" "}
        <code style={{ background: "#eee", padding: "2px 6px", borderRadius: 4 }}>VITE_API_URL</code> to your Cloud Run
        API base URL.
      </p>
    </div>,
  );
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}

