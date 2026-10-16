// Writes public/licenses.txt: the licence of every open-source package shipped in the app
// (production dependencies only). Run with `npm run licenses` after changing dependencies.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const parts = []
for (const [path, info] of Object.entries(lock.packages)) {
  if (!path || info.dev) continue
  const name = path.replace(/^.*node_modules\//, '')
  const file = existsSync(path) ? readdirSync(path).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f)) : null
  const text = file ? readFileSync(join(path, file), 'utf8').trim() : `Licensed under ${info.license}.`
  parts.push(`${name} ${info.version} (${info.license})\n${'-'.repeat(60)}\n${text}`)
}
// Not npm packages, but shipped too: the font (loaded from Google Fonts) and icon shapes adapted from Lucide.
parts.push(`Manrope font (SIL Open Font License 1.1)
${'-'.repeat(60)}
Copyright 2018 The Manrope Project Authors (https://github.com/sharanda/manrope)
Licensed under the SIL Open Font License, Version 1.1: https://openfontlicense.org`)
parts.push(`Lucide icons, some shapes adapted (ISC)
${'-'.repeat(60)}
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without
fee is hereby granted, provided that the above copyright notice and this permission notice appear
in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
OF THIS SOFTWARE.`)
const head = 'Sidekick uses the following open-source software. Thank you to their authors.\n\n'
writeFileSync('public/licenses.txt', head + parts.join('\n\n\n') + '\n')
console.log(`public/licenses.txt: ${parts.length} packages`)
