# springbootdoc-chrome-extension

Google Chrome extension to search Spring Boot doc from the omnibox.

## Development

https://developer.chrome.com/extensions/omnibox

## Miscellaneous

Useful Chrome shortcut :

* Jump to the address bar : `Ctrl + l or Alt + d or F6`

https://support.google.com/chrome/answer/157179?hl=en

## Adapt to another site

You can change the `BASE_URI` in `background.js` to adapt to other site.
You also have to update the `manifest.json` to adapt the permissions 
 
     "permissions": [
        "...${ROOT of BASE_URI}..."
      ]

Spring Boot logo trademark  : https://spring.io/trademarks
