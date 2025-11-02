import { useState } from "react";
import { Flex, Text, TextField, Button } from "@radix-ui/themes";

function LicenseInvalid({ handleSubmit, licenseStatus }) {
  const [licenseKey, setLicenseKey] = useState("");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      style={{ height: "100%", padding: "1rem" }}
    >
      <Text size="6" weight="bold">
        Activate License
      </Text>
      <Text size="2" color="gray">
        Enter your license key to continue.
      </Text>

      <TextField.Root
        placeholder="License key"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value)}
        style={{ width: "100%" }}
      />

      <Button
        onClick={() => handleSubmit(licenseKey)}
        variant="solid"
        highContrast
        loading={licenseStatus.loading}
        disabled={!licenseKey || licenseStatus.loading}
      >
        Submit
      </Button>
    </Flex>
  );
}

export default LicenseInvalid;
