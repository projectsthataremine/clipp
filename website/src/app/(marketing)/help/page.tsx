"use client";

import { useState } from "react";

import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import Select from "@/components/Select/Select";
import Textarea from "@/components/Textarea/Textarea";
import supabase from "@/utils/supabase/client";
import { IoIosAttach } from "react-icons/io";
import { Cross2Icon } from "@radix-ui/react-icons";

import "./help.scss";

const BUG_REPORT_TEMPLATE = `Please include your macOS version and hardware (e.g., M1 MacBook Air, macOS 14.4). To get this:
1. Click the  Apple logo in the top-left corner of your screen
2. Select "About This Mac"
3. Take a screenshot of the window (⇧ + ⌘ + 4, then spacebar to capture the window)

--------------------------------------

Briefly describe the bug:
- What were you trying to do?
- What happened?
- What did you expect to happen instead?

--------------------------------------

📸 Screenshots or files
(Attach any screenshots or recordings using the paperclip icon)`;

const faqItems = [
  {
    question: "How do I install Clipp?",
    answer: (
      <>
        Go to <strong>clipp.app/download</strong> — this will automatically
        start the download. Once it&apos;s finished, open the <code>.dmg</code>{" "}
        file, drag Clipp into your
        <strong> Applications</strong> folder, and follow the prompts in
        <strong> Privacy &amp; Security</strong> to allow it.
      </>
    ),
  },
  {
    question: "Why won't Clipp open?",
    answer:
      "macOS might block it at first. Go to System Settings → Privacy & Security and click 'Open Anyway'.",
  },
  {
    question: "How do I uninstall Clipp?",
    answer:
      "Just make sure Clipp is fully quit — either from the tray menu or Activity Monitor — then drag the Clipp app from your Applications folder into the Trash. That's it.",
  },
  {
    question: "How do I update Clipp, or know when an update is available?",
    answer:
      "During early development, Clipp will check for updates when it launches. If a new version is available, you’ll be prompted to install it — and the app won't run until you do. This ensures everyone stays on the latest version while we rapidly improve the app. In the future, we plan to support automatic updates for a smoother experience.",
  },
  {
    question: "Where is my clipboard history stored?",
    answer:
      "Clipboard history is stored locally on your machine. Nothing is sent to a server.",
  },
  {
    question: "Why can't I see the Clipp icon in my menu bar?",
    answer:
      "macOS may hide tray icons. Hold Command and drag other icons to reveal it.",
  },
  {
    question: "How do I quit Clipp?",
    answer:
      'Click the tray icon in your menu bar, then select "Quit" from the dropdown. Or use Activity Monitor to force quit if needed.',
  },
  {
    question: "How much does Clipp cost?",
    answer:
      "Clipp is currently free to use while it's in early development. We're gathering feedback and usage data to help shape the future of the app. If we move forward with a full 1.0 release, it will likely run on a simple subscription model — around $2 per month.",
  },
  {
    question: "What operating systems does Clipp support?",
    answer:
      "Clipp is currently available for macOS only. We're focusing on building a stable and polished experience on one platform first. As demand grows, we plan to expand support to Windows and Linux in future releases.",
  },
  {
    question: "How is Clipp different from other clipboard managers?",
    answer:
      "Clipp is intentionally simple. It's built to give you quick access to your clipboard history without clutter or complexity. No bloated features, no distractions — just clean, easy copy and paste. Clipp focuses on showing as many entries as possible while making it easy to tell text, images, files, and media apart. If you're looking for a minimal, no-frills clipboard tool, that's exactly what Clipp is.",
  },
  {
    question: "What types of clipboard content does Clipp support?",
    answer:
      "Clipp supports common clipboard content like text, images, files, and videos. Each entry is labeled by type so you can easily tell them apart. You’ll see a simple, consistent display that makes it easy to identify and reuse what you’ve copied.",
  },
  {
    question:
      "Why do I have to manually approve Clipp on macOS, and why aren't updates automatic?",
    answer:
      "Getting Clipp into the Mac App Store — with notarization, auto-updates, and seamless permissions — requires a paid Apple developer account and additional infrastructure. Since Clipp is still in its early stages, we're keeping things lean while we gather feedback and assess demand. If enough people find Clipp useful, we plan to invest in making the experience smoother, including automatic updates and full App Store support.",
  },
  {
    question: "Does Clipp run in the background?",
    answer:
      "Yes. Clipp runs silently in the background and can be accessed anytime from the menu bar.",
  },
  {
    question: "Can I pause clipboard tracking?",
    answer:
      "This feature isn't currently available. For now, you can quit the app to stop tracking.",
  },
  {
    question: "Does Clipp store my clipboard history in the cloud?",
    answer:
      "No. Everything is stored locally on your machine — nothing is uploaded or synced.",
  },
  {
    question: "Is Clipp secure?",
    answer:
      "Yes. Clipp does not transmit or share your clipboard contents. All data stays local and is only accessible to you.",
  },

  {
    question: "Can I favorite or pin clipboard items?",
    answer:
      "Yes — click the star icon next to an entry to mark it as a favorite so it won't be cleared.",
  },
];

