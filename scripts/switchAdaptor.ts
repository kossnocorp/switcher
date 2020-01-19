import * as fs from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)

const switchTo: 'preact' | 'react' | unknown = process.argv[2]
if (switchTo !== 'preact' && switchTo !== 'react')
  throw new Error('Pass either preact or react as the script argument')

const rootPath = process.cwd()
const adaptorPackageJSONPath = resolve(rootPath, 'src/adaptor/package.json')

writeFile(
  adaptorPackageJSONPath,
  JSON.stringify({ main: `./${switchTo}` }, null, 2)
).catch(err => {
  console.error(err)
  process.exit(1)
})
