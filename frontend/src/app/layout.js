import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { AuthProvider } from "@/components/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";
import { WatchlistProvider } from "@/context/WatchlistContext";
import "./globals.css";

export const metadata = {
  title: "DeepCytes",
  description: "DeepCytes CVE Explorer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#00011e" }}>
        <SessionProviderWrapper>
          <AuthProvider>
            <WatchlistProvider>
              {children}
              <ToastContainer
                position="bottom-left"
                autoClose={5000}
                hideProgressBar={false}
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
