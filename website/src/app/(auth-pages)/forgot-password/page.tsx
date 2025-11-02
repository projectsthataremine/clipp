"use client";

import Link from "next/link";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import { forgotPasswordAction } from "@/app/actions";
import { useState } from "react";

import "../sign-in/page.scss";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSubmitted(false);

    const formData = new FormData(e.currentTarget);
    const { error } = await forgotPasswordAction(formData);
    console.log(error);

    setLoading(false);

    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="sign-in-page">
        <div className="auth-form">
          <h1>Check your email</h1>
          <br />
          <p style={{ lineHeight: "1.5" }}>
            A password reset link has been sent to your email address. Please
            check your inbox.
          </p>
        </div>
      </div>
    );
  }

  const formIsValid = !!email.trim();

  return (
    <div className="sign-in-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="top-row">
          <h1>Reset Password</h1>
          <p>
            Already have an account?{" "}
            <Link className="sign-up-link" href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>

        <div className="form-fields">
          <div>
            <div className="label-row">
              <label htmlFor="email">Email</label>
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
            />
          </div>

          <Button
            type="submit"
            disabled={!formIsValid || loading}
            loading={loading}
            style={{ height: "50px" }}
          >
            Reset Password
          </Button>
        </div>
      </form>
    </div>
  );
}
