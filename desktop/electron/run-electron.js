const { spawn } = require('node:child_process');

const electronBinary = require('electron');

const child = spawn(electronBinary, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: false,
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: ''
  }
});

child.on('close', code => {
  process.exit(code ?? 0);
});
