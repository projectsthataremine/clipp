import { DrawingPinIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { Flex, IconButton } from "@radix-ui/themes";

const ClipboardItemActions = ({ id, isFavorite, onToggleFavorite }) => (
  <Flex width={"35px"} align={"center"} justify={"center"} ml={"auto"}>
    <IconButton
      size={"1"}
      variant={isFavorite ? "soft" : "ghost"}
      style={{ outline: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(id);
      }}
    >
      {isFavorite ? (
        <DrawingPinFilledIcon width={16} height={16} />
      ) : (
        <DrawingPinIcon width={16} height={16} />
      )}
    </IconButton>
  </Flex>
);

export default ClipboardItemActions;
