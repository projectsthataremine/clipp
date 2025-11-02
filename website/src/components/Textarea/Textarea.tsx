"use client";

import { TextareaHTMLAttributes, ReactNode } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  icon?: ReactNode;
  id: string;
  error?: boolean | string;
  style?: React.CSSProperties;
  height?: number | string;
  maxLength?: number;
};

export default function Textarea({
  icon,
  id,
  error = false,
  style,
  ...props
}: TextareaProps) {
  return (
    <div className={`input-wrapper ${!!error ? "error" : ""}`}>
      {icon && <div className="input-icon">{icon}</div>}
      <textarea id={id} className="input-field" {...props} style={style} />
      {typeof error === "string" && <p className="form-error">{error}</p>}
    </div>
  );
}
