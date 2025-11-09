const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config();

const arch = process.env.ARCH;

module.exports = {
  appId: "com.tryclipp.app",
  productName: "Clipp",
  mac: {
    icon: "build/icons/icon.icns",
    gatekeeperAssess: false,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
  },
  dmg: {
    background: "build/dmg-background.png",
    window: {
      width: 540,
      height: 380,
    },
    contents: [
      {
        x: 160,
        y: 180,
      },
      {
        x: 380,
        y: 180,
        type: "link",
        path: "/Applications",
      },
    ],
  },
  // we need to sign the app after building to avoid issues with notarization
  afterSign: async (context) => {
    const appPath = context.appOutDir;
    const appName = context.packager.appInfo.productFilename;

    const fullAppPath = path.join(appPath, `${appName}.app`);

    execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
  },
  files: ["backend/**", "frontend/dist/**/*", "package.json"],
  asarUnpack: ["**/get_clipboard_image.*"],
  extraFiles: [
    {
      from: `backend/native/get_clipboard_image.${arch}`,
      to: `get_clipboard_image.${arch}`,
    },
  ],
  publish: [
    {
      provider: "github",
      owner: "projectsthataremine",
      repo: "clipp",
    },
  ],
};
