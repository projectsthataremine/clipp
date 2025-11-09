import { ExternalLinkIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text } from "@radix-ui/themes";

export const UpdateRequiredScreen = () => {
  return (
    <Flex
      direction={"column"}
      gap="5"
      align="center"
      justify="center"
      style={{ minHeight: "100vh" }}
      p={"5"}
    >
      <Flex direction="column" align="center" gap="2">
        <InfoCircledIcon width="48" height="48" color="var(--red-9)" />
        <Text size="6" weight="bold" align="center">
          Update Required
        </Text>
      </Flex>

      <Text size="3" align="center" style={{ maxWidth: "400px" }} color="gray">
        This version of Clipp is no longer supported due to breaking changes.
        Please update to continue using the app.
      </Text>

      <Button
        size="3"
        style={{ cursor: "pointer" }}
        color="red"
        onClick={() => {
          window.electronAPI.openExternal("https://tryclipp.com/download");
          window.electronAPI.hideWindowAnimated();
        }}
      >
        <Flex gap="2" align="center">
          <div>Download Latest Version</div>
          <ExternalLinkIcon width={"16px"} height={"16px"} />
        </Flex>
      </Button>

      <Text size="1" color="gray" align="center">
        The app will not function until you update.
      </Text>
    </Flex>
  );
};
