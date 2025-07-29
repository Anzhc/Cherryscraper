async function prepareImageUrl(imageUrl) {
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
    return imageUrl;
}

const scrapeAction = function() {
    gatherData(async function(data) {
        console.log(data);
        data.imageUrl = await prepareImageUrl(data.imageUrl);
        chrome.storage.sync.get(['automaticDownload', 'closeAfterDownload'], function(settings) {
            {
                // Normal approach for other sites
                chrome.runtime.sendMessage({
                    action: 'gatherData',
                    data: data,
                    automaticDownload: settings.automaticDownload
                });
            }

            // Next, send tags to background the same way as before
            chrome.runtime.sendMessage({action: 'getTabId'}, function(response) {
                let tagsBlob = new Blob([data.tags.join(',')], {type: 'text/plain'});
                let tagsUrl = URL.createObjectURL(tagsBlob);
                let tagsFilename = data.imageName.replace(/\.[^.]*$/, '.txt');

                chrome.runtime.sendMessage({
                    action: 'downloadTags',
                    tagsUrl: tagsUrl,
                    tagsFilename: tagsFilename,
                    closeAfterDownload: settings.closeAfterDownload,
                    automaticDownload: settings.automaticDownload,
                    tabId: response.tabId
                });
            });
        });
    });
};

const fallbackScrapeAction = function() {
    let data = gatherDataFallback();
    if (!data) { return; }
    chrome.storage.sync.get(['automaticDownload', 'closeAfterDownload'], async function(settings) {
        data.imageUrl = await prepareImageUrl(data.imageUrl);
        chrome.runtime.sendMessage({
            action: 'gatherData',
            data: data,
            automaticDownload: settings.automaticDownload
        });

        chrome.runtime.sendMessage({action: 'getTabId'}, function(response) {
            let tagsBlob = new Blob([data.tags.join(',')], {type: 'text/plain'});
            let tagsUrl = URL.createObjectURL(tagsBlob);
            let tagsFilename = data.imageName.replace(/\.[^.]*$/, '.txt');

            chrome.runtime.sendMessage({
                action: 'downloadTags',
                tagsUrl: tagsUrl,
                tagsFilename: tagsFilename,
                closeAfterDownload: settings.closeAfterDownload,
                automaticDownload: settings.automaticDownload,
                tabId: response.tabId
            });
        });
    });
};
// This function creates a button and adds it to the page.
function addButton() {
    let button = document.createElement('button');
    button.textContent = '';
    button.style.position = 'fixed';
    button.style.bottom = '1px';
    button.style.left = '1px';
    button.style.zIndex = 1000;

    // Add the event listener to the button. When clicked, choose between
    // the normal scrapeAction or the fallbackScrapeAction based on the
    // current setting.
    button.addEventListener('click', function() {
        chrome.storage.sync.get('fallbackDownload', function(data) {
            if (data.fallbackDownload) {
                fallbackScrapeAction();
            } else {
                scrapeAction();
            }
        });
    });

    // Add a keypress event listener to the document.
    document.addEventListener('keypress', function(e) {
        // Check if the pressed key is "c".
        if (e.key === 'c') {
            chrome.storage.sync.get('fallbackDownload', function(data) {
                if (data.fallbackDownload) {
                    fallbackScrapeAction();
                } else {
                    scrapeAction();
                }
            });
        }
    });

    document.body.appendChild(button);
}

// Add an event listener to execute the scrapeAction when the page is fully loaded.
window.addEventListener('load', function() {
    chrome.storage.sync.get(['automaticDownload', 'closeAfterDownload', 'fallbackDownload'], function(data) {
        if (data.fallbackDownload) {
            // When fallback mode is enabled, only run the fallback method.
            fallbackScrapeAction();
        } else if (data.automaticDownload) {
            scrapeAction();
        }
    });
});
// This function checks whether the user has enabled the button and adds it to the page if so.
chrome.storage.sync.get('buttonEnabled', function(data) {
    if (data.buttonEnabled) {
        addButton();
    }
});
// Helper function to generate a random name
function generateRandomName(minLength, maxLength) {
    let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}
