"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import axios from "axios";

const ForgotPasswordDialog = ({ open, onOpenChange, onBack }) => {
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP & password reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${process.env.SERVER_URL}/api/auth/forgot-password`,
        { email }
      );
      toast.success(response.data.message || "OTP sent successfully!");
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send OTP";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${process.env.SERVER_URL}/api/auth/reset-password`,
        { email, otp, newPassword }
      );
      toast.success(response.data.message || "Password reset successfully!");
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to reset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-blue-950/10 backdrop-blur-sm shadow-lg rounded-lg border border-white/20">
        <DialogHeader className={(onBack && step === 1) || step === 2 ? "pl-10" : ""}>
          {onBack && step === 1 && (
            <button
              onClick={onBack}
              className="absolute left-3 top-3 text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="absolute left-3 top-3 text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <DialogTitle>
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Enter your email to receive an OTP."
              : "Enter the OTP and set your new password."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-red-500 font-medium">{error}</div>}
          
          {step === 1 ? (
            <>
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="otp" className="text-right">
                  OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPassword" className="text-right">
                  Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="col-span-3"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {step === 1 ? (
            <Button
              className="w-full bg-[#3DB5DA] hover:bg-[#0592be] font-bold"
              onClick={handleSendOtp}
              disabled={!email || loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          ) : (
            <Button
              className="w-full bg-[#3DB5DA] hover:bg-[#0592be] font-bold"
              onClick={handleResetPassword}
              disabled={!otp || !newPassword || !confirmPassword || loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
