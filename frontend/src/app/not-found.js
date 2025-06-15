// app/not-found.tsx
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col glow-container text-white font-sans selection:bg-[#38C8F8] selection:text-black">
      <div className="ball"></div>
    <div className="ball" style={{ "--delay": "-12s", "--size": "0.35", "--speed": "25s" }}></div>
    <div className="ball" style={{ "--delay": "-10s", "--size": "0.3", "--speed": "15s" }}></div>
      <Navbar />
    <section className="bg-gray-900">
    <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-black-500">404</h1>
            <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl text-white">Something's missing.</p>
            <p className="mb-4 text-lg font-light text-gray-400">Sorry, we can't find that page. May be try something from the home page. </p>
            <Link href="/" className=" select-none items-center rounded-sm m-1 px-2 py-1.5 text-sm bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] hover:from-white/20 hover:to-white/10" >Back to Homepage</Link>
        </div>
    </div>
</section>
      <Footer />
    </div>
  )
}

