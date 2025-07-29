// This function sets the default values if no values have been set before.
function setDefaultOptions(callback) {
    chrome.storage.sync.get(['buttonEnabled', 'selectedSite', 'siteList', 'downloadDirectory', 'automaticDownload', 'closeAfterDownload', 'fallbackDownload'], function(data) {
        let defaults = {};
        if (data.buttonEnabled === undefined) {
            defaults.buttonEnabled = true;  // Set default value for buttonEnabled
        }
        if (data.selectedSite === undefined) {
            defaults.selectedSite = 'danbooru.donmai.us';  // Set default value for selectedSite
        }
        if (data.siteList === undefined) {
            defaults.siteList = [
            'danbooru.donmai.us',
            'safebooru.org',
            'tbib.org',
            'derpibooru.org',
            'rule34.xxx',
            'sankakucomplex.com',
            'gelbooru.com',
            'yande.re',
            'e621.net',
            'realbooru.com',
            'chounyuu.com',
            'yandex.ru',
            'nozomi.la',
            'Knowyourmeme.com',
            'pinterest.com',
            'metmuseum.org',
            'civitai.com',
            'wallhaven.cc',
            'pexels.com',
            'kemono.su',
            'kemono.party',
            'shotdeck.com',
            'GenericSite.com'];  // Set default value for siteList
        }
        if (data.downloadDirectory === undefined) {
            defaults.downloadDirectory = 'dataset';  // Set default value for downloadDirectory
        }
        if (data.automaticDownload === undefined) {
            defaults.automaticDownload = false;  // Set default value for automaticDownload
        }
        if (data.closeAfterDownload === undefined) {
            defaults.closeAfterDownload = false;
        }
        if (data.fallbackDownload === undefined) {
            defaults.fallbackDownload = false;
        }

        if (Object.keys(defaults).length > 0) {
            chrome.storage.sync.set(defaults, callback);
        } else if (callback) {
            callback();
        }
    });
}

// This function gets the user's current options from Chrome's storage and updates the form.
function restoreOptions() {
    chrome.storage.sync.get(['buttonEnabled', 'selectedSite', 'siteList', 'downloadDirectory', 'automaticDownload', 'closeAfterDownload', 'fallbackDownload'], function(data) {
        // Update the checkboxes/inputs as usual
        document.querySelector('#enableButton').checked = data.buttonEnabled;
        document.querySelector('#downloadDirectory').value = data.downloadDirectory;
        document.querySelector('#automaticDownload').checked = data.automaticDownload;
        document.querySelector('#closeAfterDownload').checked = data.closeAfterDownload;
        document.querySelector('#fallbackDownload').checked = data.fallbackDownload;

        // Clear existing options in the <select> to avoid duplicates:
        let select = document.querySelector('#selectedSite');
        select.innerHTML = '';  // Remove all existing <option> elements

        // Now safely add the new <option> elements
        data.siteList.forEach(function(site) {
            let option = document.createElement('option');
            option.textContent = site;
            if (site === data.selectedSite) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

// When the page is loaded, set defaults first and then restore the user's options.
document.addEventListener('DOMContentLoaded', function() {
    setDefaultOptions(restoreOptions);
});

// Listen for changes to selectedSite in storage and restore the options when it changes.
chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'sync' && (changes.selectedSite || changes.downloadDirectory || changes.automaticDownload || changes.closeAfterDownload || changes.fallbackDownload)) {
        restoreOptions();
    }
});

document.querySelector('#enableButton').addEventListener('input', function() {
    chrome.storage.sync.set({buttonEnabled: this.checked});
});

document.querySelector('#selectedSite').addEventListener('change', function() {
    chrome.storage.sync.set({selectedSite: this.value});
});

document.querySelector('#downloadDirectory').addEventListener('input', function() {
    chrome.storage.sync.set({downloadDirectory: this.value});
});

document.querySelector('#automaticDownload').addEventListener('input', function() {
    chrome.storage.sync.set({automaticDownload: this.checked});
});


document.querySelector('#closeAfterDownload').addEventListener('input', function() {
    chrome.storage.sync.set({closeAfterDownload: this.checked});
});

document.querySelector('#fallbackDownload').addEventListener('input', function() {
    chrome.storage.sync.set({fallbackDownload: this.checked});
});
