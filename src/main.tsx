import "./lib/proxy-patch"; // MUST be first import - patches fetch before Supabase client loads
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
