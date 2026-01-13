"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthContext } from "./AuthContext";
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

export default function SignupForm() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hiringRef, setHiringRef] = useState(false);
    const router = useRouter();
    const { fetchUser } = useAuthContext();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ref') === 'hiring') {
            setHiringRef(true);
            if (params.get('email')) setEmail(params.get('email'));
        }
    }, []);

    const getPasswordRequirements = (pwd) => {
        return {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*]/.test(pwd)
        };
    };

    const reqs = getPasswordRequirements(password);
    const strength = Object.values(reqs).filter(Boolean).length;
    const strengthColor = ["bg-gray-700", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength];
    const strengthLabel = ["Too Short", "Weak", "Fair", "Good", "Very Good", "Strong"][strength];

    const handleSendOtp = async () => {
        if (!email) return toast.error("Please enter an email address.");
        if (password !== confirmPassword) return toast.error("Passwords do not match!");
        if (strength < 5) return toast.error("Password must be at least 8 characters, with uppercase, lowercase, number, and a special character (!@#$%^&*)");

        setLoading(true);
        try {
            const response = await axios.post(
                `${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register/otp`,
                { email }
            );
            setOtpSent(true);
            toast.success("OTP sent successfully to your email.");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(
                `${process.env.SERVER_URL || 'http://localhost:3001/api'}/auth/register`,
                { firstName, lastName, email, password, otp }
            );

            const { token, refreshToken } = response.data;
            localStorage.setItem("accessToken", token);
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken);

            await fetchUser();
            toast.success("Registered successfully! Welcome!");

            if (hiringRef) {
                router.push("/portal/onboarding");
            } else {
                router.push("/");
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mx-auto max-w-sm bg-white/5 backdrop-blur-md border-white/10 text-white shadow-2xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-cyan-400 text-center">Sign Up</CardTitle>
                <CardDescription className="text-gray-400 text-center">
                    Join the DeepCytes Network to start your application process.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!otpSent ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    required
                                    className="bg-black/30 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    required
                                    className="bg-black/30 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="m@example.com"
                                required
                                className="bg-black/30 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Create Password</Label>
                            <div className="relative group">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="bg-black/30 border-white/10 text-white pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Strength Indicator */}
                            {password.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                        <span className="text-gray-500">Strength: <span className={strengthColor.replace('bg-', 'text-')}>{strengthLabel}</span></span>
                                        {strength === 5 ? <ShieldCheck className="w-3 h-3 text-green-500" /> : <Shield className="w-3 h-3 text-gray-600" />}
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${strengthColor}`}
                                            style={{ width: `${(strength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-gray-500">
                                        <span className={reqs.length ? "text-green-500" : ""}>• Min 8 chars</span>
                                        <span className={reqs.upper ? "text-green-500" : ""}>• One Uppercase</span>
                                        <span className={reqs.number ? "text-green-500" : ""}>• One Number</span>
                                        <span className={reqs.special ? "text-green-500" : ""}>• One Special (!@#...)</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={`bg-black/30 border-white/10 text-white pr-10 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                                    <ShieldAlert className="w-3 h-3" /> Passwords do not match
                                </p>
                            )}
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold h-11">
                            {loading ? "Sending OTP..." : "Continue to Verification"}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-400">Enter the 6-digit code sent to <br /><span className="text-white font-semibold">{email}</span></p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <button
                                onClick={handleSendOtp}
                                className="text-xs text-cyan-400 hover:underline"
                            >
                                Didn't receive a code? Resend
                            </button>
                        </div>
                        <Button onClick={handleSignup} disabled={loading || otp.length !== 6} className="w-full bg-green-600 hover:bg-green-500 font-bold h-11">
                            {loading ? "Verifying..." : "Complete Registration"}
                        </Button>
                        <button onClick={() => setOtpSent(false)} className="w-full text-xs text-gray-500 hover:text-white">Change email / details</button>
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href={`/login${hiringRef ? '?ref=hiring' : ''}`} className="underline text-cyan-400 hover:text-cyan-300 transition-colors">
                        Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
