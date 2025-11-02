"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import { signUpAction } from "@/app/actions";

import "../sign-in/page.scss";

export default function SignUpPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("jarnld2@gmail.com ");
  const [password, setPassword] = useState("Password123!");
  const [confirmPassword, setConfirmPassword] = useState("Password123!");

  const [errors, setErrors] = useState<{
    passwordValidation?: string;
    passwordMatch?: string;
  }>({});

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const validate = (password: string, confirmPassword: string) => {
    const passwordRules = [
      {
        test: (val: string) => val.length >= 8,
        error: "Must be at least 8 characters",
      },
      {
        test: (val: string) => /[A-Z]/.test(val),
        error: "Must include an uppercase letter",
      },
      {
        test: (val: string) => /[a-z]/.test(val),
        error: "Must include a lowercase letter",
      },
      {
        test: (val: string) => /[0-9]/.test(val),
        error: "Must include a number",
      },
      {
        test: (val: string) => /[!@#$%^&*]/.test(val),
        error: "Must include a special character",
      },
    ];

    const failedRule = passwordRules.find((rule) => !rule.test(password));

    const newErrors: {
      passwordValidation?: string;
      passwordMatch?: string;
    } = {};

    if (failedRule) {
      newErrors.passwordValidation = failedRule.error;
    }

    if (confirmPassword && password !== confirmPassword) {
      newErrors.passwordMatch = "Passwords do not match";
    }

    setErrors(newErrors);
  };

  const formIsValid =
    email &&
    password &&
    confirmPassword &&
    !errors.passwordValidation &&
    !errors.passwordMatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formIsValid) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data }: any = await signUpAction(formData);

    setLoading(false);

    console.log(data?.user);

    if (!data?.user) {
      setErrors({
        passwordValidation: "User already exists",
        passwordMatch: undefined,
      });
      return;
    }

    router.push("/sign-up/verify");
  };

  return (
    <div className="sign-in-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="top-row">
          <h1>Sign up</h1>
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="label-row">
              <label htmlFor="password">Password</label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  passwordValidation: undefined,
                }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, password: true }));
                validate(password, confirmPassword);
              }}
              error={touched.password && errors.passwordValidation}
            />
          </div>

          <div>
            <div className="label-row">
              <label htmlFor="confirm-password">Confirm Password</label>
            </div>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, passwordMatch: undefined }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, confirmPassword: true }));
                validate(password, confirmPassword);
              }}
              error={errors.passwordMatch && errors.passwordMatch}
            />
          </div>

          <Button
            type="submit"
            disabled={!formIsValid || loading}
            loading={loading}
            style={{
              height: "50px",
            }}
          >
            Sign up
          </Button>
        </div>
      </form>
    </div>
  );
}
