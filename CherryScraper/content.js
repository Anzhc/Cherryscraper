// This function creates a button and adds it to the page.
function addButton() {
    let button = document.createElement('button');
    button.textContent = '';
    button.style.position = 'fixed';
    button.style.bottom = '1px';
    button.style.left = '1px';
    button.style.zIndex = 1000;
    
    // This function performs the scraping action.
    const scrapeAction = function() {
        gatherData(function(data) {
            console.log(data);
            // Send the data to the background script.
            chrome.runtime.sendMessage({action: 'gatherData', data: data});
            
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
                tagsFilename: tagsFilename
            });
        });
    };

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

// This function checks whether the user has enabled the button and adds it to the page if so.
chrome.storage.sync.get('buttonEnabled', function(data) {
    if (data.buttonEnabled) {
        addButton();
    }
});

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
// Define a function for gathering data from another site (just a placeholder for now).
function gatherDataOtherSite() {
    // ... code to gather data from the other site ...
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