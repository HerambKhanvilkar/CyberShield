import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./AuthContext";
import { toast } from "react-toastify"; // Import toast

const SignupDialog = ({ open, onOpenChange, onBack }) => {
  // Support controlled open state (when opened from LoginDialog)
  const isControlled = typeof open === 'boolean' && typeof onOpenChange === 'function';
  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const isOpen = isControlled ? open : isOpenLocal;
  const setIsOpen = isControlled ? onOpenChange : setIsOpenLocal;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(""); // 6-digit OTP
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [hiringRef, setHiringRef] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Countdown in seconds (600 = 10 min)
  const [resendCooldown, setResendCooldown] = useState(0); // Resend cooldown in seconds
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const router = useRouter();
  const { fetchUser } = useAuthContext(); // Use context to fetch the user

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref') === 'hiring') {
      setHiringRef(true);
      if (params.get('email')) setEmail(params.get('email'));
    }
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  // Function to request OTP using Axios
  const handleSendOtp = async () => {
    const apiUrl = process.env.SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001/api';
    try {
      const response = await axios.post(
        `${apiUrl}/auth/register/otp`,
        { email }
      );

      if (response.status === 200) {
        setOtpSent(true);
        setError("");
        setOtpTimer(600); // 10 minutes
        setResendCooldown(120); // 2 minutes cooldown
        toast.success("OTP sent successfully to your email.");
        console.log("OTP sent successfully to:", email);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send OTP";
      setError(errorMsg);
      console.error("Send OTP error:", err);
      toast.error(errorMsg);

      // If email already registered, offer login
      if (err.response?.data?.action === 'login') {
        setError(errorMsg + " Please login instead.");
      }
    }
  };

  const handleResendOtp = async () => {
    const apiUrl = process.env.SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001/api';
    try {
      const response = await axios.post(
        `${apiUrl}/auth/resend-otp`,
        { email }
      );

      if (response.status === 200) {
        setOtpTimer(600);
        setResendCooldown(120);
        toast.success("New OTP sent to your email.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to resend OTP";
      toast.error(errorMsg);
    }
  };

  const handleChangeEmail = async () => {
    const apiUrl = process.env.SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001/api';
    try {
      await axios.post(`${apiUrl}/auth/change-email`, { oldEmail: email, newEmail: email });
      setOtpSent(false);
      setOtp("");
      setOtpTimer(0);
      setResendCooldown(0);
      setShowChangeEmail(false);
      toast.info("Email reset. Please enter new email and request OTP.");
    } catch (err) {
      toast.error("Failed to change email");
    }
  };

  const consoleOTP = (value) => {
    // Store OTP exactly as entered; enable Register only when length === 6
    setOtp(String(value || ''));
  };

  useEffect(() => {
    console.log("Updated otp:", otp);
  }, [otp]);

  // Function to handle registration after OTP is entered
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const apiUrl = process.env.SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001/api';
    try {
      const response = await axios.post(
        `${apiUrl}/auth/register`,
        {
          firstName,
          lastName,
          email,
          password,
          otp,
        }
      );

      if (response.status === 200) {
        const { token, accessToken, refreshToken } = response.data; // Extract tokens
        console.log("Signup successful:", response.data);

        // Save tokens in localStorage
        localStorage.setItem("accessToken", token);
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);

        // Fetch the user's data
        await fetchUser();

        // Close the signup dialog
        setIsOpen(false);
        toast.success("Registered successfully! Welcome!");

        if (hiringRef) {
          router.push("/portal/onboarding");
        } else {
          router.push("/"); // Redirect to homepage
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.msg || "Signup failed");
      toast.error("Signup failed. Try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only render the built-in trigger when not controlled by parent */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">Sign Up</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-blue-950/10 backdrop-blur-sm shadow-lg rounded-lg border border-white/20">
        <DialogHeader className={onBack ? "pl-10" : ""}>
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-3 top-3 text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <DialogTitle>Sign Up</DialogTitle>
          <DialogDescription>
            Enter your details to create an account. After entering your
            details, click "Send OTP" to receive an OTP.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-red-500 font-medium">{error}</div>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your First name"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your First name"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="col-span-3"
            />
          </div>
          {!otpSent ? (
            <>
              <DialogFooter>
                <Button
                  onClick={handleSendOtp}
                  disabled={!firstName || !firstName || !email || !password || !confirmPassword}
                  className="w-full bg-[#3DB5DA] hover:bg-[#0592be] font-bold"
                >
                  Send OTP
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Enter OTP</Label>
                  <div className="flex items-center gap-2 text-xs">
                    {otpTimer > 0 ? (
                      <span className="text-cyan-400 font-mono">
                        {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                      </span>
                    ) : (
                      <span className="text-red-400">Expired</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => consoleOTP(value)}
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

                  {/* Resend button */}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    aria-label="Resend OTP"
                    title={resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend OTP"}
                    className={`w-9 h-9 rounded-full flex items-center justify-center p-1 ${resendCooldown > 0
                        ? 'bg-gray-700 cursor-not-allowed opacity-50'
                        : 'bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] font-mono">{resendCooldown}</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                        <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" strokeLinejoin="round"></path>
                        <polyline points="21 3 21 9 15 9" strokeLinecap="round" strokeLinejoin="round"></polyline>
                      </svg>
                    )}
                  </button>
                </div>
                {/* Change Email link */}
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-xs text-gray-400 hover:text-cyan-400 mt-2 underline"
                >
                  Change Email?
                </button>
              </div>
              <DialogFooter>
                <Button onClick={handleSignup} disabled={String(otp).length !== 6}>
                  Register
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
