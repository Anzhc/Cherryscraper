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
            chrome.downloads.download({url: request.tagsUrl, filename: downloadDirectory + request.tagsFilename}, function() {
                // Revoke the Data URL once the download has started.
                URL.revokeObjectURL(request.tagsUrl);
            });
        });
    }
});
// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log('Tab activation event detected');  // New log statement
    // Get the URL of the new active tab
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        console.log('Tab URL: ', tab.url);  // New log statement
        if (tab.url) {
            chrome.storage.sync.get('siteList', function(data) {
                console.log('Site list: ', data.siteList);  // New log statement
                let matchingSite = data.siteList.find(site => tab.url.includes(site));
                if (matchingSite) {
                    console.log('Matching site: ', matchingSite);  // New log statement
                    chrome.storage.sync.set({selectedSite: matchingSite});
                }
            });
        }
    });
});