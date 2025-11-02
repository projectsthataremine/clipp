"use client";

import { useState } from "react";
import supabase from "@/utils/supabase/client";
import * as RadixUI from "@radix-ui/themes";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError("Failed to sign in with Google");
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <RadixUI.Card size="4" className="w-full max-w-md">
        <RadixUI.Flex direction="column" gap="6">
          {/* Header */}
          <RadixUI.Flex direction="column" gap="2" align="center">
            <RadixUI.Heading size="6" align="center">Sign in</RadixUI.Heading>
            <RadixUI.Text size="2" color="gray" align="center">
              Sign in to access your account and manage your licenses
            </RadixUI.Text>
          </RadixUI.Flex>

          {/* Google Sign In Button */}
          <RadixUI.Flex direction="column" gap="3">
            <RadixUI.Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              size="3"
              variant="surface"
              className="cursor-pointer"
            >
              <RadixUI.Flex align="center" gap="2" justify="center" className="w-full">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                <RadixUI.Text weight="medium">
                  {loading ? "Signing in..." : "Continue with Google"}
                </RadixUI.Text>
              </RadixUI.Flex>
            </RadixUI.Button>

            {error && (
              <RadixUI.Callout.Root color="red" size="1">
                <RadixUI.Callout.Icon>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </RadixUI.Callout.Icon>
                <RadixUI.Callout.Text>
                  {error}
                </RadixUI.Callout.Text>
              </RadixUI.Callout.Root>
            )}
          </RadixUI.Flex>
        </RadixUI.Flex>
      </RadixUI.Card>
    </div>
  );
}
