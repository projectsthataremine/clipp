"use client";

import * as RadixUI from "@radix-ui/themes";

interface DownloadInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DownloadInstructionsModal({ open, onClose }: DownloadInstructionsModalProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <RadixUI.Dialog.Root open={open} onOpenChange={onClose}>
      <RadixUI.Dialog.Content style={{ maxWidth: 650 }}>
        <RadixUI.Dialog.Title>Download Instructions</RadixUI.Dialog.Title>

        {/* Quick Navigation */}
        <RadixUI.Flex gap="2" my="4">
          <RadixUI.Button
            size="2"
            variant="soft"
            onClick={() => scrollToSection('first-time')}
          >
            First-time Install
          </RadixUI.Button>
          <RadixUI.Button
            size="2"
            variant="soft"
            onClick={() => scrollToSection('updating')}
          >
            Updating
          </RadixUI.Button>
        </RadixUI.Flex>

        <RadixUI.ScrollArea style={{ height: 500 }}>
          <RadixUI.Flex direction="column" gap="5" pr="4">
            {/* First-time Installation */}
            <RadixUI.Box id="first-time">
              <RadixUI.Heading size="5" mb="3">First-time Installation</RadixUI.Heading>
              <RadixUI.Flex direction="column" gap="2" mb="4">
                <RadixUI.Text size="2" as="div">1. Once the download completes, open the .dmg file</RadixUI.Text>
                <RadixUI.Text size="2" as="div">2. Drag the Clipp app into your Applications folder</RadixUI.Text>
                <RadixUI.Text size="2" as="div">3. Launch Clipp from your Applications folder (not from the .dmg file)</RadixUI.Text>
              </RadixUI.Flex>

              {/* macOS Security Warning */}
              <RadixUI.Callout.Root color="red" mt="4">
                <RadixUI.Flex direction="column" gap="2">
                  <RadixUI.Text size="3" weight="bold" as="div">If macOS blocks Clipp</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">
                    When launching Clipp for the first time, macOS may show a security warning:
                  </RadixUI.Text>
                  <RadixUI.Text size="2" as="div">1. Click Done (not &quot;Move to Trash&quot;)</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">2. Open System Settings → Privacy & Security</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">3. Scroll down until you see &quot;Clipp was blocked&quot;</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">4. Click Open Anyway</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">5. Confirm by clicking Open in the final prompt</RadixUI.Text>
                </RadixUI.Flex>
              </RadixUI.Callout.Root>
            </RadixUI.Box>

            <RadixUI.Separator size="4" />

            {/* Updating Existing Installation */}
            <RadixUI.Box id="updating">
              <RadixUI.Heading size="5" mb="3">Updating Clipp</RadixUI.Heading>

              <RadixUI.Callout.Root color="orange" mb="4">
                <RadixUI.Callout.Text>
                  <RadixUI.Strong>Important:</RadixUI.Strong> Make sure Clipp is completely closed before updating
                </RadixUI.Callout.Text>
              </RadixUI.Callout.Root>

              <RadixUI.Heading size="4" mb="3">Step 1: Close Clipp</RadixUI.Heading>

              <RadixUI.Flex direction="column" gap="4" mb="4">
                <RadixUI.Box>
                  <RadixUI.Text size="2" weight="bold" mb="2" as="div">Option 1: Using the Tray Icon</RadixUI.Text>
                  <RadixUI.Text size="2" as="div" mb="1">
                    Click the Clipp icon in your menu bar (top-right of screen) and select Quit
                  </RadixUI.Text>
                  <RadixUI.Text size="2" as="div" style={{ color: 'var(--gray-11)' }}>
                    Don&apos;t see the icon? Hold Command and drag other menu bar icons to reveal hidden items
                  </RadixUI.Text>
                </RadixUI.Box>

                <RadixUI.Box>
                  <RadixUI.Text size="2" weight="bold" mb="2" as="div">Option 2: Using Activity Monitor</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">1. Open the Activity Monitor app</RadixUI.Text>
                  <RadixUI.Text size="2" as="div" style={{ color: 'var(--gray-11)', paddingLeft: '1rem' }}>
                    (Press Command + Space, search for &quot;Activity Monitor&quot;, and click it)
                  </RadixUI.Text>
                  <RadixUI.Text size="2" as="div">2. Search for Clipp in the top right search bar</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">3. Double-click it, then click Quit</RadixUI.Text>
                  <RadixUI.Text size="2" as="div">4. Confirm with Force Quit</RadixUI.Text>
                </RadixUI.Box>
              </RadixUI.Flex>

              <RadixUI.Separator size="4" my="4" />

              <RadixUI.Heading size="4" mb="3">Step 2: Install the Update</RadixUI.Heading>
              <RadixUI.Flex direction="column" gap="2">
                <RadixUI.Text size="2" as="div">1. Open the downloaded .dmg file</RadixUI.Text>
                <RadixUI.Text size="2" as="div">2. Drag Clipp into your Applications folder</RadixUI.Text>
                <RadixUI.Text size="2" as="div">3. Click Replace when asked</RadixUI.Text>
                <RadixUI.Text size="2" as="div">4. Launch Clipp from your Applications folder</RadixUI.Text>
              </RadixUI.Flex>
            </RadixUI.Box>
          </RadixUI.Flex>
        </RadixUI.ScrollArea>
      </RadixUI.Dialog.Content>
    </RadixUI.Dialog.Root>
  );
}
