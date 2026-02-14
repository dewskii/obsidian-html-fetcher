# Obsidian HTML Fetcher

An Obsidian Plugin for generating a note with a reader like view from external URLs using an inline flag.

Project bootstrapped from [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin).

### Demo

[![Final video of fixing issues in your code in VS Code](https://img.youtube.com/vi/ltRIlSc-bPQ/maxresdefault.jpg)](https://www.youtube.com/watch?v=ltRIlSc-bPQ)


### Usage
To use the plugin, simply prepend a URL string with the `[!html-fetch]` tag.

```
[!html-fetch] https://site.com/you/wanna/fetch/this
```

The plugin should then attempt to fetch a reader view of the site along with any images, and proceed to convert it to markdown.

### Installation

> [!NOTE]
> plugin link is a place holder, is still [under review](https://github.com/obsidianmd/obsidian-releases/pull/10136)
> This note will be removed after publication

Install from [Obsidian Community Plugins](https://obsidian.md/plugins?id=html-fetcher) 

Install from Release 
```
wget && \
'https://github.com/dewskii/obsidian-html-fetcher/releases/download/{version}/html-fetcher.zip' && \
unzip html-fetcher.zip && \
mv html-fetcher/ /path/to/your/vault/.obsidian/plugins/
```

To install from source
```
git clone https://github.com/dewskii/obsidian-html-fetcher && cd obsidian-html-fetcher/
npm install
npm run build
mkdir /path/to/your/vault/.obsidian/plugins/html-fetcher && \
mv main.js manifest.json /path/to/your/vault/.obsidian/plugins/html-fetcher
```


