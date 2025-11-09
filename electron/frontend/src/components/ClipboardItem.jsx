import { Flex } from "@radix-ui/themes";
import { motion } from "framer-motion";

import ClipboardItemActions from "./ClipboardItemActions";
import ClipboardItemPreview from "./ClipboardItemPreview";
import ClipboardItemTypeIcon from "./ClipboardItemTypeIcon";

const ClipboardItem = ({ item, onClick, onToggleFavorite }) => {
  const { isFavorite, id, content, type, metadata } = item;

  return (
    <motion.div
      className="clipboard-item"
      data-item-id={id}
      onClick={() => onClick(id)}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Flex
        align={"center"}
        gap={".5rem"}
        width={"100%"}
        p={"0 var(--space-3)"}
      >
        <Flex
          width={"40px"}
          height={"100%"}
          align={"center"}
          justify={"center"}
          flexShrink={0}
        >
          <ClipboardItemTypeIcon
            type={type}
            metadata={metadata}
            content={content}
          />
        </Flex>
        <ClipboardItemPreview
          type={type}
          content={content}
          metadata={metadata}
        />
        <ClipboardItemActions
          id={id}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      </Flex>
    </motion.div>
  );
};

export default ClipboardItem;
