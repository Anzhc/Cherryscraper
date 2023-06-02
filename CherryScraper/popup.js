// This function sets the default values if no values have been set before.
function setDefaultOptions() {
    chrome.storage.sync.get(['buttonEnabled', 'selectedSite', 'siteList', 'downloadDirectory'], function(data) {
        if (data.buttonEnabled === undefined) {
            chrome.storage.sync.set({buttonEnabled: true});  // Set default value for buttonEnabled
        }
        if (data.selectedSite === undefined) {
            chrome.storage.sync.set({selectedSite: 'danbooru.donmai.us'});  // Set default value for selectedSite
        }
        if (data.siteList === undefined) {
            chrome.storage.sync.set({siteList: ['danbooru.donmai.us', 'safebooru.org', 'tbib.org', 'derpibooru.org', 'rule34.xxx','sankakucomplex.com','gelbooru.com','yande.re','e621.net', 'realbooru.com','chounyuu.com', 'othersite.com']});  // Set default value for siteList
        }
        if (data.downloadDirectory === undefined) {
            chrome.storage.sync.set({downloadDirectory: 'dataset'});  // Set default value for downloadDirectory
        }
    });
}
document.addEventListener('DOMContentLoaded', setDefaultOptions);

// This function gets the user's current options from Chrome's storage and updates the form.
function restoreOptions() {
    chrome.storage.sync.get(['buttonEnabled', 'selectedSite', 'siteList', 'downloadDirectory'], function(data) {
        document.querySelector('#enableButton').checked = data.buttonEnabled;
        document.querySelector('#downloadDirectory').value = data.downloadDirectory;

        let select = document.querySelector('#selectedSite');
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


// When the page is loaded, restore the user's options.
document.addEventListener('DOMContentLoaded', restoreOptions);

// Listen for changes to selectedSite in storage and restore the options when it changes.
chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'sync' && (changes.selectedSite || changes.downloadDirectory)) {
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
