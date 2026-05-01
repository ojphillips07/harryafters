import path from 'node:path'
import sharp from 'sharp'

const input = path.resolve('public/images/hero-outside.png')
const outWebp = path.resolve('public/images/hero-outside.webp')
const outJpg = path.resolve('public/images/hero-outside.jpg')

// The original photo is sideways; rotate the correct direction for upright display.
// (If it looks upside down, this is the other direction vs a 90° clockwise rotate.)
const img = sharp(input).rotate(270)

await img
  .clone()
  .resize({
    width: 2400,
    withoutEnlargement: true
  })
  .webp({
    quality: 86
  })
  .toFile(outWebp)

await img
  .clone()
  .resize({
    width: 2400,
    withoutEnlargement: true
  })
  .jpeg({
    quality: 88,
    mozjpeg: true
  })
  .toFile(outJpg)

// eslint-disable-next-line no-console
console.log('Generated:', outWebp, outJpg)

