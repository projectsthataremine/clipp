"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";

import "../sign-in/page.scss";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Password and confirm password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      console.error(error.message);
      setError("Failed to update password. Please try again.");
    } else {
      router.replace("/sign-in");
    }
  };

  return (
    <div className="sign-in-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="top-row">
          <h1>Set a new password</h1>
          <p>This will update your current password.</p>
        </div>

        <div className="form-fields">
          <div>
            <label htmlFor="password">New Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setError("");
                setPassword(e.target.value);
              }}
              placeholder="Enter your new password"
              error={error}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e: any) => {
                setError("");
                setConfirmPassword(e.target.value);
              }}
              placeholder="Confirm your new password"
            />
          </div>

          <Button type="submit" disabled={loading} loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
