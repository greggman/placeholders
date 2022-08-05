'use strict';

const fs = require('fs');
const path = require('path');
const ThumbnailGenerator = require('./thumbnail');

const formats = [
  // {ext: 'png', format: []},
  {ext: 'jpg', format: ['image/jpeg', 0.9]},
];

function makeColor(filename) {
  const sum = filename.split().reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return `hsl(${sum / 255 % 1 * 360},100%,35%)`;
}

function* range(min, max, step) {
  for (let v = min; v <= max; v += step) {
    yield v;
  }
}

function* combos(a, b) {
  for (const v0 of a) {
    for (const v1 of b) {
      yield [v0, v1];
    }
  }
}

const powerOf2Sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
const unitsOf10 = [
  ...range(10, 250, 10),
  ...range(300, 1000, 100),
];

const sizes = [
  ...combos(powerOf2Sizes, powerOf2Sizes),
  ...combos(unitsOf10, unitsOf10),
];

// console.log(sizes);
// console.log(sizes.length);
// process.exit(0);

async function main() {
  const gen = new ThumbnailGenerator();
  const filenames = [];

  for (const [width, height] of sizes) {
    for (const {ext, format} of formats) {
      const filename = `images/${width}x${height}.${ext}`;
      console.log('generating', filename);
      filenames.push(filename);
      const fontSize = width / 5;
      const settings = {
        backgroundFilename: path.join(__dirname, 'background.png'),
        fonts: [],
        text: [
          {
            font: `bold ${fontSize}px sans-serif`,
            text: `${width}x${height}`,
            verticalSpacing: 100,
            offset: [width / 2, height / 2 + fontSize / 2],
            textAlign: 'center',
            shadowOffset: [fontSize / 6, fontSize / 6],
            strokeWidth: fontSize / 6,
            textWrapWidth: 100000,
            color: makeColor(filename),
          },
        ],
        width,
        height,
        format,
      };
      const data = await gen.generate(settings);
      fs.writeFileSync(filename, data);
    }
  }

  fs.writeFileSync('index.html', `\
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>placeholders</title>
    <style>
    :root {
      color-scheme: light dark;
    }
    body {
      font-family: monospace;
    }
    </style>
  </head>
  <body>
  <h1>placeholders</h1>
  ${filenames.map(f => {
    const href = `https://greggman.github.io/placeholder-generator/${f}`;
    return `<li><a href="${f}">${href}</a>`;
  }).join('\n')}
  </body>
</html>
`);

  await gen.close();
}

main();
