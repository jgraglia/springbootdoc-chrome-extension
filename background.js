'use strict';

// Can display 7 but need to add the "please affine your search" item
const MAX_SUGGESTIONS = 6;
// The site to crawl.
const BASE_URL = "https://docs.spring.io/spring-boot/docs/1.5.x/reference/htmlsingle/index.html"
const DEBUG = false;

var currentRequest = null;
var loadedLinks;

chrome.omnibox.OnInputEnteredDisposition = "currentTab";

/*
 * https://developer.chrome.com/extensions/omnibox#event-onInputChanged
 * User has changed what is typed into the omnibox.
 */
chrome.omnibox.onInputChanged.addListener(
    function (text, suggest) {
        console.debug('Omnibox content: ', text);

        if (currentRequest != null) {
            currentRequest.onreadystatechange = null;
            currentRequest.abort();
            currentRequest = null;
        }
        withLinks(function (links) {
            var suggests = []
            links.forEach(function (link) {
                if (suggests.length > MAX_SUGGESTIONS) {
                    // do not display too many suggestions
                    return;
                }
                if (link.text && link.text.toUpperCase().includes(text.toUpperCase())) {
                    suggests.push({content: link.href, description: link.text})
                    if (suggests.length == MAX_SUGGESTIONS && links.length > MAX_SUGGESTIONS) {
                        suggests.push({content: "#", description: "... and more. Please affine you search"})
                    }
                }
            });
            if (DEBUG) {
                console.log('Suggests ', suggests.length, 'out of ', links.length, 'links')
                console.table(suggests)
            }
            suggest(suggests);
        })

    });

/*
 * https://developer.chrome.com/extensions/omnibox#event-onInputEntered
 * User has accepted what is typed into the omnibox.
 */
// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
    function (text) {
        console.debug('!!!inputEntered: ' + text);
        navigate(BASE_URL + text)
    });

function withLinks(linksLoadedCallback) {
    if (loadedLinks) {
        console.debug(loadedLinks.length, "links already loaded !");
        linksLoadedCallback(loadedLinks);
        return;
    }
    console.debug("Will load page then extract links...");
    currentRequest = loadSinglePage(function (html) {
        console.debug("html loaded, extracting links...");
        loadedLinks = extractLinks(html);
        console.debug(loadedLinks.length, "links loaded !");
        linksLoadedCallback(loadedLinks);
    });
}

function extractLinks(html) {
    var shadowContainer = document.createElement("p");
    shadowContainer.innerHTML = html;

    var anchors = shadowContainer.getElementsByTagName("a");
    var links = [];

    for (var i = 0; i < anchors.length; i++) {
        var href = anchors[i].getAttribute('href');
        if (href && href.startsWith('#')) {
            var text = anchors[i].textContent;

            if (text === undefined) text = anchors[i].innerText;

            if (text === undefined) text = href

            if (href) {
                links.push({name: href, href: href, text: text});
            } else {
                console.warn('Unable to extract link from anchor ', anchors[i]);
            }
        }
    }
    return links;
}

function loadSinglePage(callback) {
    var req = new XMLHttpRequest();
    req.open("GET", BASE_URL, true);
    req.setRequestHeader("GData-Version", "2");
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            callback(req.responseText);
        }
    }
    req.send(null);
    return req;
}

function navigate(url) {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.update(tab.id, {url: url, selected: true});
    });
}
