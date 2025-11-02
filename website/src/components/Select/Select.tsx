"use client";

import { SelectHTMLAttributes, ReactNode } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: ReactNode;
  id: string;
  error?: boolean | string;
};

export default function Select({
  icon,
  id,
  error = false,
  style,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`input-wrapper ${!!error ? "error" : ""}`} style={style}>
      {icon && <div className="input-icon">{icon}</div>}
      <select id={id} className="input-field" {...props}>
        {children}
      </select>
      {typeof error === "string" && <p className="form-error">{error}</p>}
    </div>
  );
}
