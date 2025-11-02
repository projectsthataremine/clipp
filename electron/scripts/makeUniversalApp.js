const { makeUniversalApp } = require("@electron/universal");
const path = require("path");

(async () => {
  const x64Path = path.resolve(__dirname, "../dist/mac/Clipp.app"); // ✅ fixed
  const arm64Path = path.resolve(__dirname, "../dist/mac-arm64/Clipp.app"); // ✅ fixed
  const universalPath = path.resolve(
    __dirname,
    "../dist/mac-universal/Clipp.app"
  );

  await makeUniversalApp({
    x64AppPath: x64Path,
    arm64AppPath: arm64Path,
    outAppPath: universalPath,
    force: true,
    x64ArchFiles: ["**/get_clipboard_image"],
  });

  console.log("✅ Created universal Clipp.app");
})();
