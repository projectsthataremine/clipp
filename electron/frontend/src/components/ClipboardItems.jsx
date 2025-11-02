import { Flex, ScrollArea } from "@radix-ui/themes";
import ClipboardItem from "./ClipboardItem";
import ClipboardFooter from "./ClipboardFooter";
import { useEffect, useState } from "react";

const ClipboardItems = ({ onShowAccount }) => {
  const [history, setHistory] = useState([]);

  const updateHistory = (newHistory) => {
    setHistory([...newHistory]);
  };

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getClipboardHistory(updateHistory);
      window.electronAPI.onUpdateHistory(updateHistory);
    }
  }, []);

  const handleClick = (id) => {
    // Copy the item
    window.electronAPI.copyHistoryItem(id);

    // Hide window with animation (backend handles the slide)
    window.electronAPI.hideWindowAnimated();
  };

  const toggleFavorite = (id) => {
    window.electronAPI.toggleFavorite(id);
  };

  return (
    <Flex direction="column" style={{ height: "100vh", width: "400px" }}>
      <ScrollArea style={{ flex: 1 }}>
        <Flex
          direction={"column"}
          gap={".25rem"}
          p="10px 10px"
          style={{ overflow: "hidden", width: "400px" }}
        >
          {history.map((item) => (
            <ClipboardItem
              key={item.id}
              item={item}
              onClick={handleClick}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </Flex>
      </ScrollArea>
      <ClipboardFooter onShowAccount={onShowAccount} />
    </Flex>
  );
};

export default ClipboardItems;
