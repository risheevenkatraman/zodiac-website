const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const prettier = require('prettier');

// Enumerate project sources without traversing local Python environments or builds.
async function main() {
  const checking = process.argv.includes('--check');
  const files = [
    ...new Set(
      execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
        encoding: 'utf8',
      }).split('\0'),
    ),
  ].filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file));
  let failures = 0;
  let checked = 0;
  for (const file of files) {
    const info = await prettier.getFileInfo(file, { ignorePath: '.prettierignore' });
    if (info.ignored) continue;
    const source = await fs.readFile(file, 'utf8');
    const options = { ...(await prettier.resolveConfig(file)), filepath: file };
    if (checking) {
      if (!(await prettier.check(source, options))) {
        console.error(`Needs formatting: ${file}`);
        failures++;
      }
    } else {
      const formatted = await prettier.format(source, options);
      if (formatted !== source) await fs.writeFile(file, formatted);
    }
    checked++;
  }
  console.log(`${checking ? 'Checked' : 'Formatted'} ${checked} JavaScript/TypeScript files.`);
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
