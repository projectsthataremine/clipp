"use client";

import { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./Modal.scss";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
};

export default function Modal({ open, onClose, children, title }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4>{title}</h4>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.getElementById("app-root") as HTMLElement
  );
}
