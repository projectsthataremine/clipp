import { TextIcon, FileIcon, SpeakerLoudIcon } from "@radix-ui/react-icons";
import { ScrollArea, Tooltip } from "@radix-ui/themes";
import { useState, useRef } from "react";

import Carousel from "./Carousel";
import AudioPlayer from "./AudioPlayer";

const ClipboardItemTypeIcon = ({ type, metadata, content }) => {
  const [audioTooltipOpen, setAudioTooltipOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);
  const isMultiImage = type === "multi-image" && metadata?.files?.length > 0;
  const imageSrc = metadata?.files?.[0]?.path || content;
  const isAudio = type === "audio" || type === "multi-audio";
  const audioSrc = metadata?.files?.[0]?.path;

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setAudioTooltipOpen(true);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    // Delay closing by 400ms
    closeTimeoutRef.current = setTimeout(() => {
      // Only close if still not hovering
      if (!isHoveringRef.current) {
        setAudioTooltipOpen(false);
      }
      closeTimeoutRef.current = null;
    }, 400);
  };

  // Handle audio files with player tooltip
  if (isAudio && audioSrc) {
    const testId = type === "multi-audio" ? "icon-multi-audio" : "icon-audio";

    return (
      <Tooltip
        content={
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <AudioPlayer audioSrc={audioSrc} />
          </div>
        }
        delayDuration={400}
        side="right"
        disableHoverableContent={false}
        open={audioTooltipOpen}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            display: "flex",
            alignItems: "center",
          }}
          data-testid={testId}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SpeakerLoudIcon width="14px" height="14px" />
        </div>
      </Tooltip>
    );
  }

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

    const testId = isMultiImage ? "icon-multi-image" : `icon-${type}`;

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
        <div style={{ height: "100%" }} data-testid={testId}>{renderContent}</div>
      </Tooltip>
    );
  }

  const iconSize = "14px";

  const isMultiFile = metadata?.files?.length > 1;
  const isMultiAudio = type === "multi-audio";

  let testId = "icon-file"; // default
  if (type === "text") testId = "icon-text";
  else if (type.includes("audio") && isMultiAudio) testId = "icon-multi-audio";
  else if (type.includes("audio")) testId = "icon-audio";
  else if (isMultiFile) testId = "icon-multi-file";

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
      data-testid={testId}
    >
      {icon}
    </div>
  );
};

export default ClipboardItemTypeIcon;
