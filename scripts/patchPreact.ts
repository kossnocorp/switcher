import * as fs from 'fs'
import { resolve } from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const rootPath = process.cwd()
const packageJSONPath = resolve(rootPath, 'lib/preact/package.json')

readFile(packageJSONPath, 'utf8')
  .then(JSON.parse)
  .then(packageJSON =>
    writeFile(
      packageJSONPath,
      JSON.stringify(patchPackageJSON(packageJSON), null, 2)
    )
  )
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

type PackageJSON = {
  name: string
  description: string
  keywords: string[]
  dependencies: { [key: string]: string }
  [key: string]: any
}

function patchPackageJSON(packageJSON: PackageJSON): PackageJSON {
  return Object.assign({}, packageJSON, {
    name: '@switcher/preact',
    keywords: packageJSON.keywords.reduce(
      (acc, keyword) => acc.concat(keyword.replace('React', 'Preact')),
      [] as string[]
    ),
    dependencies: Object.assign({}, packageJSON.dependencies, {
      preact: '*'
    })
  })
}
