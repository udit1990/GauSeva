import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, ArrowRight, KeyRound, User, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import dhyanText from "@/assets/dhyan-flag.png";
import dhyanFlag from "@/assets/dhyan-logo.png";

type AuthMode = "phone" | "otp" | "signup-details" | "forgot" | "forgot-otp" | "reset-password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState<AuthMode>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/^0+/, "")}`;

  const invokeOtp = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("phone-otp", {
      body,
    });
    if (error) throw new Error(error.message || "Request failed");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handlePasswordLogin = async () => {
    if (phone.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    if (password.length < 6) {
      toast.error("Enter your password");
      return;
    }
    setLoading(true);
    try {
      const data = await invokeOtp({
        action: "password_login",
        phone: formattedPhone,
        password,
      });
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success("Welcome back! 🙏");
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (purpose: string) => {
    if (phone.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await invokeOtp({
        action: "send_otp",
        phone: formattedPhone,
        purpose,
      });
      toast.success("OTP sent!");
      if (purpose === "login" || purpose === "signup") {
        setMode("otp");
      } else {
        setMode("forgot-otp");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const data = await invokeOtp({
        action: "verify_otp",
        phone: formattedPhone,
        code: otp,
        purpose: "login",
        full_name: fullName,
        email: email || undefined,
      });

      if (data.isNew) {
        setIsNewUser(true);
        setMode("signup-details");
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        return;
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success("Welcome back! 🙏");
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupDetails = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Please set a password (min 6 characters)");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          full_name: fullName,
          email: email || null,
          phone: formattedPhone,
        }).eq("id", user.id);
      }

      // Set the user-chosen password
      await invokeOtp({
        action: "set_password",
        phone: formattedPhone,
        password: signupPassword,
      });

      toast.success("Welcome! 🙏");
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await invokeOtp({
        action: "verify_otp",
        phone: formattedPhone,
        code: otp,
        purpose: "reset",
      });
      setMode("reset-password");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await invokeOtp({
        action: "reset_password",
        phone: formattedPhone,
        password: newPassword,
      });
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      toast.success("Password reset successful!");
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setOtp("");
    if (mode === "otp" || mode === "forgot") setMode("phone");
    else if (mode === "forgot-otp") setMode("forgot");
    else if (mode === "reset-password") setMode("forgot-otp");
    else setMode("phone");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="flex items-center mb-6">
        <img src={dhyanText} alt="Dhyan Foundation" className="h-8 object-contain" />
        <img src={dhyanFlag} alt="" className="h-10 object-contain -ml-0.5 -mt-3" />
      </div>

      {/* Phone + Password Entry */}
      {mode === "phone" && (
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-1">Welcome</h1>
            <p className="text-sm text-muted-foreground">
              Enter your mobile number to continue
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-12 pl-12 rounded-lg bg-card text-base"
                maxLength={10}
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-10 pr-10 rounded-lg bg-card text-base"
                maxLength={64}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              onClick={handlePasswordLogin}
              disabled={loading || phone.length < 10 || password.length < 6}
              className="w-full h-12 rounded-lg text-base font-semibold"
              size="lg"
            >
              {loading ? "Logging in…" : "Login"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            variant="outline"
            onClick={() => handleSendOtp("login")}
            disabled={loading || phone.length < 10}
            className="w-full h-11 rounded-lg text-sm font-medium"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Login with OTP
          </Button>

          <button
            onClick={() => { setMode("forgot"); }}
            className="block mx-auto text-sm text-primary font-medium"
          >
            Forgot Password?
          </button>
        </div>
      )}

      {/* OTP Verification */}
      {mode === "otp" && (
        <div className="w-full max-w-sm space-y-5">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Verify OTP</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm font-semibold text-foreground">+91 {phone}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg rounded-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Verifying…
              </span>
            ) : "Verify & Continue"}
          </Button>

          <button
            onClick={() => { setOtp(""); handleSendOtp("login"); }}
            className="block mx-auto text-sm text-primary font-medium"
          >
            Resend OTP
          </button>

        </div>
      )}

      {/* New user — collect details + set password */}
      {mode === "signup-details" && (
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-lg bg-card"
              required
            />
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-10 rounded-lg bg-card"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Set Password (min 6 chars) *"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="h-12 pl-10 rounded-lg bg-card"
                minLength={6}
                maxLength={64}
              />
            </div>

            <Button
              onClick={handleSignupDetails}
              disabled={loading || !fullName.trim() || signupPassword.length < 6}
              className="w-full h-12 rounded-lg text-base font-semibold"
              size="lg"
            >
              {loading ? "Saving…" : "Get Started 🙏"}
            </Button>
          </div>
        </div>
      )}

      {/* Forgot password — enter phone */}
      {mode === "forgot" && (
        <div className="w-full max-w-sm space-y-5">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-1">Forgot Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your phone number to receive a reset OTP
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-12 pl-12 rounded-lg bg-card text-base"
                maxLength={10}
              />
            </div>

            <Button
              onClick={() => handleSendOtp("reset")}
              disabled={loading || phone.length < 10}
              className="w-full h-12 rounded-lg text-base font-semibold"
              size="lg"
            >
              {loading ? "Sending…" : "Send Reset OTP"}
            </Button>
          </div>
        </div>
      )}

      {/* Forgot — verify OTP */}
      {mode === "forgot-otp" && (
        <div className="w-full max-w-sm space-y-5">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Verify OTP</h1>
            <p className="text-sm text-muted-foreground">
              Enter the code sent to <span className="font-semibold text-foreground">+91 {phone}</span>
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg rounded-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleForgotVerify}
            disabled={loading || otp.length !== 6}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Verifying…
              </span>
            ) : "Verify"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Dev mode: Use code <span className="font-bold text-foreground">123456</span>
          </p>
        </div>
      )}

      {/* Reset password */}
      {mode === "reset-password" && (
        <div className="w-full max-w-sm space-y-5">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Set New Password</h1>
            <p className="text-sm text-muted-foreground">
              Choose a new password for your account
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-lg bg-card"
              minLength={6}
            />

            <Button
              onClick={handleResetPassword}
              disabled={loading || newPassword.length < 6}
              className="w-full h-12 rounded-lg text-base font-semibold"
              size="lg"
            >
              {loading ? "Resetting…" : "Reset & Login"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;