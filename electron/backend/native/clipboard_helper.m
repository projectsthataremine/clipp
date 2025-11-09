// Native macOS clipboard helper using new pasteboard privacy APIs
// Compile: clang -framework Cocoa -o clipboard_helper clipboard_helper.m

#import <Cocoa/Cocoa.h>
#import <Foundation/Foundation.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];

        // Use new detect API (macOS 15.4+) to check without triggering privacy alert
        if ([pasteboard respondsToSelector:@selector(detectValuesForClasses:options:completionHandler:)]) {
            // New API available - use detect method
            NSArray *classes = @[[NSURL class]];
            NSDictionary *options = @{};

            dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
            __block BOOL hasFiles = NO;

            [pasteboard detectValuesForClasses:classes
                                        options:options
                              completionHandler:^(BOOL detected) {
                hasFiles = detected;
                dispatch_semaphore_signal(semaphore);
            }];

            dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

            if (hasFiles) {
                // Now we know files exist, safe to read
                NSArray *urls = [pasteboard readObjectsForClasses:@[[NSURL class]] options:nil];
                if (urls && urls.count > 0) {
                    NSMutableArray *paths = [NSMutableArray array];
                    for (NSURL *url in urls) {
                        if ([url isFileURL]) {
                            [paths addObject:[url path]];
                        }
                    }

                    if (paths.count > 0) {
                        // Output as JSON array
                        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:paths options:0 error:nil];
                        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                        printf("%s\n", [jsonString UTF8String]);
                        return 0;
                    }
                }
            }
        } else {
            // Fallback for older macOS - try direct read
            NSArray *urls = [pasteboard readObjectsForClasses:@[[NSURL class]] options:nil];
            if (urls && urls.count > 0) {
                NSMutableArray *paths = [NSMutableArray array];
                for (NSURL *url in urls) {
                    if ([url isFileURL]) {
                        [paths addObject:[url path]];
                    }
                }

                if (paths.count > 0) {
                    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:paths options:0 error:nil];
                    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                    printf("%s\n", [jsonString UTF8String]);
                    return 0;
                }
            }
        }

        // No files found
        printf("[]\n");
    }
    return 0;
}