const MAX_EMAIL = 50;
const MAX_SUBJECT = 50;
const MAX_MESSAGE = 250;

const AttachButton = ({
  attachments,
  handleFileUpload,
  setAttachments,
}: any) => {
  const [hovering, setHovering] = useState(false);
  const count = attachments.length;

  return (
    <div className="attach-wrapper">
      <label
        htmlFor="attachment-input"
        className="attach-button"
        title="Attach files"
      >
        <IoIosAttach size={20} style={{ scale: 1.4 }} />
        {count > 0 && (
          <span
            className="attachment-badge"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={(e) => {
              if (hovering) {
                e.preventDefault();
                e.stopPropagation();
                setAttachments([]);
              }
            }}
          >
            {hovering ? <Cross2Icon className="x-icon" color="red" /> : count}
          </span>
        )}
      </label>

      <input
        id="attachment-input"
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default function HelpPage() {
  const [form, setForm] = useState({
    email: "",
    subject: "",
    type: "feedback",
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    const limitedValue = (() => {
      if (name === "email") return value.slice(0, MAX_EMAIL);
      if (name === "subject") return value.slice(0, MAX_SUBJECT);
      if (name === "message") return value.slice(0, MAX_MESSAGE);
      return value;
    })();

    setForm((prev) => {
      const updated = { ...prev, [name]: limitedValue };

      if (name === "type" && limitedValue === "bug" && !prev.message) {
        updated.message = BUG_REPORT_TEMPLATE;
      } else {
        updated.message = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", form);
    setLoading(true);

    const { data: inserted, error: insertError } = await supabase
      .from("feedback")
      .insert({
        email: form.email,
        subject: form.subject,
        type: form.type,
        message: form.message,
        hasAttachments: attachments.length > 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      return;
    }

    const feedbackId = inserted?.id;

    if (feedbackId && attachments.length > 0) {
      const uploads = attachments.map((file) => {
        const path = `${feedbackId}/${file.name}`;

        return supabase.storage
          .from("feedback-attachments")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error uploading ${file.name}:`, error);
            } else {
              console.log(`Uploaded ${file.name}:`, data);
            }
            return { data, error };
          });
      });

      await Promise.all(uploads);
    }

    setLoading(false);
    setForm({
      email: "",
      subject: "",
      type: "bug",
      message: "",
    });
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/", "video/"];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const filtered = files.filter((file) => {
      const isValidType = validTypes.some((t) => file.type.startsWith(t));
      const isValidSize = file.size <= maxFileSize;
      return isValidType && isValidSize;
    });

    const combined = [...attachments, ...filtered].slice(0, 5);
    setAttachments(combined);
  };

  return (
    <section className="help-page">
      <h1>Help</h1>

      <form onSubmit={handleSubmit} className="help-form">
        <Input
          id="email"
          name="email"
          placeholder="Your email"
          value={form.email}
          onChange={handleChange}
          maxLength={MAX_EMAIL}
          type="email"
          required
        />
        <Select id="type" name="type" value={form.type} onChange={handleChange}>
          <option value="bug">Bug Report</option>
          <option value="feedback">Feedback</option>
          <option value="question">Question</option>
        </Select>

        <div className="subject-attach">
          <Input
            id="subject"
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            maxLength={MAX_SUBJECT}
            required
          />

          <AttachButton
            attachments={attachments}
            handleFileUpload={handleFileUpload}
            setAttachments={setAttachments}
          />
        </div>

        <Textarea
          id="message"
          name="message"
          placeholder="Your message"
          value={form.message}
          onChange={handleChange}
          maxLength={MAX_MESSAGE}
          style={{
            minHeight: "200px",
          }}
          required
        />
        <Button
          type="submit"
          disabled={!form.email || !form.subject || !form.message}
          loading={loading}
        >
          Submit
        </Button>
      </form>

      <hr />

      <h2>FAQs</h2>
      <div className="faq-list">
        {faqItems.map((item, idx) => (
          <details key={idx} className="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
