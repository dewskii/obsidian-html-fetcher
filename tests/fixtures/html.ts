export const READABLE_ARTICLE_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: Readable Article</title>
  </head>
  <body>
    <main>
      <article>
        <h1>Fixture Heading</h1>
        <p>This is a readable article body for markdown conversion tests.</p>
        <p>Visit <a href="https://mock.sample.foo/reference">reference</a>.</p>
      </article>
    </main>
  </body>
</html>
`;

export const UNREADABLE_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: Unreadable</title>
  </head>
  <body>
    <script>window.__empty = true;</script>
  </body>
</html>
`;

export const FRAGMENT_LINK_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: Fragment Links</title>
  </head>
  <body>
    <article>
      <h1 id="section-1">Section 1</h1>
      <p><a href="#section-1">Jump to Section 1</a></p>
    </article>
  </body>
</html>
`;

export const APP_URL_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: App URLs</title>
  </head>
  <body>
    <article>
      <p>
        <a href="app://obsidian.md/docs/getting-started">Obsidian Docs</a>
      </p>
      <img
        src="app://mock.sample.com/media/photo.png"
        alt="Fixture photo"
        title="Fixture title"
      />
    </article>
  </body>
</html>
`;

export const IMAGE_HEAVY_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: Images</title>
  </head>
  <body>
    <article>
      <h1>Images Fixture</h1>
      <p>Image handling branch fixture.</p>
      <a href="src">
      <img src="/assets/first.jpg" alt="First" />
      </a>
      <img src="https://mock.sample.com/assets/second" alt="Second" title="No extension" />
      <img src="bad::url" alt="Invalid" />
    </article>
  </body>
</html>
`;

export const EMPTY_BODY_ARTICLE_HTML = `
<!doctype html>
<html>
  <head>
    <title>Fixture: Empty Body</title>
  </head>
  <body>
    <article>
      <h1>Only heading</h1>
    </article>
  </body>
</html>
`;
