"use client";

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "./AuthContext"
import ForgotPasswordDialog from "./ForgotPasswordDialog"

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [hiringRef, setHiringRef] = useState(false);
  const router = useRouter();
  const { fetchUser } = useAuthContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref') === 'hiring') {
      setHiringRef(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("refreshToken", data.refreshToken);

        toast.success("Logged in successfully!");
        await fetchUser();

        if (data.user.fellowshipStatus === 'FELLOW') {
          router.push("/FellowshipProfile");
        } else if (hiringRef || data.user.fellowshipStatus === 'ONBOARDING') {
          router.push("/portal/onboarding");
        } else {
          router.push("/");
        }
      } else {
        const error = await response.json();
        toast.error(error.msg || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ForgotPasswordDialog
        open={showForgotPwd}
        onOpenChange={setShowForgotPwd}
      />
      <Card className="mx-auto max-w-sm bg-white/5 backdrop-blur-md border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-cyan-400 text-center">Login</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-black/30 border-white/10 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPwd(true)}
                  className="ml-auto inline-block text-sm underline text-cyan-500 hover:text-cyan-400"
                >
                  Forgot your password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="bg-black/30 border-white/10 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-11 transition-all">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href={`/signup${hiringRef ? '?ref=hiring' : ''}`} className="underline text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
