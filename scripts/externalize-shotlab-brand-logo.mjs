import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const componentPath = path.join(root, 'src/components/ShotLabBrand.jsx')
const publicDir = path.join(root, 'public')
const logoPath = path.join(publicDir, 'shotlab-brand-logo.png')
const publicReference = './shotlab-brand-logo.png'

const source = await readFile(componentPath, 'utf8')
const dataUriPattern = /src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/
const match = source.match(dataUriPattern)

if (!match) {
  if (source.includes(`src="${publicReference}"`)) {
    console.log('ShotLab brand logo is already externalized.')
    process.exit(0)
  }

  throw new Error('Expected embedded ShotLab PNG data URI was not found.')
}

const imageBytes = Buffer.from(match[1], 'base64')
if (imageBytes.length < 1024) {
  throw new Error(`Embedded ShotLab logo decoded to an unexpectedly small file (${imageBytes.length} bytes).`)
}

await mkdir(publicDir, { recursive: true })
await writeFile(logoPath, imageBytes)

const nextSource = source.replace(dataUriPattern, `src="${publicReference}"`)
if (nextSource === source) {
  throw new Error('ShotLab brand logo externalization did not modify the component source.')
}

await writeFile(componentPath, nextSource)
console.log(`Externalized ShotLab brand logo to public/shotlab-brand-logo.png (${imageBytes.length} bytes).`)
