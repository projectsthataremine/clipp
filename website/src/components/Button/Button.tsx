"use client";

import { ButtonHTMLAttributes } from "react";
import { SyncLoader } from "react-spinners";
import "./Button.scss";

type ButtonProps = {
  loading?: boolean;
  variant?: "primary" | "danger" | "gray";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  loading,
  variant = "primary",
  ...props
}: ButtonProps) {
  const className = `btn btn-${variant} ${props.className || ""}`.trim();

  return (
    <button
      {...props}
      className={className}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <div className="btn-spinner">
          <SyncLoader color="white" size={9} />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
