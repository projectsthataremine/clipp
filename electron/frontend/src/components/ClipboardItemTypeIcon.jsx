import { TextIcon, FileIcon, SpeakerLoudIcon } from "@radix-ui/react-icons";
import { ScrollArea, Tooltip } from "@radix-ui/themes";

import Carousel from "./Carousel";

const ClipboardItemTypeIcon = ({ type, metadata, content }) => {
  const isMultiImage = type === "multi-image" && metadata?.files?.length > 0;
  const imageSrc = metadata?.files?.[0]?.path || content;

  if ((type.includes("image") || isMultiImage) && imageSrc) {
    const imagePaths = metadata?.files?.map?.((f) => f.path) || [];

    const renderContent = (
      <div style={{ position: "relative", height: "100%", display: "flex" }}>
        <img
          src={imageSrc}
          style={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        />
      </div>
    );

    return (
      <Tooltip
        content={
          isMultiImage ? <Carousel images={imagePaths} /> : renderContent
        }
        delayDuration={400}
        side="right"
        width={isMultiImage ? "auto" : "50%"}
        disableHoverableContent={!isMultiImage}
      >
        <div style={{ height: "100%" }}>{renderContent}</div>
      </Tooltip>
    );
  }

  const iconSize = "14px";

  const isMultiFile = metadata?.files?.length > 1;

  const icon = type.includes("audio") ? (
    <SpeakerLoudIcon width={iconSize} height={iconSize} />
  ) : type === "text" ? (
    <TextIcon width={iconSize} height={iconSize} />
  ) : isMultiFile ? (
    <div
      style={{
        position: "relative",
        width: iconSize,
        height: `calc(${iconSize} + 8px)`, // extra height to show stack
      }}
    >
      {Array.from({ length: metadata?.files?.length || 3 }).map((_, i) => (
        <FileIcon
          key={i}
          width={iconSize}
          height={iconSize}
          style={{
            color: "white",

            position: "absolute",
            top: `${i * 3}px`, // vertical offset
            left: `${i * 3}px`,
            zIndex: 3 - i, // topmost is last
            opacity: 1 - i * 0.2, // optional fading
          }}
        />
      ))}
    </div>
  ) : (
    <FileIcon width={iconSize} height={iconSize} />
  );

  return (
    <div
      style={{
        width: iconSize,
        height: iconSize,
        display: "flex",
        alignItems: "center",
      }}
    >
      {icon}
    </div>
  );
};

export default ClipboardItemTypeIcon;
