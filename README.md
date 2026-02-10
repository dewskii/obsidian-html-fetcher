# Obsidian HTML Fetcher

An Obsidian Plugin for generating a note with a reader like view from external URLs from an inline flag.

Project bootstrapped from [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin).


### Demo

{% include youtube.html id="ltRIlSc-bPQ" %}


### Usage
To use the plugin, simply prepend a URL string with the `[!html-fetcher]` tag.

```
[!html-fetch] https://site.com/you/wanna/fetch/this
```

The plugin should then attempt to fetch a reader view of the site along with any images, and proceed to convert it to markdown.


> !WARNING
> Still very much a work in progress

### Installation

The plugin isn't currently registered with Obsidian and must be manually installed

To build
```
npm install

npm run build

mv build/ [Path to your Vault]/.obsidian/plugins/html-fetcher/
```
