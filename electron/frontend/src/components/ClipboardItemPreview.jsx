import { ScrollArea, Tooltip } from "@radix-ui/themes";
import { INTERNAL_CLIPBOARD_TYPES } from "../constants";

const getPreviewText = ({ type, metadata, content }) => {
  if (type === INTERNAL_CLIPBOARD_TYPES.TEXT) {
    return content.slice(0, 100);
  }
  if (type === INTERNAL_CLIPBOARD_TYPES.CLIPBOARD_IMAGE) {
    return "Clipboard Image";
  }
  if (type.startsWith("multi")) {
    // const label = type.replace("multi-", "");
    return `${metadata?.files?.length} files`;
  }
  return metadata?.name || metadata?.files?.[0]?.name;
};

const ClipboardItemPreview = ({ type, content, metadata }) => {
  const limit = 50;

  const previewText = getPreviewText({ type, metadata, content });
  const showTooltip = type.startsWith("multi") || previewText.length > limit;

  const sharedStyles = {
    width: "100%",
    whiteSpace: "noWrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    userSelect: "none",
  };

  if (showTooltip) {
    let tooltipContent = (
      <ScrollArea style={{ maxHeight: "200px" }}>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {metadata?.files?.length
            ? metadata?.files.map((f, i) => <div key={i}>{f.name}</div>)
            : // content if text, previewText if filename
              content || previewText}
        </pre>
      </ScrollArea>
    );

    return (
      <Tooltip
        content={tooltipContent}
        delayDuration={700}
        disableHoverableContent={true}
      >
        <div style={sharedStyles}>{previewText}</div>
      </Tooltip>
    );
  }

  return <div style={sharedStyles}>{previewText}</div>;
};

export default ClipboardItemPreview;
