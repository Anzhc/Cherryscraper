chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'gatherData') {
        console.log(request.data.tags); 

        // Get the download directory from storage.
        chrome.storage.sync.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            // Download the image.
            chrome.downloads.download({url: request.data.imageUrl, filename: downloadDirectory + request.data.imageName}, function(downloadId) {
                // Once the image download has started, get the filename.
                chrome.downloads.search({id: downloadId}, function(results) {
                    if (results && results.length > 0) {
                        let filename = results[0].filename;
                        console.log(filename);
                    }
                });
            });
        });
    }
    else if (request.action === 'downloadTags') {
        // Get the download directory from storage.
        chrome.storage.sync.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            // Download the tags.
            chrome.downloads.download({url: request.tagsUrl, filename: downloadDirectory + request.tagsFilename}, function(downloadId) {
                // Revoke the Data URL once the download has started.
                URL.revokeObjectURL(request.tagsUrl);

                // Listen for the onChanged event for this download.
                chrome.downloads.onChanged.addListener(function(delta) {
                    if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
                        // The download has completed. Close the tab if automaticDownload is enabled.
                        if (request.automaticDownload) {
                            chrome.tabs.remove(request.tabId);
                        }
                    }
                });
            });
        });
    }
    else if (request.action === 'getTabId') {
        sendResponse({tabId: sender.tab.id});
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
                    chrome.storage.sync.set({selectedSite: matchingSite});

                    // Send message to the content script to start scraping, include automaticDownload in the message.
                    // chrome.tabs.sendMessage(activeInfo.tabId, {action: "gatherData", automaticDownload: data.automaticDownload});
                }
            });
        }
    });
});

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.storage.sync.get(['siteList', 'automaticDownload'], function(data) {
            let matchingSite = data.siteList.find(site => tab.url.includes(site));
            if (matchingSite && data.automaticDownload) {
                chrome.storage.sync.set({selectedSite: matchingSite});

                // Send message to the content script to start scraping, include automaticDownload in the message.
                // chrome.tabs.sendMessage(tabId, {action: "gatherData", automaticDownload: data.automaticDownload});
            }
        });
    }
});