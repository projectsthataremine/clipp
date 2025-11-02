"use client";

import React, { useState } from "react";
import Modal from "@/components/Modal/Modal"; // reuse your component
import Button from "@/components/Button/Button";

type ConfirmModalProps = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

export function useConfirmModal() {
  const [open, setOpen] = useState(false);
  const [props, setProps] = useState<ConfirmModalProps | null>(null);

  const confirm = (opts: ConfirmModalProps) => {
    setProps(opts);
    setOpen(true);
  };

  const ModalUI =
    open && props ? (
      <Modal open={open} onClose={() => setOpen(false)} title={props.title}>
        <div style={{ margin: "12px 0" }}>{props.message}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: ".5rem",
            marginTop: "2rem",
          }}
        >
          <Button
            style={{ fontSize: "12px", padding: "9px", borderRadius: "6px" }}
            variant="gray"
            onClick={() => setOpen(false)}
          >
            {props.cancelLabel || "Cancel"}
          </Button>
          <Button
            style={{ fontSize: "12px", padding: "9px", borderRadius: "6px" }}
            variant="danger"
            onClick={() => {
              setOpen(false);
              props.onConfirm();
            }}
          >
            {props.confirmLabel || "Confirm"}
          </Button>
        </div>
      </Modal>
    ) : null;

  return { confirm, Modal: ModalUI };
}
