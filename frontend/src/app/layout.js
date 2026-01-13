import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { AuthProvider } from "@/components/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";
import { WatchlistProvider } from "@/context/WatchlistContext";
import "./globals.css";

export const metadata = {
  title: "DeepCytes | Secure Protocol Hub",
  description: "Official submission and management portal for DeepCytes. Revolutionizing the intersection of AI and Cybersecurity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-[#00011e]">
        <SessionProviderWrapper>
          <AuthProvider>
            <WatchlistProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <ToastContainer
                position="bottom-left"
                autoClose={5000}
                newestOnTop
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                hideProgressBar
                theme="dark"
                transition={Slide}
              />
            </WatchlistProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