// Define a function for gathering data from Danbooru.
function gatherDataDanbooru() {
    try {
        // Select elements based on attribute.
        let tagElements = document.querySelectorAll('[data-tag-name]');
        let tags = Array.from(tagElements).map(el => el.getAttribute('data-tag-name'));

        // Danbooru's layout may vary. Try a few selectors to locate the main image.
        let imageElement = document.querySelector('#image') ||
                           document.querySelector('.image-container picture img') ||
                           document.querySelector('.image-container img');

        if (!imageElement) {
            console.warn('Could not find image element on Danbooru page');
            return null;
        }

        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDanbooru:', error);  // Log any unexpected errors.
        return null;
    }
}

function gatherDataSafebooru() {
    try {
        // Select elements based on classes.
        let tagElementsGeneral = document.querySelectorAll('.tag-type-general a');
        let tagElementsCharacter = document.querySelectorAll('.tag-type-character a');
        let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata a');

        // Combine all tags into a single array.
        let tags = Array.from(tagElementsGeneral).map(el => el.textContent);
        tags = tags.concat(Array.from(tagElementsCharacter).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsMetadata).map(el => el.textContent));

        let imageElement = document.querySelector('img#image');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataSafebooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataSafebooru:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataTbib() {
    try {
        // Select elements based on attribute.
        let tagElementsCopyright = document.querySelectorAll('.tag-type-copyright.tag a');
        let tagElementsCharacter = document.querySelectorAll('.tag-type-character.tag a');
        let tagElementsArtist = document.querySelectorAll('.tag-type-artist.tag a');
        let tagElementsGeneral = document.querySelectorAll('.tag-type-general.tag a');
        let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata.tag a');

        // Combine all tags into a single array.
        let tags = Array.from(tagElementsGeneral).map(el => el.textContent);
        tags = tags.concat(Array.from(tagElementsCharacter).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsMetadata).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsCopyright).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsArtist).map(el => el.textContent));

        let imageElement = document.querySelector('.content img');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataTbib data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataTbib:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataDerpibooru() {
    try {
        // Select elements based on class.
        let tagElements = document.querySelectorAll('.tag__name');
        let tags = Array.from(tagElements).map(el => el.textContent);

        let imageElement = document.querySelector('.image-show-container .image-target.image-show.spoiler-pending picture img');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataDerpibooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDerpibooru:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataRule34() {
    try {
        // Optional check: ensure we are on a post page
        if (window.location.href.includes('index.php?page=post&s=view')) {
            console.log("We are on a page matching `index.php?page=post&s=view`");

            let tagElementsGeneral = document.querySelectorAll('.tag-type-general.tag');
            let tagsGeneral = Array.from(tagElementsGeneral).map(li => li.querySelectorAll('a')[1].textContent);
            
            let tagElementsCharacter = document.querySelectorAll('.tag-type-character.tag');
            let tagsCharacter = Array.from(tagElementsCharacter).map(li => li.querySelectorAll('a')[1].textContent);
            
            let tagElementsArtist = document.querySelectorAll('.tag-type-artist.tag');
            let tagsArtist = Array.from(tagElementsArtist).map(li => li.querySelectorAll('a')[1].textContent);
            
            let tagElementsCopyright = document.querySelectorAll('.tag-type-copyright.tag');
            let tagsCopyright = Array.from(tagElementsCopyright).map(li => li.querySelectorAll('a')[1].textContent);
            
            let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata.tag');
            let tagsMetadata = Array.from(tagElementsMetadata).map(li => li.querySelectorAll('a')[1].textContent);
            
            // Combine all tags into a single array
            let tags = [...tagsGeneral, ...tagsCharacter, ...tagsArtist, ...tagsCopyright, ...tagsMetadata];

            let imageElement = document.querySelectorAll('.content img');
            let imageUrl;
            for (let i = 0; i < imageElement.length; i++) {
                if (imageElement[i]?.alt != "") imageUrl = imageElement[i].src;
            }
            // Extract the image name from the URL
            let imageName = imageUrl.split('/').pop().split('?')[0];

            let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
            console.log('gatherDataRule34 data:', data);  // Log the entire data object.

            return data;
        }
    } catch (error) {
        console.error('Error in gatherDataRule34:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataSankakucomplex() {
    try {
        let tagElementsGeneral = document.querySelectorAll('.tag-type-general');
        let tagsGeneral = Array.from(tagElementsGeneral).map(li => li.querySelectorAll('a')[0].textContent);
        
        let tagElementsCharacter = document.querySelectorAll('.tag-type-character');
        let tagsCharacter = Array.from(tagElementsCharacter).map(li => li.querySelectorAll('a')[0].textContent);
        
        let tagElementsArtist = document.querySelectorAll('.tag-type-artist');
        let tagsArtist = Array.from(tagElementsArtist).map(li => li.querySelectorAll('a')[0].textContent);
        
        let tagElementsCopyright = document.querySelectorAll('.tag-type-copyright');
        let tagsCopyright = Array.from(tagElementsCopyright).map(li => li.querySelectorAll('a')[0].textContent);
        
        let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata');
        let tagsMetadata = Array.from(tagElementsMetadata).map(li => li.querySelectorAll('a')[0].textContent);
        
        // Combine all tags into a single array
        let tags = [...tagsGeneral, ...tagsCharacter, ...tagsArtist, ...tagsCopyright, ...tagsMetadata];
        // Combine all tags into a single array.
        let imageElement = document.querySelector('#post-content img:last-child');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataSankakucomplex data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataSankakucomplex:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataGelbooru() {
    try {
        let tagElementsGeneral = document.querySelectorAll('.tag-type-general');
        let tagsGeneral = Array.from(tagElementsGeneral).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsCharacter = document.querySelectorAll('.tag-type-character');
        let tagsCharacter = Array.from(tagElementsCharacter).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsArtist = document.querySelectorAll('.tag-type-artist');
        let tagsArtist = Array.from(tagElementsArtist).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsCopyright = document.querySelectorAll('.tag-type-copyright');
        let tagsCopyright = Array.from(tagElementsCopyright).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata');
        let tagsMetadata = Array.from(tagElementsMetadata).map(li => li.querySelectorAll('a')[1].textContent);
        
        // Combine all tags into a single array
        let tags = [...tagsGeneral, ...tagsCharacter, ...tagsArtist, ...tagsCopyright, ...tagsMetadata];
        // Combine all tags into a single array.
        let imageElement = document.querySelector('.image-container.note-container picture img');
        let imageUrl = imageElement ? imageElement.src : null;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataGelbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataGelbooru:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataYandere() {
    try {
        let tagElementsGeneral = document.querySelectorAll('.tag-type-general');
        let tagsGeneral = Array.from(tagElementsGeneral).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsCharacter = document.querySelectorAll('.tag-type-character');
        let tagsCharacter = Array.from(tagElementsCharacter).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsArtist = document.querySelectorAll('.tag-type-artist');
        let tagsArtist = Array.from(tagElementsArtist).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsCopyright = document.querySelectorAll('.tag-type-copyright');
        let tagsCopyright = Array.from(tagElementsCopyright).map(li => li.querySelectorAll('a')[1].textContent);
        
        let tagElementsMetadata = document.querySelectorAll('.tag-type-metadata');
        let tagsMetadata = Array.from(tagElementsMetadata).map(li => li.querySelectorAll('a')[1].textContent);
        
        // Combine all tags into a single array
        let tags = [...tagsGeneral, ...tagsCharacter, ...tagsArtist, ...tagsCopyright, ...tagsMetadata];
        // Combine all tags into a single array.
        let imageElement = document.querySelector('.content img');
        let imageUrl = imageElement ? imageElement.src : null;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataYandere data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataYandere:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataE621() {
    try {
        let tagElementsGeneral = document.querySelectorAll('.general-tag-list .category-0');
        let tagsGeneral = Array.from(tagElementsGeneral).map(li => li.querySelectorAll('a')[3].textContent);
        
        let tagElementsCharacter = document.querySelectorAll('.character-tag-list .category-4');
        let tagsCharacter = Array.from(tagElementsCharacter).map(li => li.querySelectorAll('a')[3].textContent);
        
        let tagElementsArtist = document.querySelectorAll('.artist-tag-list .category-1');
        let tagsArtist = Array.from(tagElementsArtist).map(li => li.querySelectorAll('a')[3].textContent);

        let tagElementsSpecies = document.querySelectorAll('.species-tag-list .category-5');
        let tagsSpecies = Array.from(tagElementsSpecies).map(li => li.querySelectorAll('a')[3].textContent);
        
        let tagElementsCopyright = document.querySelectorAll('.copyright-tag-list .category-3');
        let tagsCopyright = Array.from(tagElementsCopyright).map(li => li.querySelectorAll('a')[3].textContent);
        
        let tagElementsMetadata = document.querySelectorAll('.meta-tag-list .category-7');
        let tagsMetadata = Array.from(tagElementsMetadata).map(li => li.querySelectorAll('a')[3].textContent);
        
        // Combine all tags into a single array
        let tags = [...tagsGeneral, ...tagsCharacter, ...tagsArtist, ...tagsSpecies, ...tagsCopyright, ...tagsMetadata];
        // Combine all tags into a single array.
        let imageElement = document.querySelector('#image-container img');
        let imageUrl = imageElement ? imageElement.src : null;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataE621 data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataE621:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataRealbooru() {
    try {
        // Select elements based on attribute.
        let tagElementsModel = document.querySelectorAll('a.model');
        let tagElementsGeneral = document.querySelectorAll('a.tag-type-general');
        
        // Combine all tags into a single array.
        let tags = Array.from(tagElementsGeneral).map(el => el.textContent);
        tags = tags.concat(Array.from(tagElementsModel).map(el => el.textContent));

        let imageElement = document.querySelector('.imageContainer img');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataRealbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataRealbooru:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataChounyuu() {
    try {
        // Select elements based on attribute.
        let tagElementsDefault = document.querySelectorAll('.tags a.tag.tag-default');
        let tagElementsCopyright = document.querySelectorAll('.tags a.tag.tag-copyright');
        let tagElementsArtist = document.querySelectorAll('.tags a.tag.tag-artist');
        let tagElementsCharacter = document.querySelectorAll('.tags a.tag.tag-character');
        
        // Combine all tags into a single array.
        let tags = Array.from(tagElementsDefault).map(el => el.textContent);
        tags = tags.concat(Array.from(tagElementsCopyright).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsArtist).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsCharacter).map(el => el.textContent));

        let imageElement = document.querySelector('.image_box_image img');
        let imageUrl = imageElement.src;

        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];
        

        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName};
        console.log('gatherDataChounyuu data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataChounyuu:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataYandex() {
    try {
        // Select elements based on attribute.
        let tagElementsDefault = document.querySelectorAll('.MMOrganicSnippet-Text');
            
        // Combine all tags into a single array.
        let tags = Array.from(tagElementsDefault).map(el => el.textContent);
    
        let imageElement = document.querySelector('.SwipeImage.MMImageWrapper .MMImage-Origin');
        let imageUrl = imageElement.src;
    
        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];
    
        // Check if the image name is 'i' or starts with '6CL1u' and assign a random name with .png extension
        if (!imageName.includes('.')) {
            imageName = generateRandomName(16, 32) + '.png';
        }
        
        // Assign the tags file name as the same name with .txt extension
        let tagsFilename = imageName.replace('.png', '.txt');
    
        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName, tagsFilename: tagsFilename};
        console.log('gatherDataYandex data:', data);  // Log the entire data object.
    
        return data;
    } catch (error) {
        console.error('Error in gatherDataYandex:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataNozomi() {
    try {
        // Select elements based on attribute.
        let tagElementsCharacter = document.querySelectorAll('a.character');
        let tagElementsCopyright = document.querySelectorAll('a.copyright');
        let tagElementsGeneral = document.querySelectorAll('a.general');
        let tagElementsArtist = document.querySelectorAll('a.artist');
        
        // Combine all tags into a single array.
        let tags = Array.from(tagElementsGeneral).map(el => el.textContent);
        tags = tags.concat(Array.from(tagElementsCopyright).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsArtist).map(el => el.textContent));
        tags = tags.concat(Array.from(tagElementsCharacter).map(el => el.textContent));
    
        let imageElement = document.querySelector('.container .post img');
        let imageUrl = imageElement.src;
    
        // Extract the image name from the URL
        let imageName = imageUrl.split('/').pop().split('?')[0];
        
        // Assign the tags file name as the same name with .txt extension
        let tagsFilename = imageName.replace(/\.[^.]*$/, '.txt');
    
        let data = {tags: tags, imageUrl: imageUrl, imageName: imageName, tagsFilename: tagsFilename};
        console.log('gatherDataNozomi data:', data);  // Log the entire data object.
        return data;
    } catch (error) {
        console.error('Error in gatherDataNozomi:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataKnowYourMeme() {
    try {
        // Select the anchor element within the specified div.
        let anchorElement = document.querySelector('#photo_wrapper a');

        // Check if the anchor element exists to avoid a null reference error.
        if (!anchorElement) {
            console.warn('No anchor element found');
            return null;
        }

        // Get the title attribute from the anchor element.
        let title = anchorElement.title;

        // Select the image element within the specified div.
        let imageElement = document.querySelector('#photo_wrapper a img');

        // Check if the image element exists to avoid a null reference error.
        if (!imageElement) {
            console.warn('No image element found');
            return null;
        }

        // Get the image URL and alternative text.
        let imageUrl = imageElement.src;
        let imageName = generateRandomName(16, 32) + '.png';

        // Assume that you still want to gather tags, but correct the selector.
        let tagElementsDefault = document.querySelectorAll('#photo_wrapper .tag'); // Assuming tags have a class of 'tag'.
        let tags = Array.from(tagElementsDefault).map(el => el.textContent);

        // Include the title as one of the tags.
        tags.push(title);

        // Assign the tags file name as the same name with .txt extension
        let tagsFilename = imageName.replace('.png', '.txt');

        let data = {
            tags: tags,
            imageUrl: imageUrl,
            imageName: imageName,
            tagsFilename: tagsFilename
        };
        
        console.log('gatherDataKnowYourMeme data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataKnowYourMeme:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataPinterest() {
    try {

        // Select the second image inside a div with data-test-id='closeup-image'
        let imageElements = document.querySelectorAll('div[data-test-id="closeup-image"] img');
        let imageUrl = imageElements.length > 1 ? imageElements[1].src : null; // Select the second image

        // Generate a random image name (ensure generateRandomName is defined)
        let imageName = imageUrl ? (generateRandomName(16, 32) + '.png') : null;

        let data = { imageUrl: imageUrl, imageName: imageName };
        console.log('gatherDataPinterest data:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataPinterest:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataMetmuseum() {
    try {
        // Select the first image inside a div with role 'presentation'
        let imageElement = document.querySelector('#artwork__image__wrapper img');
        let imageUrl = imageElement ? imageElement.src : null;

        // Assuming generateRandomName is correctly defined
        let imageName = (generateRandomName(16, 32) + '.png');

        let data = { imageUrl: imageUrl, imageName: imageName };
        console.log('gatherDataMetmuseum data:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataMetmuseum:', error);
        return null;
    }
}
function gatherDataCivitai() {
    try {
        // Select the first image element with the specified class.
        let imageElement = document.querySelector('img.mantine-it6rft');

        // Check if the image element exists to avoid a null reference error.
        if (!imageElement) {
            console.warn('No image with specified class found');
            return null;
        }

        // Get the image URL.
        let imageUrl = imageElement.src;

        // Extract the image name from the URL.
        let imageName = imageUrl.split('/').pop().split('?')[0];

        // Optionally get tags from the alt text if it exists.
        let altText = imageElement.alt;
        let tags = altText ? altText.split(' ') : [];

        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: tags
        };

        console.log('gatherDataCivitai data:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in gatherDataCivitai:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataWallhaven() {
    try {
        // Select the image element with the specified ID.
        let imageElement = document.getElementById('wallpaper');

        // Check if the image element exists to avoid a null reference error.
        if (!imageElement) {
            console.warn('No image with ID "wallpaper" found');
            return null;
        }

        // Get the image URL.
        let imageUrl = imageElement.src;

        // Extract the image name from the URL.
        let imageName = imageUrl.split('/').pop().split('?')[0];

        // Select all tag elements with the specified class.
        let tagElements = document.querySelectorAll('a.tagname');

        // Collect plaintext from all tag elements.
        let tags = [];
        tagElements.forEach(tagElement => {
            tags.push(tagElement.textContent.trim());
        });

        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: tags
        };

        console.log('gatherDataWallhaven data:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in gatherDataWallhaven:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataPexels() {
    try {
        // Optional check: ensure we are on pexels.com/photo/ URL
        if (!/pexels\.com\/photo\//.test(window.location.href)) {
            console.warn('Not on a Pexels /photo/ page; skipping scrape.');
            return null;
        }

        // 1. Find the container <div> whose class starts with "PhotoZoom"
        let container = document.querySelector('div[class^="PhotoZoom"]');
        if (!container) {
            console.warn('No <div> with class starting "PhotoZoom" found on this Pexels photo page.');
            return null;
        }

        // 2. Locate the <img> within that container that has a srcset
        let imageElement = container.querySelector('img[srcset]');
        if (!imageElement) {
            console.warn('No <img> with srcset found inside the PhotoZoom container.');
            return null;
        }

        // 3. Extract the last (largest) image link from srcset
        let srcsetList = imageElement.getAttribute('srcset').split(',');
        let lastSrcsetItem = srcsetList[srcsetList.length - 1].trim();
        let fullSizeUrl = lastSrcsetItem.split(' ')[0];  // e.g. https://images.pexels.com/...some.jpeg?...
        let imageUrl = fullSizeUrl.split('?')[0];        // Strip query parameters

        // 4. Extract a filename from this URL
        let imageName = imageUrl.split('/').pop();

        // 5. Find the first <h1> with a title attribute for caption
        let captionElement = document.querySelector('h1[title]');
        let caption = captionElement ? captionElement.getAttribute('title').trim() : '';

        // 6. Put caption into tags array
        let tags = [caption];

        let data = {
            imageUrl,
            imageName,
            tags
        };

        console.log('Scraped data from Pexels:', data);
        return data;

    } catch (error) {
        console.error('Error in gatherDataPexels:', error);
        return null;
    }
}
function gatherDataKemono() {
    try {
        // Optional check: ensure we are on kemono.su(party)/data/ URL
        if (!/^https?:\/\/n\d+\.kemono\.(?:su|party)\/data\//.test(window.location.href)) {
            console.warn('Not on https://nX.kemono.su/data/ or https://nX.kemono.party/data/ page; skipping scrape.');
            return null;
        }

        // 1. Find the only <img> on the page
        let imageElement = document.querySelector('img');
        if (!imageElement) {
            console.warn('No <img> found on the page; cannot gather data.');
            return null;
        }

        // 2. Extract its src
        let imageUrl = imageElement.src;
        if (!imageUrl) {
            console.warn('The <img> has no src; cannot gather data.');
            return null;
        }

        // 3. Get file name from URL, removing query parameters if any
        let imageName = imageUrl.split('/').pop().split('?')[0];

        // 4. No caption or other tags, so just provide an empty array
        let tags = [];

        // 5. Return the data object
        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: tags
        };
        console.log('gatherDataKemono data:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataKemono:', error);
        return null;
    }
}
function gatherDataShotdeck() {
    try {
        // 1. Verify we are on shotdeck.com/browse/stills (start of URL)
        if (!/^https?:\/\/shotdeck\.com\/browse\/stills/.test(window.location.href)) {
            console.warn('Not on https://shotdeck.com/browse/stills...; skipping scrape.');
            return null;
        }

        // 2. Find the div#hero, the anchor inside it, and then the <img id="shot_details_hero">
        let heroDiv = document.getElementById('hero');
        if (!heroDiv) {
            console.warn('No div with id="hero" found; skipping scrape.');
            return null;
        }

        let anchorElement = heroDiv.querySelector('a');
        if (!anchorElement) {
            console.warn('No <a> found inside #hero; skipping scrape.');
            return null;
        }

        let imageElement = anchorElement.querySelector('img#shot_details_hero');
        if (!imageElement) {
            console.warn('No <img id="shot_details_hero"> found inside the anchor; skipping scrape.');
            return null;
        }

        // 3. Adjust the image src from /thumb/small_... to get the full image
        let thumbSrc = imageElement.src;
        let imageUrl = thumbSrc.replace('/thumb/small_', '/');

        // Derive the file name (removing query params if any)
        let imageName = imageUrl.split('/').pop().split('?')[0];

        // 4. Collect tags from .detail-group where p.detail-type is among the desired categories
        //    (We've commented out 'Lighting Type:' for now.)
        let wantedCategories = [
            'Tags:',
            'Actors:',
            'Color:',
            'Shot Type:',
            'Composition:',
            'Lighting:',
            // 'Lighting Type:',  // commented out
            'Time of Day:',
            'Set:'
        ];

        let tags = [];
        let detailGroups = document.querySelectorAll('.detail-group');

        // Helper to transform shot-type tags
        function transformShotTypeTag(rawTag) {
            if (rawTag === 'Aerial') {
                return 'Aerial view';
            } else if (rawTag === 'Clean single') {
                return 'Clean single shot';
            }
            // Add more special cases if needed
            return rawTag; // else return unchanged
        }
        function transformCompositionTypeTag(rawTag) {
            if (rawTag === 'Center') {
                return 'Centered composition';
            } else if (rawTag === 'Left heavy') {
                return 'Left heavy composition';

            } else if (rawTag === 'Right heavy') {
                return 'Right heavy composition';

            } else if (rawTag === 'Balanced') {
                return 'Balanced composition';

            } else if (rawTag === 'Symmetrical') {
                return 'Symmetrical composition';

            } else if (rawTag === 'Short side') {
                return 'Short side composition';
            };
            // Add more special cases if needed
            return rawTag; // else return unchanged
        }

        detailGroups.forEach(group => {
            let detailTypeP = group.querySelector('p.detail-type');
            if (!detailTypeP) return;

            let detailTypeText = detailTypeP.textContent.trim();

            // If the detail type is one of the categories we want to collect
            if (wantedCategories.includes(detailTypeText)) {
                // Gather all <a> text in the sibling .details container
                let anchors = group.querySelectorAll('.details a');
                anchors.forEach(a => {
                    let rawTag = a.textContent.trim();
                    let finalTag = rawTag;

                    // Customize based on which detail-type we have
                    if (detailTypeText === 'Shot Type:') {
                        finalTag = transformShotTypeTag(rawTag);
                    } 
                    else if (detailTypeText === 'Color:') {
                        // Skip appending "theme" for "Saturated" or "Desaturated"
                        if (rawTag !== 'Saturated' && rawTag !== 'Desaturated') {
                            finalTag = rawTag + ' theme';
                        }
                    }
                    else if (detailTypeText === 'Composition:') {
                        finalTag = transformCompositionTypeTag(rawTag);
                    } 
                    // else if (detailTypeText === 'Lighting Type:') { ... } // still commented out

                    // Add finalTag to our tags array
                    tags.push(finalTag);
                });
            }
        });

        let data = {
            imageUrl,
            imageName,
            tags
        };

        console.log('Scraped data from Shotdeck:', data);
        return data;
    } catch (error) {
        console.error('Error in gatherDataShotdeck:', error);
        return null;
    }
}
function gatherDataPixiv() {
    try {
        // 1. Confirm we are on i.pximg.net
        if (!/^https?:\/\/i\.pximg\.net\//.test(window.location.href)) {
            return null;
        }

        // 2. Find the single <img> in the document
        let imageElement = document.querySelector('img');
        if (!imageElement) {
            console.warn('No <img> found on this page.');
            return null;
        }

        // 3. Extract the full URL
        let imageUrl = imageElement.src;
        // 4. Build a filename from the last path segment (remove query if any)
        let imageName = imageUrl.split('/').pop().split('?')[0];
        
        // 5. Return data with an empty tags array
        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: []
        };
        console.log('Scraped data from i.pximg.net direct-view page:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataPixiv:', error);
        return null;
    }
}

function gatherDataFallback() {
    try {
        let images = Array.from(document.querySelectorAll('img'));
        if (images.length === 0) {
            console.warn('No images found for fallback');
            return null;
        }

        let biggest = images[0];
        let maxArea = (biggest.naturalWidth || biggest.width) * (biggest.naturalHeight || biggest.height);
        images.forEach(img => {
            let area = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
            if (area > maxArea) {
                biggest = img;
                maxArea = area;
            }
        });

        let width = biggest.naturalWidth || biggest.width;
        let height = biggest.naturalHeight || biggest.height;
        if (width < 512 || height < 512) {
            console.warn('No image large enough for fallback');
            return null;
        }

        let imageUrl = biggest.src;
        let imageName = imageUrl.split('/').pop().split('?')[0];
        let altText = biggest.alt;
        let tags = altText ? altText.split(' ') : [];

        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: tags
        };

        console.log('Scraped data using fallback method:', data);
        return data;
    } catch (error) {
        console.error('Error in gatherDataFallback:', error);
        return null;
    }
}
function gatherDataGenericSite() {
    try {
        // Select the first image element on the page.
        let imageElement = document.querySelector('img');

        // Check if the image element exists to avoid a null reference error.
        if (!imageElement) {
            console.warn('No image element found');
            return null;
        }

        // Get the image URL.
        let imageUrl = imageElement.src;

        // Extract the image name from the URL.
        let imageName = imageUrl.split('/').pop().split('?')[0];

        // Optionally get tags from the alt text if it exists.
        let altText = imageElement.alt;
        let tags = altText ? altText.split(' ') : [];

        let data = {
            imageUrl: imageUrl,
            imageName: imageName,
            tags: tags
        };

        console.log('gatherDataGenericSite data:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in gatherDataGenericSite:', error);  // Log any unexpected errors.
        return null;
    }
}
// Helper function to generate a random name
function generateRandomName(minLength, maxLength) {
    let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}
// Define a function that selects the appropriate data gathering function based on the user's choice of site.
function gatherData(callback) {
    chrome.storage.sync.get('selectedSite', function(data) {
        let gatheredData = null;

        switch (data.selectedSite) {
            case 'danbooru.donmai.us':
                gatheredData = gatherDataDanbooru();
                break;
            case 'othersite.com':
                gatheredData = gatherDataOtherSite();
                break;
            case 'safebooru.org':
                gatheredData = gatherDataSafebooru();
                break;
            case 'tbib.org':
                gatheredData = gatherDataTbib();
                break;
            case 'derpibooru.org':
                gatheredData = gatherDataDerpibooru();
            break;
            case 'rule34.xxx':
                gatheredData = gatherDataRule34();
            break;
            case 'sankakucomplex.com':
                gatheredData = gatherDataSankakucomplex();
            break;
            case 'gelbooru.com':
                gatheredData = gatherDataGelbooru();
            break;
            case 'yande.re':
                gatheredData = gatherDataYandere();
            break;
            case 'e621.net':
                gatheredData = gatherDataE621();
            break;
            case 'realbooru.com':
                gatheredData = gatherDataRealbooru();
            break;
            case 'chounyuu.com':
                gatheredData = gatherDataChounyuu();
            break;
            case 'yandex.ru':
                gatheredData = gatherDataYandex();
            break;
            case 'nozomi.la':
                gatheredData = gatherDataNozomi();
            break;
            case 'Knowyourmeme.com':
                gatheredData = gatherDataKnowYourMeme();
            break;
            case 'pinterest.com':
                gatheredData = gatherDataPinterest();
            break;
            case 'metmuseum.org':
                gatheredData = gatherDataMetmuseum();
            break;
            case 'civitai.com':
                gatheredData = gatherDataCivitai();
            break;
            case 'wallhaven.cc':
                gatheredData = gatherDataWallhaven();
            break;
            case 'pexels.com':
                gatheredData = gatherDataPexels();
            break;
            case 'kemono.su':
                gatheredData = gatherDataKemono();
            break;
            case 'kemono.party':
                gatheredData = gatherDataKemono();
            break;
            case 'shotdeck.com':
                gatheredData = gatherDataShotdeck();
            break;
            case 'piximg.net':
                gatheredData = gatherDataPixiv();
            break;
            case 'GenericSite.com':
                gatheredData = gatherDataGenericSite();
            break;
            // ... add more cases as needed ...
            default:
                console.error('Unknown site: ' + data.selectedSite);
        }

        // Only call the callback if gatheredData is not null.
        if (gatheredData) {
            callback(gatheredData);
        } else {
            console.error('Failed to gather data.');
        }
    });
}
