import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text, Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export const UpdateRequiredScreen = () => {
  return (
    <Flex
      direction={"column"}
      gap="4"
      align="center"
      justify="center"
      height={"100%"}
      p={"5"}
    >
      <Callout.Root color="red" style={{ width: "100%" }}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          <Text weight="bold">Update Required</Text>
        </Callout.Text>
      </Callout.Root>

      <Text size="3" align={"center"} style={{ maxWidth: "320px" }}>
        This version of Clipp is no longer supported due to breaking changes.
        Please update to continue using the app.
      </Text>

      <Button
        size="3"
        style={{ cursor: "pointer" }}
        color="red"
        onClick={() =>
          window.electronAPI.openExternal("https://tryclipp.com/download")
        }
      >
        <Flex gap="2" align="center">
          <div>Download Latest Version</div>
          <ExternalLinkIcon width={"16px"} height={"16px"} />
        </Flex>
      </Button>

      <Text size="1" color="gray" align={"center"}>
        The app will not function until you update.
      </Text>
    </Flex>
  );
};
