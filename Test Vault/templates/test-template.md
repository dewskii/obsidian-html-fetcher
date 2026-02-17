<%* 
const res = await requestUrl({
    url: "https://en.wikipedia.org/api/rest_v1/page/random/summary"
});

const pageUrl = res.json?.content_urls?.desktop?.page;

await tp.file.rename(res.json?.title); 

const output = `[!html-fetch] ${pageUrl}`;
-%>
<% output %>
<%* 
/* 
  applying a template doesn't trigger activeLeaf events (TODO: should they?)
  force the cursor to move so fetcher triggers.
*/ 
-%>
<% tp.file.cursor() %>
