import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { ThemeProvider } from "./contexts/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
