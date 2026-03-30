import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { AuthProvider } from "@/components/AuthContext";
import { Lato } from "next/font/google";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";
import { WatchlistProvider } from "@/context/WatchlistContext";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Profile Portal | DeepCytes",
  description: "Manage your profile at DeepCytes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${lato.variable} bg-[#00011e]`}>
        <SessionProviderWrapper>
          <AuthProvider>
            <WatchlistProvider>
              {children}
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
