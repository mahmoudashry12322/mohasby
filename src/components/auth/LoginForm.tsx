"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Monogram } from "@/components/brand/Monogram";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Loader2,
  KeyRound,
} from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "يرجى إدخال البريد الإلكتروني")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(1, "يرجى إدخال كلمة المرور")
    .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const t = useTranslations("loginPage");
  const locale = useLocale();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate strictly on blur per Part 2.5
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMessage(result.error || t("errorInvalid"));
        setIsLoading(false);
        return;
      }

      // Success -> navigate to dashboard
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setErrorMessage(t("errorInvalid"));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 space-y-6 text-start">
      {/* Small Brand Monogram on top */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-700/10 border border-green-700/20 flex items-center justify-center">
          <Monogram
            direction="tick"
            size={24}
            color="green"
            withAccent={true}
          />
        </div>
        <div>
          <h2 className="font-kufi text-2xl font-bold text-ink-900">
            {t("title")}
          </h2>
          <p className="text-xs text-ink-600 mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Dismissible Error Alert Banner (role="alert" per Part 9.1) */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger-subtle border border-danger/30 text-danger text-xs flex items-start justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-danger hover:opacity-75 font-bold text-xs"
            aria-label="Dismiss Alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* The Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-ink-900"
          >
            {t("emailLabel")}
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              dir="ltr"
              {...register("email")}
              placeholder={t("emailPlaceholder")}
              disabled={isLoading}
              className={`w-full h-12 px-4 rounded-input border bg-white text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-accent-500/30 transition-all font-mono ${
                errors.email && touchedFields.email
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-border"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-danger font-medium mt-1 animate-fade-in">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field with Show/Hide Toggle Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-ink-900"
            >
              {t("passwordLabel")}
            </label>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-[11px] text-green-700 hover:text-green-900 hover:underline font-medium"
            >
              {t("forgotPassword")}
            </button>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              {...register("password")}
              placeholder={t("passwordPlaceholder")}
              disabled={isLoading}
              className={`w-full h-12 pe-12 ps-4 rounded-input border bg-white text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-accent-500/30 transition-all font-mono ${
                errors.password && touchedFields.password
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-border"
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-900 transition-colors"
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-danger font-medium mt-1 animate-fade-in">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="rememberMe"
            type="checkbox"
            {...register("rememberMe")}
            className="w-4 h-4 rounded border-border text-green-700 focus:ring-accent-500 focus:ring-2 cursor-pointer"
          />
          <label
            htmlFor="rememberMe"
            className="text-xs text-ink-600 cursor-pointer select-none"
          >
            {t("rememberMe")}
          </label>
        </div>

        {/* Submit Button (Full Width, Primary Green-700, No Layout Shift) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-btn bg-green-700 hover:bg-green-900 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{t("signingIn")}</span>
              </>
            ) : (
              <span>{t("signInBtn")}</span>
            )}
          </button>
        </div>
      </form>

      {/* Back to Home Link */}
      <div className="pt-4 border-t border-border text-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-xs text-ink-600 hover:text-green-700 font-medium transition-colors"
        >
          <span>{t("backHome")}</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-green-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-border shadow-2xl space-y-4 text-start">
            <h4 className="font-kufi font-bold text-base text-ink-900">
              استعادة كلمة المرور
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              يرجى التواصل مع مسؤول النظام لإعادة تعيين كلمة المرور.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-900 text-white font-bold text-xs"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
