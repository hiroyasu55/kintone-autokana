/**
 * Gulp file
 */

'use strict';

import gulp from 'gulp';
//import util from 'gulp-util';
//import source from 'vinyl-source-stream';
import child from 'child_process';
import fs from 'fs-extra';
import webpack from 'gulp-webpack';
import config from './webpack.config.babel.js';

const path = {
  SRC_DIR: './src/',
  LIB_DIR: './lib/',
  MODULES_DIR: './modules/',
  PLUGIN_DIR: './plugin/',
  PACKAGE_DIR: './package/'
};
path.SDK_DIR = path.MODULES_DIR + 'plugin-sdk/';
path.PACKAGE_SH = path.SDK_DIR + 'package.sh';
path.PLUGINS_DIR = path.PACKAGE_DIR + 'plugins/';
path.KEY_TEXT_FILE = path.PACKAGE_DIR + 'key.txt';
path.KEYS_DIR = path.PACKAGE_DIR + 'keys/';
path.RELEASE_DIR = path.PACKAGE_DIR + 'release/';
path.MANIFEST_FILE = path.PLUGIN_DIR + 'manifest.json';

// Initialise plugin dir
let initPluginDir = () => {
  try {
    fs.mkdirsSync(path.PLUGIN_DIR);
    let files = fs.readdirSync(path.PLUGIN_DIR);
    for (let file of files) {
      if (file.match(/^\./)) {
        fs.unlinkSync(path.PLUGIN_DIR + file);
      }
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Get key file
let getKeyFile = () => {
  let keyFile = null;
  try {
    fs.accessSync(path.KEY_TEXT_FILE);
    let keyFile = fs.readFileSync(path.KEY_TEXT_FILE, 'utf-8');
    keyFile = keyFile.replace(/\n$/, '');
    try {
      fs.accessSync(keyFile);
    } catch (err) {
      console.warn('[getKeyFile]key file "' + keyFile + '" not exists.');
      let files = fs.readdirSync(path.KEYS_DIR);
      for (let file of files) {
        if (file.match(/.+\.ppk$/)) {
          keyFile = path.KEYS_DIR + file;
          break;
        }
      }
      if (!keyFile) {
        console.warn('[getKeyFile]No key file in ' + path.KEYS_DIR);
        return false;
      }
      fs.writeFileSync(path.KEY_TEXT_FILE, keyFile, 'utf8');
    }
    return keyFile;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(err.message);
      return false;
    }
    let files = fs.readdirSync(path.KEYS_DIR);
    for (let file of files) {
      if (file.match(/.+\.ppk$/)) {
        keyFile = path.KEYS_DIR + file;
        break;
      }
    }
    if (!keyFile) {
      console.warn('[getKeyFile]No key file in ' + path.KEYS_DIR);
      return false;
    }
    fs.writeFileSync(path.KEY_TEXT_FILE, keyFile, 'utf8');
    console.log('keyFile =' + keyFile);
    return keyFile;
  }
};

// Read manifest file and return JSON
let readManifestFile = (manifestFile) => {
  manifestFile = manifestFile || path.MANIFEST_FILE;
  try {
    let text = fs.readFileSync(manifestFile, 'utf-8');
    let json = JSON.parse(text);
    return json;
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

// js
gulp.task('js', () => {
  fs.mkdirsSync(path.PLUGIN_DIR);
  gulp.src(path.SRC_DIR + 'js/config.js')
    .pipe(webpack(config))
    .pipe(gulp.dest(path.PLUGIN_DIR + 'js/'));
});

// html
gulp.task('html', function() {
  fs.mkdirsSync(path.PLUGIN_DIR);
  gulp.src([path.SRC_DIR + 'html/*.html'])
    .pipe(gulp.dest(path.PLUGIN_DIR + 'html'));
});

// css
gulp.task('css', () => {
  fs.mkdirsSync(path.PLUGIN_DIR);
  gulp.src([path.SRC_DIR + 'css/*.css'])
    .pipe(gulp.dest(path.PLUGIN_DIR + 'css'));
});

// img
gulp.task('img', () => {
  fs.mkdirsSync(path.PLUGIN_DIR);
  gulp.src([
    path.SRC_DIR + 'img/*.jpg',
    path.SRC_DIR + 'img/*.jpeg',
    path.SRC_DIR + 'img/*.png',
    path.SRC_DIR + 'img/*.gif'])
    .pipe(gulp.dest(path.PLUGIN_DIR + 'img'));
});

// manifest
gulp.task('manifest', () => {
  fs.mkdirsSync(path.PLUGIN_DIR);
  gulp.src([path.SRC_DIR + 'manifest.json'])
    .pipe(gulp.dest(path.PLUGIN_DIR));
});

// package
gulp.task('package', ['default'], () => {
  initPluginDir();
  let keyFile = getKeyFile();
  if (!keyFile) {
    console.error('[package]key file not exists.');
    return;
  }
  let cmd = 'bash ' + path.PACKAGE_SH + ' ' + path.PLUGIN_DIR;
  if (keyFile) {
    cmd += ' ' + keyFile;
  }
  try {
    let result = child.execSync(cmd);
    console.log(result.toString());
  } catch (e) {
    console.error(e.message);
    return;
  }
});

// package for release
gulp.task('package-release', ['package'], () => {
  let manifest = null;
  readManifestFile().then(function (json) {
    manifest = json;
    return getKeyFile();
  }).then(function (keyFile) {
    let key = keyFile.replace(/^.*\/plugin\.(.+)\.ppk$/, '$1');
    let pluginFile = path.PLUGINS_DIR + key + '/plugin.zip';
    let name = manifest['plugin_name'] || 'plugin';
    let version = manifest.version;
    if (manifest.revision) {
      version += '_' + manifest.revision;
    }
    let releaseFile = name + '_' + version + '.zip';
    fs.copySync(pluginFile, path.RELEASE_DIR + releaseFile);
  }).catch(function (error) {
    console.error(error);
  });
});

// default
gulp.task('default', [
  'js', 'html', 'css', 'img', 'manifest'
]);

// watch
gulp.task('watch', () => {
  gulp.watch([path.SRC_DIR + 'js/*.js', path.SRC_DIR + 'lib/**/*.js'], ['js']);
  gulp.watch([path.SRC_DIR + 'html/*.html'], ['html']);
  gulp.watch([path.SRC_DIR + 'css/*.css'], ['css']);
  gulp.watch([
    path.SRC_DIR + 'img/*.jpg',
    path.SRC_DIR + 'img/*.jpeg',
    path.SRC_DIR + 'img/*.png',
    path.SRC_DIR + 'img/*.gif'], ['img']);
  gulp.watch([path.MANIFEST_FILE], ['manifest']);
});
