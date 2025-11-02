"use client";

import Link from "next/link";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import { signInAction } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

import "./page.scss";

export default function SignInPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("jarnld2@gmail.com ");
  const [password, setPassword] = useState("Password123!");

  const [error, setError] = useState("");

  const formIsValid = email && password;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formIsValid) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { error } = await signInAction(formData);

    setLoading(false);

    if (error) {
      setError("Invalid email or password");
      return;
    }

    router.replace("/account");
  };

  return (
    <div className="sign-in-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="top-row">
          <h1>Sign in</h1>
          <p>
            Don&apos;t have an account?{" "}
            <Link className="sign-up-link" href="/sign-up">
              Sign up
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
              onChange={(e) => {
                setError(""); // Clear error on input change
                setEmail(e.target.value);
              }}
              value={email}
              error={error}
            />
          </div>

          <div>
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link className="forgot-password" href="/forgot-password">
                Forgot Password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              onChange={(e) => {
                setError(""); // Clear error on input change
                setPassword(e.target.value);
              }}
              value={password}
              error={!!error}
            />
          </div>

          <Button
            type="submit"
            style={{
              height: "50px",
            }}
            disabled={!formIsValid || loading}
            loading={loading}
          >
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
}
