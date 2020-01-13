// do not build native module on windows
if (process.platform !== 'win32') {
    require('child_process').spawnSync('node-gyp', ['rebuild'], {stdio: 'inherit'});
}
