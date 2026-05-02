import path from 'node:path'
import sharp from 'sharp'

/** Hero background: lit cabin at Harry’s (landscape, correct orientation via EXIF). */
const input = path.resolve('public/images/venue-cabin.png')
const outWebp = path.resolve('public/images/hero-venue.webp')
const outJpg = path.resolve('public/images/hero-venue.jpg')

const img = sharp(input).rotate()

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
