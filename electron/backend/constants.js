const SUPPORTED_PLATFORMS = {
  MAC: "darwin",
  WINDOWS: "win32",
  LINUX: "linux",
};

const INTERNAL_CLIPBOARD_TYPES = {
  TEXT: "text",
  CLIPBOARD_IMAGE: "clipboard-image",
  IMAGE: "image",
  MULTI_IMAGE: "multi-image",
  AUDIO: "audio",
  MULTI_AUDIO: "multi-audio",
  FILE: "file",
  MULTI_FILE: "multi-file",
};

const EDGE_FUNCTION_SECRET = "G2GIzUxKFLVWUYivNlQ/RdtW1xT63IBh1eoDmqrQLfI=";
const PUBLIC_LICENSE_KEY =
  "MCowBQYDK2VwAyEA5fzHxDXJV2539FGaMkU0c0W2rBhhrWt/YOhnO4tvkIM=";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://jijhacdgtccfftlangjq.supabase.co";

module.exports = {
  SUPPORTED_PLATFORMS,
  INTERNAL_CLIPBOARD_TYPES,
  PUBLIC_LICENSE_KEY,
  EDGE_FUNCTION_SECRET,
  SUPABASE_URL,
};
