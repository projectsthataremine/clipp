import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text } from "@radix-ui/themes";

export const UpdateAvailableScreen = () => {
  return (
    <Flex
      direction={"column"}
      gap="3"
      align="center"
      justify="center"
      height={"100%"}
      p={"4"}
    >
      <Text size="4">Update Available</Text>
      <Text size="2" align={"center"}>
        A new version of the app is available. Please update to the latest
        version.
      </Text>
      <Button
        mt={"1"}
        style={{ cursor: "pointer" }}
        onClick={() =>
          window.electronAPI.openExternal("https://tryclipp.com/download")
        }
      >
        <Flex gap="1" align="center">
          <div>Update Now</div>
          <ExternalLinkIcon width={"14px"} height={"14px"} />
        </Flex>
      </Button>
    </Flex>
  );
};
