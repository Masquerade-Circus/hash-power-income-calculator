/* eslint-disable max-len */
import v from "valyrian.js/lib";

export function Html({ css, js }) {
  return [
    "<!DOCTYPE html>",
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="viewport" content="initial-scale=1, width=device-width, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        <link
          rel="stylesheet"
          id="google-fonts-1-css"
          href="https://fonts.googleapis.com/css?family=Montserrat%3A100%2C100italic%2C200%2C200italic%2C300%2C300italic%2C400%2C400italic%2C500%2C500italic%2C600%2C600italic%2C700%2C700italic%2C800%2C800italic%2C900%2C900italic%7CWork+Sans%3A100%2C100italic%2C200%2C200italic%2C300%2C300italic%2C400%2C400italic%2C500%2C500italic%2C600%2C600italic%2C700%2C700italic%2C800%2C800italic%2C900%2C900italic&amp;display=auto&amp;ver=5.9.2"
          type="text/css"
          media="all"
        />
        <style type="text/css">{css}</style>
        <title>Hash Profit Calculator</title>
      </head>
      <body>
        <script type="application/javascript">{js}</script>
      </body>
    </html>
  ];
}
