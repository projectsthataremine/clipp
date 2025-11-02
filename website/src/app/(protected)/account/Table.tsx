"use client";

import Button from "@/components/Button/Button";
import { useToast } from "@/components/Toast/ToastContext";
import { useState } from "react";
import { SyncLoader } from "react-spinners";

const TableHeader = ({}) => {
  return (
    <thead>
      <tr>
        <th>Subscription Key</th>
        <th>Device Name</th>
        <th></th>
      </tr>
    </thead>
  );
};

const TableRow = ({
  item,
  type,
  onRevoke,
  onCancel,
  handleMachineNameChange,
}: any) => {
  const [showEdit, setShowEdit] = useState(false);
  const [machineName, setMachineName] = useState(item?.machine_name);
  const { showToast } = useToast();

  if (type === "loading") {
    return (
      <tr>
        <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
          <div className="center">
            <SyncLoader color="#415af8" size={7} />
          </div>
        </td>
      </tr>
    );
  }

  if (type === "empty") {
    return (
      <tr>
        <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
          No licenses found.
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.key}
          </p>
          <Button
            style={{
              fontSize: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              marginRight: "8px",
              whiteSpace: "nowrap",
            }}
            variant="gray"
            onClick={() => {
              navigator.clipboard.writeText(item.key);
              showToast("Key copied to clipboard", "info");
            }}
          >
            Copy Key
          </Button>
        </div>
      </td>
      <td>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: "6px",
          }}
        >
          {!showEdit && <div>{machineName}</div>}
          {showEdit && (
            <input
              type="text"
              value={machineName}
              maxLength={20}
              minLength={3}
              placeholder="Device Name"
              onChange={(e) => {
                const value = e.target.value;

                setMachineName(value);
              }}
              style={{
                width: "90%",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          )}
          <Button
            style={{
              fontSize: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              marginRight: "8px",
              whiteSpace: "nowrap",
            }}
            variant={showEdit ? "primary" : "gray"}
            onClick={() => {
              if (showEdit) {
                if (machineName === item.machine_name) {
                  setShowEdit(false);
                  return;
                }
                if (machineName.length > 20) {
                  showToast(
                    "Device name must be less than 20 characters",
                    "error"
                  );
                  return;
                }
                if (machineName.length < 3) {
                  showToast(
                    "Device name must be more than 3 characters",
                    "error"
                  );
                  return;
                }
                handleMachineNameChange(item.key, machineName);
                showToast("Device name updated", "success");
              }
              setShowEdit(!showEdit);
            }}
          >
            {showEdit ? "Save" : "Edit"}
          </Button>
        </div>
      </td>
      <td>
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="revoke-button"
            onClick={() => {
              if (onRevoke) {
                onRevoke(item.key);
              }
            }}
          >
            Remove Device
          </button>
          <button
            className="revoke-button"
            onClick={() => {
              if (onCancel) {
                onCancel(item.key);
              }
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function AccountPage({
  loading,
  licenses,
  onRevoke,
  onCancel,
  handleMachineNameChange,
}: any) {
  return (
    <table className="licenses-table">
      <TableHeader />
      <tbody>
        {loading ? (
          <TableRow type="loading" />
        ) : licenses.length === 0 ? (
          <TableRow type="empty" />
        ) : (
          licenses.map((item: any) => (
            <TableRow
              key={item.key}
              item={item}
              type="data"
              onRevoke={onRevoke}
              onCancel={onCancel}
              handleMachineNameChange={handleMachineNameChange}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
