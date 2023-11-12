import https from 'https'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { spawn } from 'child_process'

if (process.platform !== 'darwin' && process.platform !== 'linux') {
  console.log('build script only supported on macos/linux')
  process.exit(1)
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await fs.promises.readFile(path.join(dirname, 'package.json'), 'utf-8'))
const version = pkg.version
const binWrap = '#!/usr/bin/env node\nrequire(\'../lib/spawn\')(__filename)\n'
const base = 'https://github.com/Kitware/CMake/releases/download/v' + version

const tmp = path.join(dirname, 'tmp')
const npm = path.join(dirname, 'npm')

const bins = ['cmake', 'ccmake', 'cpack', 'ctest', 'cmcldeps']
const optionalDependencies = {}

try {
  await fs.promises.rm(tmp, { recursive: true })
} catch {}

try {
  await fs.promises.rm(npm, { recursive: true })
} catch {}

await fs.promises.mkdir(tmp, { recursive: true })
await fs.promises.mkdir(npm, { recursive: true })

await fetchAll()

async function fetchDist (platform, arch, filename) {
  const url = base + '/' + filename

  console.log('Downloading', url, '...')

  await new Promise((resolve, reject) => {
    get(url)

    function get (url) {
      https.get(url, function (response) {
        if (response.statusCode >= 300 && response.statusCode < 400) return get(response.headers.location)
        if (response.statusCode !== 200) return reject(new Error('Link seems broken'))

        response
          .on('error', reject)
          .pipe(fs.createWriteStream(path.join(tmp, filename)))
            .on('error', reject)
            .on('close', resolve)
      })
    }
  })

  if (filename.endsWith('.tar.gz')) {
    await runProcessIn(tmp, 'tar', 'xzvf', path.join(tmp, filename))
  } else if (filename.endsWith('.zip')) {
    await runProcessIn(tmp, 'unzip', path.join(tmp, filename))
  } else {
    throw new Error('Unknown format')
  }

  await buildDist(platform, arch, path.join(tmp, filename.replace(/\.(zip)|(\.tar\.gz)$/, '')))
}

async function buildDist (platform, arch, folder) {
  if (!arch) arch = 'universal'

  let bin = null
  let share = null

  if (platform === 'darwin') {
    bin = path.join(folder, 'Cmake.app/Contents/bin')
    share = path.join(folder, 'Cmake.app/Contents/share')
  } else {
    bin = path.join(folder, 'bin')
    share = path.join(folder, 'share')
  }

  folder = path.join(npm, platform + '-' + (arch || 'universal'))

  await fs.promises.mkdir(folder)

  await fs.promises.cp(bin, path.join(folder, 'bin'), { recursive: true })
  await fs.promises.cp(share, path.join(folder, 'share'), { recursive: true })

  const pkg = {
    name: `cmake-runtime-${platform}-${arch}`,
    version,
    description: `cmake ${platform}-${arch} binary`,
    bin: {},
    files: [
      'bin',
      'share'
    ],
    repository: {
      type: 'git',
      url: 'git+https://github.com/holepunchto/cmake-runtime.git'
    },
    author: 'Holepunch',
    license: 'BSD-3-clause', // cmake license
    bugs: {
      url: 'https://github.com/holepunchto/cmake-runtime/issues'
    },
    homepage: 'https://github.com/holepunchto/cmake-runtime',
    os: [
      platform
    ]
  }

  if (arch !== 'universal') pkg.cpus = [arch]

  bin = path.join(folder, 'bin')

  for (const name of await fs.promises.readdir(bin)) {
    const id = name.replace(/\.exe$/, '')

    if (!bins.includes(id)) {
      if (id !== 'cmake-gui') {
        throw new Error(`Unknown binary in cmake: ${id} for ${platform}-${arch}, refusing to continue!`)
      }
      await fs.promises.unlink(path.join(bin, name))
      continue
    }

    pkg.bin[id] = 'bin/' + name
  }

  await fs.promises.writeFile(path.join(folder, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  optionalDependencies[pkg.name] = version
}

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

async function fetchAll () {
  await fetchDist('windows', 'x64', `cmake-${version}-windows-x86_64.zip`)
  await fetchDist('windows', 'arm64', `cmake-${version}-windows-arm64.zip`)
  await fetchDist('darwin', null, `cmake-${version}-macos-universal.tar.gz`)
  await fetchDist('linux', 'x64', `cmake-${version}-linux-x86_64.tar.gz`)
  await fetchDist('linux', 'arm64', `cmake-${version}-linux-aarch64.tar.gz`)

  pkg.bin = {}
  for (const id of bins) {
    pkg.bin[id] = 'bin/' + id
    await fs.promises.writeFile(path.join(dirname, pkg.bin[id]), binWrap)
  }
  pkg.optionalDependencies = optionalDependencies

  await runProcessIn(dirname, 'chmod', '+x', ...Object.values(pkg.bin))

  await fs.promises.writeFile(path.join(dirname, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
}
