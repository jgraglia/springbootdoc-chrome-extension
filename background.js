'use strict';

// Can display 7 but need to add the "please affine your search" item
const MAX_SUGGESTIONS = 6;
// The site to crawl.
const BASE_URL= "https://docs.spring.io/spring-boot/docs/1.5.x/reference/htmlsingle/index.html"

// chrome://extensions/
var currentRequest = null;
var loadedLinks;

// https://developer.chrome.com/extensions/omnibox#type-OnInputEnteredDisposition
chrome.omnibox.OnInputEnteredDisposition = "currentTab";

/*
 * https://developer.chrome.com/extensions/omnibox#event-onInputChanged
 * User has changed what is typed into the omnibox.
 */
chrome.omnibox.onInputChanged.addListener(
    function (text, suggest) {
        console.debug('inputChanged: ' + text);

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
                if (!link.href) {
                    console.warn('invalid link. missing href', link)
                    return;
                }
                if (!link.text) {
                    console.warn('invalid link. missing text', link)
                    return;
                }
                if (link.text && link.text.toUpperCase().includes(text.toUpperCase())) {
                    suggests.push({content: link.href, description: link.text})
                    if (suggests.length == MAX_SUGGESTIONS && links.length > MAX_SUGGESTIONS) {
                        suggests.push({content: "#", description: "... and more. Please affine you search"})
                    }
                }
            });
            console.log('Suggests ', suggests.length, 'out of ', links.length, 'links')
            console.table(suggests)
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

function withLinks(callback) {
    if (loadedLinks) {
        console.debug(loadedLinks.length, "links already loaded !");
        callback(loadedLinks);
        return;
    }
    console.log("Will load page then extract links...");
    currentRequest = loadSinglePage(function (html) {
        console.log("html loaded...");
        loadedLinks = extractLinks(html);
        console.log(loadedLinks.length, "links loaded !");
        callback(loadedLinks);
    });
}

function extractLinks(html) {
    var container = document.createElement("p");
    container.innerHTML = html;

    var anchors = container.getElementsByTagName("a");
    var list = [];

    for (var i = 0; i < anchors.length; i++) {
        var href = anchors[i].getAttribute('href');
        if (href && href.startsWith('#')) {
            var text = anchors[i].textContent;

            if (text === undefined) text = anchors[i].innerText;

            if (text === undefined) text = href

            list.push({name: href, href: href, text: text});
        } else {
            //console.trace("no href in ", anchors[i]);
        }
    }
    return list;
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
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, {url: url, selected: true});
    });
    // chrome.tabs.create({
    //     url: url
    // });

    // chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    //     chrome.tabs.update(tabs[0].id, {url: url});
    // });
}
