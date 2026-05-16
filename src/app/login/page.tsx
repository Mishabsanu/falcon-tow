"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useFormik } from "formik";
import * as Yup from "yup";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .required("Employee ID or Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(values),
        });

        const data = await res.json();

        if (data.success) {
          toast.success("Login successful. Redirecting...");

          // Set secure session tokens
          document.cookie = `role=${data.user.role.toUpperCase()}; path=/; max-age=86400`;
          document.cookie = `name=${data.user.name}; path=/; max-age=86400`;
          document.cookie = `id=${data.user.id}; path=/; max-age=86400`;

          localStorage.setItem('isLogind', 'true');
          localStorage.setItem('user', JSON.stringify(data.user));

          window.location.href = "/dashboard";
        } else {
          const msg = data.error || "Incorrect ID or password.";
          toast.error(msg);
        }
      } catch (err) {
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = formik;

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col lg:flex-row font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* LEFT SIDE - BRANDING SIDEBAR (Emerald Prosperity Gradient) */}
      <div className="hidden lg:flex lg:w-[45%] bg-emerald-900 items-center justify-center relative overflow-hidden p-16 border-r border-emerald-800">
        {/* THEME GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 opacity-90"></div>

        {/* PREMIUM GLOWS & TEXTURE */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 text-white space-y-16 max-w-md animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex flex-col items-center gap-10 group text-center">
            <div className="h-32 w-full transition-all duration-700 group-hover:scale-105">
              <img src="/logo-1.png" alt="Falcon Tow" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tighter text-white uppercase">FALCON <span className="text-emerald-400">TOW</span></h1>
              <p className="text-[10px] font-bold text-emerald-100/40 tracking-[0.5em] uppercase mt-4">Fleet Management System</p>
            </div>
          </div>

          <div className="space-y-8 text-center">
            <h2 className="text-5xl font-bold leading-[1.1] tracking-tight text-white">
              Next-Gen <br />
              <span className="text-emerald-400">Logistics</span> <br />
              Management.
            </h2>
            <p className="text-emerald-100/60 text-lg font-medium leading-relaxed max-w-sm mx-auto">
              Manage your fleet, billing, and staff operations in one place.
            </p>
          </div>

          <div className="pt-12 flex items-center justify-center gap-12 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-emerald-400">99.8%</p>
              <p className="text-emerald-100/40 text-[9px] font-bold uppercase tracking-[0.2em]">System Uptime</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-white">SYNC</p>
              <p className="text-emerald-100/40 text-[9px] font-bold uppercase tracking-[0.2em]">Live Sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM (Themed Soft Emerald) */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#f9fafb] relative overflow-hidden">
        {/* Subtle background branding */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none"></div>

        <div className="w-full max-w-[420px] space-y-12 relative z-10 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em]">
              <ShieldCheck size={14} className="opacity-80" />
              <span>Secure Login</span>
            </div>
            <h2 className="text-5xl font-bold text-emerald-950 tracking-tight">Login</h2>
            <p className="text-slate-500 text-sm font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Employee ID / Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                   <Mail size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="EMP-XXX or name@falcon.com"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-14 pr-6 py-5 bg-transparent border-b-2 ${touched.username && errors.username ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400`}
                />
              </div>
              {touched.username && errors.username && (
                <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-widest">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[9px] font-bold text-emerald-600 hover:text-emerald-500 uppercase tracking-widest">Forgot Password?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                   <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-14 pr-14 py-5 bg-transparent border-b-2 ${touched.password && errors.password ? 'border-red-300' : 'border-emerald-100'} focus:border-emerald-600 transition-all outline-none text-emerald-950 font-bold text-sm placeholder:text-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-[10px] font-bold text-red-500 ml-1 uppercase tracking-widest">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-6 rounded-xl shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none uppercase text-xs tracking-widest"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    Login Now
                    <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="flex items-center justify-between px-2 pt-4 border-t border-emerald-100/50">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Version 5.0.0
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}