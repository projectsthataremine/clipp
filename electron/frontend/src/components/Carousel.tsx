import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";

const SimpleCarousel = ({ images = [] }) => {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const iconSize = 16;
  const sharedButtonStyles = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0, 0, 0, 0.2)",
    border: "none",
    padding: "1px",
    margin: "2px",
    borderRadius: "50%",
    cursor: "pointer",
    color: "white",
    outline: "none",
    aspectRatio: "1 / 1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const prev = () => setIndex((index - 1 + total) % total);
  const next = () => setIndex((index + 1) % total);

  if (total === 0) return null;

  return (
    <div
      style={{ position: "relative", height: "175px", width: "175px" }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <img
        src={images[index]}
        style={{
          height: "100%",
          width: "100%",
          objectFit: "contain",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      />
      <button
        title="Previous"
        onClick={prev}
        style={{
          ...sharedButtonStyles,
          left: 0,
        }}
      >
        <ChevronLeftIcon width={iconSize} height={iconSize} />
      </button>
      <button
        title="Next"
        onClick={next}
        style={{
          ...sharedButtonStyles,
          right: 0,
        }}
      >
        <ChevronRightIcon width={iconSize} height={iconSize} />
      </button>
    </div>
  );
};

export default SimpleCarousel;
