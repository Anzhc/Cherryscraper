const scrapeAction = function() {
    gatherData(function(data) {
        console.log(data);
        // Get the automaticDownload option from storage.
        chrome.storage.sync.get('automaticDownload', function(settings) {
            // Send the data to the background script.
            chrome.runtime.sendMessage({
                action: 'gatherData',
                data: data,
                automaticDownload: settings.automaticDownload // Add the setting to the message.
            });

            // Get tab id from the background script.
            chrome.runtime.sendMessage({action: 'getTabId'}, function(response) {
                // Create a Blob from the tags and convert it into a Data URL.
                let tagsBlob = new Blob([data.tags.join(',')], {type: 'text/plain'});
                let tagsUrl = URL.createObjectURL(tagsBlob);
                console.log(tagsUrl);

                // Replace the image extension with .txt to get the filename for the tags.
                let tagsFilename = data.imageName.replace(/\.[^.]*$/, '.txt');

                // Send the tags data to the background script.
                chrome.runtime.sendMessage({
                    action: 'downloadTags',
                    tagsUrl: tagsUrl,
                    tagsFilename: tagsFilename,
                    automaticDownload: settings.automaticDownload, // Add the setting to the message.
                    tabId: response.tabId
                });
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

    // Add the event listener to the button.
    button.addEventListener('click', scrapeAction);

    // Add a keypress event listener to the document.
    document.addEventListener('keypress', function(e) {
        // Check if the pressed key is "c".
        if (e.key === 'c') {
            scrapeAction();
        }
    });

    document.body.appendChild(button);
}

// Add an event listener to execute the scrapeAction when the page is fully loaded.
window.addEventListener('load', function() {
    // Get the automaticDownload option from storage.
    chrome.storage.sync.get('automaticDownload', function(data) {
        if (data.automaticDownload) {
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

        let imageElement = document.querySelector('.image-container.note-container.blacklisted picture img');
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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDanbooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDanbooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataSankaku:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataGelbooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDanbooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataGelbooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDerpibooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDerpibooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDerpibooru data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherDataDerpibooru:', error);  // Log any unexpected errors.
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
        console.log('gatherDataDerpibooru data:', data);  // Log the entire data object.
    
        return data;
    } catch (error) {
        console.error('Error in gatherDataDerpibooru:', error);  // Log any unexpected errors.
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
        
        console.log('gatherKnowYourMeme data:', data);  // Log the entire data object.

        return data;
    } catch (error) {
        console.error('Error in gatherKnowYourMeme:', error);  // Log any unexpected errors.
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
        console.error('Error in gatherDataDanbooru:', error);  // Log any unexpected errors.
        return null;
    }
}
function gatherDataPixiv() {
    try {
        // Select the first image inside a div with role 'presentation'
        let imageElement = document.querySelector('div[role="presentation"] img');
        let imageUrl = imageElement ? imageElement.src : null;

        // Assuming generateRandomName is correctly defined
        let imageName = imageUrl ? (generateRandomName(16, 32) + '.png') : null;

        let data = { imageUrl: imageUrl, imageName: imageName };
        console.log('gatherDataPixiv data:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataPixiv:', error);
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
        console.log('gatherDataPixiv data:', data);

        return data;
    } catch (error) {
        console.error('Error in gatherDataPixiv:', error);
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

        console.log('Scraped data from Civitai:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in scrapeImageFromCivitai:', error);  // Log any unexpected errors.
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

        console.log('Scraped data from Wallpaper:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in gatherDataFromWallpaper:', error);  // Log any unexpected errors.
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

        console.log('Scraped data from GenericSite:', data);  // Log the data gathered.

        return data;
    } catch (error) {
        console.error('Error in scrapeImageFromGenericSite:', error);  // Log any unexpected errors.
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
            case 'pixiv.net':
                gatheredData = gatherDataPixiv();
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
