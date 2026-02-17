<%* 
const res = await requestUrl({
    url: "https://en.wikipedia.org/api/rest_v1/page/random/summary"
});

const pageUrl = res.json?.content_urls?.desktop?.page;
if (!pageUrl) throw new Error("Could not resolve random Wikipedia page URL");

await tp.file.rename(res.json?.title); 

const output = `[!html-fetch] ${pageUrl}\n`;
-%>

<% output %>

