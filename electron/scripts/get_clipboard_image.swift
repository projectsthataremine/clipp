import AppKit

// Get the image from the clipboard
guard let image = NSPasteboard.general.readObjects(forClasses: [NSImage.self], options: nil)?.first as? NSImage else {
    exit(1) // No image found
}

// Convert image to PNG data
guard let tiffData = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiffData),
      let pngData = bitmap.representation(using: .png, properties: [:]) else {
    exit(1) // Failed to convert
}

// Encode to base64 and print as data URL
let base64 = pngData.base64EncodedString()
print("data:image/png;base64,\(base64)")
