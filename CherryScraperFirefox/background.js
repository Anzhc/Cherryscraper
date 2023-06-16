browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'gatherData') {
        console.log(request.data.tags); 

        // Get the download directory from storage.
        browser.storage.local.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            // Delay the start of the image download by 1 second
            setTimeout(function() {
                // Download the image.
                browser.downloads.download({url: request.data.imageUrl, filename: downloadDirectory + request.data.imageName}, function(downloadId) {
                    
                    // Once the image download has started, get the filename.
                    browser.downloads.search({id: downloadId}, function(results) {
                        if (results && results.length > 0) {
                            let filename = results[0].filename;
                            console.log('Image filename:', filename);  // Log the image filename
                        }
                    });
                });
            }, 100);
        });
    }
    else if (request.action === 'downloadTags') {
        // Get the download directory from storage.
        browser.storage.local.get('downloadDirectory', function(data) {
            let downloadDirectory = data.downloadDirectory ? data.downloadDirectory + '/' : '';

            // Create a Blob from the tags string and convert it into a Data URL.
            let tagsBlob = new Blob([request.tagsString], {type: 'text/plain'});
            let tagsUrl = URL.createObjectURL(tagsBlob);
            
            // Delay the start of the tag download by 2 seconds
            setTimeout(function() {
                // Download the tags.
                browser.downloads.download({url: tagsUrl, filename: downloadDirectory + request.tagsFilename}, function(downloadId) {
                    if (browser.runtime.lastError) {
                        console.error('Error downloading tags:', browser.runtime.lastError);
                        return;
                    }
                    
                    // Revoke the Data URL once the download has started.
                    URL.revokeObjectURL(tagsUrl);
                });
            }, 200);  
        });
    }
});

// Listen for when the active tab changes
browser.tabs.onActivated.addListener(function(activeInfo) {
    console.log('Tab activation event detected');  // New log statement
    // Get the URL of the new active tab
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let tab = tabs[0];
        console.log('Tab URL: ', tab.url);  // New log statement
        if (tab.url) {
            browser.storage.local.get('siteList', function(data) {
                console.log('Site list: ', data.siteList);  // New log statement
                let matchingSite = data.siteList.find(site => tab.url.includes(site));
                if (matchingSite) {
                    console.log('Matching site: ', matchingSite);  // New log statement
                    browser.storage.local.set({selectedSite: matchingSite});
                }
            });
        }
    });
});