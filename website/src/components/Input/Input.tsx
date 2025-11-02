"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import "./Input.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  id: string;
  error?: boolean | string;
  style?: React.CSSProperties | { [key: string]: string };
};

export default function Input({
  icon,
  id,
  error = false,
  style,
  ...props
}: InputProps) {
  return (
    <div className={`input-wrapper ${!!error ? "error" : ""}`} style={style}>
      {icon && <div className="input-icon">{icon}</div>}
      <input id={id} className={`input-field `} {...props} />
      {typeof error === "string" && <p className="form-error">{error}</p>}
    </div>
  );
}
