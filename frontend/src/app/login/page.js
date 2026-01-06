import { LoginForm } from "@/components/login-form"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full bg-[#00040A] bg-[url('/background.jpg')] bg-cover bg-center bg-fixed flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12 backdrop-blur-sm bg-black/40">
          <LoginForm />
        </div>
        <Footer />
      </div>
    </>
  );
}
