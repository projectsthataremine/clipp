// Native macOS clipboard helper v2 - reads clipboard when triggered by user action
// Compile: clang -framework Cocoa -framework Carbon -o clipboard_helper_v2 clipboard_helper_v2.m

#import <Cocoa/Cocoa.h>
#import <Carbon/Carbon.h>
#import <Foundation/Foundation.h>

// Try multiple methods to read clipboard files
void tryReadClipboard() {
    @autoreleasepool {
        NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];

        fprintf(stderr, "[DEBUG] Change count: %ld\n", (long)[pasteboard changeCount]);
        fprintf(stderr, "[DEBUG] Available types: %s\n", [[pasteboard.types description] UTF8String]);

        // Method 1: Try NSURL class
        fprintf(stderr, "[DEBUG] Method 1: Reading NSURL objects...\n");
        NSArray *urls = [pasteboard readObjectsForClasses:@[[NSURL class]]
                                                   options:@{NSPasteboardURLReadingFileURLsOnlyKey: @YES}];
        if (urls && urls.count > 0) {
            fprintf(stderr, "[DEBUG] Found %lu URLs via NSURL\n", (unsigned long)urls.count);
            NSMutableArray *paths = [NSMutableArray array];
            for (NSURL *url in urls) {
                if ([url isFileURL]) {
                    [paths addObject:[url path]];
                    fprintf(stderr, "[DEBUG]   - %s\n", [[url path] UTF8String]);
                }
            }

            if (paths.count > 0) {
                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:paths options:0 error:nil];
                NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                printf("%s\n", [jsonString UTF8String]);
                return;
            }
        }

        // Method 2: Try reading NSFilenamesPboardType (legacy)
        fprintf(stderr, "[DEBUG] Method 2: Reading NSFilenamesPboardType...\n");
        NSArray *types = [pasteboard types];
        if ([types containsObject:NSFilenamesPboardType]) {
            NSArray *files = [pasteboard propertyListForType:NSFilenamesPboardType];
            if (files && files.count > 0) {
                fprintf(stderr, "[DEBUG] Found %lu files via NSFilenamesPboardType\n", (unsigned long)files.count);
                for (NSString *file in files) {
                    fprintf(stderr, "[DEBUG]   - %s\n", [file UTF8String]);
                }

                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:files options:0 error:nil];
                NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                printf("%s\n", [jsonString UTF8String]);
                return;
            }
        }

        // Method 3: Try public.file-url
        fprintf(stderr, "[DEBUG] Method 3: Reading public.file-url...\n");
        if ([types containsObject:@"public.file-url"]) {
            NSString *fileURL = [pasteboard stringForType:@"public.file-url"];
            if (fileURL && fileURL.length > 0) {
                fprintf(stderr, "[DEBUG] Found file URL: %s\n", [fileURL UTF8String]);
                NSURL *url = [NSURL URLWithString:fileURL];
                if (url && [url isFileURL]) {
                    NSString *path = [url path];
                    NSArray *paths = @[path];
                    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:paths options:0 error:nil];
                    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                    printf("%s\n", [jsonString UTF8String]);
                    return;
                }
            }
        }

        // Method 4: Check for NSPasteboardTypeFileURL
        fprintf(stderr, "[DEBUG] Method 4: Checking NSPasteboardTypeFileURL...\n");
        if ([types containsObject:(NSString *)kUTTypeFileURL]) {
            fprintf(stderr, "[DEBUG] Has kUTTypeFileURL\n");
        }

        fprintf(stderr, "[DEBUG] No files found by any method\n");
        printf("[]\n");
    }
}

int main(int argc, const char * argv[]) {
    // Read once immediately
    fprintf(stderr, "[DEBUG] === Reading clipboard ===\n");
    tryReadClipboard();

    return 0;
}
