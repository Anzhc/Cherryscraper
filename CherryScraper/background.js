console.log('Background script loaded!');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 1) Check the action
    if (request.action === 'gatherData') {
        console.log(request.data.tags);

        // We do async storage + async download, so return true.
        chrome.storage.sync.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            chrome.downloads.download({
                url: request.data.imageUrl,
                filename: downloadDirectory + request.data.imageName
            }, function(downloadId) {
                if (request.data.imageUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(request.data.imageUrl);
                }
                // Once the image download has started, get the filename asynchronously
                chrome.downloads.search({ id: downloadId }, function(results) {
                    if (results && results.length > 0) {
                        let filename = results[0].filename;
                        console.log(filename);
                    }
                    // Finally respond so the content script sees no error
                    sendResponse({ success: true, message: 'Image downloaded for gatherData' });
                });
            });
        });
        return true;  // Tells Chrome: "We'll sendResponse() asynchronously."
    }

    else if (request.action === 'downloadTags') {
        // Also does async storage + chrome.downloads, so we’ll return true
        chrome.storage.sync.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            chrome.downloads.download({
                url: request.tagsUrl,
                filename: downloadDirectory + request.tagsFilename
            }, function(downloadId) {
                if (typeof URL.revokeObjectURL === 'function') {
                    URL.revokeObjectURL(request.tagsUrl);
                  }

                const handleChanged = function(delta) {
                    if (delta.id === downloadId && delta.state && delta.state.current === "complete") {
                        if (request.closeAfterDownload) {
                            chrome.tabs.remove(request.tabId);
                        }
                        chrome.downloads.onChanged.removeListener(handleChanged);
                    }
                };
                chrome.downloads.onChanged.addListener(handleChanged);

                // Respond once the download has begun
                sendResponse({ success: true, message: 'Tags file download started' });
            });
        });
        return true;  // keep message channel open

    }

    else if (request.action === 'getTabId') {
        // This one is synchronous, so just send response directly
        sendResponse({ tabId: sender.tab.id });
        // No need to return true if we’re not doing anything async here
    }
});


// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(function(activeInfo) {
    // Get the URL of the new active tab
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (tab.url) {
            chrome.storage.sync.get(['siteList',  'automaticDownload'], function(data) {
                let matchingSite = data.siteList.find(site => tab.url.includes(site));
                if (matchingSite && data.automaticDownload) {
                    chrome.storage.sync.set({ selectedSite: matchingSite });

                    // Optionally auto-scrape:
                    // chrome.tabs.sendMessage(activeInfo.tabId, {
                    //     action: "gatherData",
                    //     automaticDownload: data.automaticDownload
                    // });
                }
            });
        }
    });
});