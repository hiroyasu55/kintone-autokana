/**
 * Gulp file
 */

/* jshint -W024 */
(function() {
  'use strict';

  var gulp = require('gulp');
  var util = require('gulp-util');
  var browserify = require('browserify');
  var source = require('vinyl-source-stream');
  var child = require('child_process');
  var fs = require('fs-extra');

  var path = {
    SRC_DIR: './src/',
    LIB_DIR: './lib/',
    MODULES_DIR: './modules/',
    PLUGIN_DIR: './plugin/',
    PACKAGES_DIR: './packages/'
  };
  path.SDK_DIR = path.MODULES_DIR + 'plugin-sdk/';
  path.PACKAGE_SH = path.SDK_DIR + 'package.sh';
  path.PLUGINS_DIR = path.PACKAGES_DIR + 'plugins/';
  path.KEY_TEXT_FILE = path.PACKAGES_DIR + 'key.txt';
  path.KEYS_DIR = path.PACKAGES_DIR + 'keys/';
  path.RELEASE_DIR = path.PACKAGES_DIR + 'release/';
  path.MANIFEST_FILE = path.PLUGIN_DIR + 'manifest.json';

  // Initialise plugin dir
  var initPluginDir = function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    fs.readdir(path.PLUGIN_DIR, function (err, files) {
      if (err) {
        console.error(err);
        return;
      }
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.match(/^\./)) {
          fs.unlink(path.PLUGIN_DIR + file);
        }
      }
    });
  };

  // Get key file
  var getKeyFile = function () {
    return new Promise(function (resolve, reject) {
      fs.access(path.KEY_TEXT_FILE, function (err) {
        var keyFile = null;
        if (err) {
          if (err.code !== 'ENOENT') {
            reject(err);
            return;
          }
          //console.log('key.txt not exists.');
          fs.readdir(path.KEYS_DIR, function (err, files) {
            if (err) {
              reject(err);
              return;
            }
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              if (file.match(/^plugin\..+\.ppk/)) {
                keyFile = path.KEYS_DIR + file;
                break;
              }
            }
            resolve(keyFile);
          });
          return;
        }
        fs.readFile(path.KEY_TEXT_FILE, 'utf-8', function (err, text) {
          if (err) {
            reject(err);
            return;
          }
          keyFile = path.PACKAGES_DIR + 'keys/plugin.' + text + '.ppk';
          resolve(keyFile);
        });
      });
    });
  };

  // Read manifest file and return JSON
  var readManifestFile = function (manifestFile) {
    manifestFile = manifestFile || path.MANIFEST_FILE;
    return new Promise(function (resolve, reject) {
      fs.readFile(manifestFile, 'utf-8', function (err, text) {
        if (err) {
          reject(err);
          return;
        }
        var json = JSON.parse(text);
        resolve(json);
      });
    });
  };

  // plugin.js
  gulp.task('plugin.js', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    browserify({
      entries: [path.SRC_DIR + 'js/plugin.js'],
      extensions: ['.js'],
      debug: true
    }).on('error', function(err) {
      console.log(util.colors.red('ERROR! \n' + err.message));
      this.emit('end');
    }).bundle()
      .pipe(source('plugin.js'))
      .pipe(gulp.dest(path.PLUGIN_DIR + 'js/'));
  });

  // config.js
  gulp.task('config.js', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    browserify({
      entries: [path.SRC_DIR + 'js/config.js'],
      extensions: ['.js'],
      debug: true
    }).on('error', function(err) {
      console.log(util.colors.red('ERROR! \n' + err.message));
      this.emit('end');
    }).bundle()
      .pipe(source('config.js'))
      .pipe(gulp.dest(path.PLUGIN_DIR + 'js/'));
  });

  // html
  gulp.task('html', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    gulp.src([path.SRC_DIR + 'html/*.html'])
      .pipe(gulp.dest(path.PLUGIN_DIR + 'html'));
  });

  // css
  gulp.task('css', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    gulp.src([path.SRC_DIR + 'css/*.css'])
      .pipe(gulp.dest(path.PLUGIN_DIR + 'css'));
  });

  // img
  gulp.task('img', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    gulp.src([
      path.SRC_DIR + 'img/*.jpg',
      path.SRC_DIR + 'img/*.jpeg',
      path.SRC_DIR + 'img/*.png',
      path.SRC_DIR + 'img/*.gif'])
      .pipe(gulp.dest(path.PLUGIN_DIR + 'img'));
  });

  // manifest
  gulp.task('manifest', function() {
    fs.mkdirsSync(path.PLUGIN_DIR);
    gulp.src([path.SRC_DIR + 'manifest.json'])
      .pipe(gulp.dest(path.PLUGIN_DIR));
  });

  // package
  gulp.task('package', ['default'], function() {
    initPluginDir();
    getKeyFile().then(function (keyFile) {
      var cmd = 'bash ' + path.PACKAGE_SH + ' ' + path.PLUGIN_DIR;
      if (keyFile) {
        cmd += ' ' + keyFile;
      }
      try {
        var result = child.execSync(cmd);
        console.log(result.toString());
        if (keyFile) {
          var key = keyFile.replace(/^.*\/plugin\.(.+)\.ppk$/, '$1');
          fs.writeFile(path.KEY_TEXT_FILE, key);
        }
      } catch (e) {
        console.error(e.message);
        return;
      }
    });
  });

  // package for release
  gulp.task('package-release', ['package'], function() {
    var manifest = null;
    readManifestFile().then(function (json) {
      manifest = json;
      return getKeyFile();
    }).then(function (keyFile) {
      var key = keyFile.replace(/^.*\/plugin\.(.+)\.ppk$/, '$1');
      var pluginFile = path.PLUGINS_DIR + key + '/plugin.zip';
      var name = manifest['plugin_name'] || 'plugin';
      var version = manifest.version;
      if (manifest.revision) {
        version += '_' + manifest.revision;
      }
      var releaseFile = name + '_' + version + '.zip';
      fs.copy(pluginFile, path.RELEASE_DIR + releaseFile);
    }).catch(function (error) {
      console.error(error);
    });
  });

  // default
  gulp.task('default', [
    'plugin.js', 'config.js', 'html', 'css', 'img', 'manifest'
  ]);

  // watch
  gulp.task('watch', function() {
    gulp.watch([path.SRC_DIR + 'js/plugin.js', path.SRC_DIR + 'lib/**/*.js'], ['plugin.js']);
    gulp.watch([path.SRC_DIR + 'js/config.js', path.SRC_DIR + 'lib/**/*.js'], ['config.js']);
    gulp.watch([path.SRC_DIR + 'html/*.html'], ['html']);
    gulp.watch([path.SRC_DIR + 'css/*.css'], ['css']);
    gulp.watch([
      path.SRC_DIR + 'img/*.jpg',
      path.SRC_DIR + 'img/*.jpeg',
      path.SRC_DIR + 'img/*.png',
      path.SRC_DIR + 'img/*.gif'], ['img']);
    gulp.watch([path.MANIFEST_FILE], ['manifest']);
  });
})();
