import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await fs.promises.readFile(path.join(dirname, 'package.json'), 'utf-8'))

try {
  await runProcessIn(dirname, 'git', 'tag', pkg.version)
} catch {}

for (const name of await fs.promises.readdir(path.join(dirname, 'npm'))) {
  await runProcessIn(path.join(dirname, 'npm', name), 'npm', 'publish')
}

await runProcessIn(dirname, 'npm', 'publish')

async function runProcessIn (cwd, cmd, ...args) {
  const proc = spawn(cmd, [...args], {
    stdio: 'inherit',
    cwd
  })

  return new Promise((resolve, reject) => {
    proc.on('exit', function (code) {
      if (code) return reject(new Error('Failed with: ' + code))
      resolve()
    })
  })
}
