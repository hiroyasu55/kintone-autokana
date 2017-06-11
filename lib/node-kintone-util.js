/**
 * kintone API on Node.js
 */

module.exports = function() {
  'use strict';

  var extend = require('extend');

  var CONFIG = {
    MAX_GET_RECORDS: 500,
    MAX_INSERT_RECORDS: 100,
    MAX_UPDATE_RECORDS: 100,
    MAX_DELETE_RECORDS: 100
  };

  /**
   * @constructor
   * @param {string} params.url default:'/'
   * @param {boorean} params.auth.enable
   * @param {string} params.auth.user
   * @param {string} params.auth.password
   * @param {string} params.token
   * @param {number} params.guestSpace ゲストスペースID
   * @param {string} params.maxGetRecords default:500
   * @param {string} params.maxUpdateRecords default:100
   */
  var KintoneUtil = function(params) {
    if (typeof kintone === 'undefined') {
      throw 'kintone object not loaded.';
    }
    params = params || {};

    this.params = {
      url: params.url || '/',
      auth: {
        enable: (params.auth && params.auth.enable === true ? true : false),
        user: (params.auth && params.auth.user === true ? params.auth.user : null),
        password: (params.auth && params.auth.password === true ? params.auth.password : null)
      },
      token: params.token || null,
      guestSpace: params.guestSpace || null,
      maxGetRecords: params.maxGetRecords || CONFIG.MAX_GET_RECORDS,
      maxInsertRecords: params.maxInsertRecords || CONFIG.MAX_INSERT_RECORDS,
      maxUpdateRecords: params.maxUpdateRecords || CONFIG.MAX_UPDATE_RECORDS,
      maxDeleteRecords: params.maxDeleteRecords || CONFIG.MAX_DELETE_RECORDS
    };

    if (this.params.auth.enable === true && (!this.params.auth.user || !this.params.auth.password)) {
      throw 'Auth user and parameter not set.';
    }
  };

  KintoneUtil.prototype.setParams = function(params) {
    this.params = extend(this.params, params);
  };

  /**
   * Get app id
   */
  KintoneUtil.prototype.getId = function () {
    return kintone.app.getId();
  };

  /**
   * URL
   */
  KintoneUtil.prototype.getUrl = function (url, options) {
    var fullUrl = '';
    var _options = options ? extend({}, options) : {};

    if (url.match(/^https?:\/\//)) {
      fullUrl = url;
    } else {
      if (!this.params.url) {
        return null;
      }
      fullUrl = this.params.url.replace(/\/k\/?$/, '').replace(/\/$/, '');
      if (_options.guestSpace) {
        fullUrl += '/k/guest/' + _options.guestSpace + '/v1/';
      } else {
        fullUrl += '/k/v1/';
      }
      fullUrl += url.replace(/^\/?k\/v1\/?/, '').replace(/^\/?k\/?/, '').replace(/^\//, '');
    }
    if (!url.match(/^https?:\/\//)) {
      fullUrl = kintone.api.url(fullUrl.replace(/\.json$/, ''), true);
    }

    return fullUrl;
  };

  /**
   * request
   */
  KintoneUtil.prototype.request = function(url, method, options) {
    var self = this;
    return new kintone.Promise(function(resolve, reject) {
      if (!options.app) {
        reject('[request]app not set.');
        return;
      }
      var _url = self.getUrl(url, {guestSpace: options.guestSpace || null});
      if (!_url) {
        reject('[request]URL is invalid.');
        return;
      }
      kintone.api(
        _url, method, options, function(resp) {
          resolve(resp);
        }, function(error) {
          console.error(JSON.stringify(error));
          reject('[request]' + error.message);
        }
      );
    });
  };

  /**
   * 単一レコード取得
   */
  KintoneUtil.prototype.getRecord = function(options) {
    var self = this;
    return new kintone.Promise(function(resolve, reject) {
      var _options = {};
      _options = extend({}, options);
      if (!_options.app) {
        reject('[getRecord]app not set.');
        return;
      }
      self.request('/k/v1/record', 'GET', _options).then(function (resp) {
        resolve(resp.record);
      }, function (error) {
        reject(error);
      });
    });
  };

  /**
   * 複数レコード取得（再帰呼出し）
   */
  KintoneUtil.prototype._getRecords = function(app, options, records) {
    var self = this;
    return new kintone.Promise(function(resolve, reject) {
      var params = self.params;
      var queryArray = [];
      var queryStr = '';

      if (!app) {
        reject('[getRecords]appが未指定');
        return;
      }
      if (options.recursive === undefined) {
        options.recursive = true;
      }
      if (options.recursive) {
        records = records || [];
        options.offset = options.offset || 0;
      }
      if (options.query) {
        queryArray.push(options.query);
      }
      if (options.limit) {
        options.recursive = false;
        queryArray.push('limit ' + options.limit);
      } else if (options.query.match(/limit\s+\d+/)) {
        options.recursive = false;
      } else {
        queryArray.push('limit ' + params.maxGetRecords);
      }
      if (options.query.match(/offset\s+\d+/)) {
        options.recursive = false;
      } else if (options.offset) {
        queryArray.push('offset ' + options.offset);
      }
      if (queryArray.length > 0) {
        queryStr = queryArray.join(' ');
      }

      var _options = {
        app: app,
        token: options.token || null,
        query: queryStr,
        fields: options.fields || null,
        totalCount: options.totalCount || false
      };

      self.request('/k/v1/records', 'GET', _options).then(function (resp) {
        records = records.concat(resp.records);
        //console.log(JSON.stringify(records));
        var offset = options.offset || 0;
        if (resp.records.length > 0) {
          if (options.totalCount) {
            console.log('[_getRecords]app=' + app + ' records:' + (offset + 1) + '-' + (offset + resp.records.length) + '/' + resp.totalCount);
          } else {
            console.log('[_getRecords]app=' + app + ' records:' + (offset + 1) + '-' + (offset + resp.records.length));
          }
        }
        if (resp.records.length === params.maxGetRecords) {
          options.offset += resp.records.length;
          self._getRecords(app, options, records).then(function(result) {
            resolve(result);
          });
          return;
        }

        var result = {
          records: records
        };
        if (resp.totalCount !== undefined && resp.totalCount !== null) {
          result.totalCount = resp.totalCount;
        }
        resolve(result);
      }).catch(function (error) {
        console.log('[_getRecords]query:' + _options.query);
        reject(error);
      });
    });
  };

  /**
   * 複数レコード取得
   * @param {number} app アプリID（必須）
   * @param {String} options.query クエリ文
   * @param {number} options.limit 取得件数（クエリ文のlimit句が優先）
   * @param {number} options.offset オフセット（クエリ文のoffset句が優先）
   * @param {Array[]} options.fields 値を取得するフィールド（デフォルト：全件）
   * @param {Array[]} options.totalCount 条件に該当するレコード数を取得する場合はTrue
   * @param {boorean} options.recursive 再帰的に全件読み込む場合はTrue(default:true)
   * @return {Promise}
   */
  KintoneUtil.prototype.getRecords = function(app, options) {
    var self = this;
    return self._getRecords(app, options);
  };

  /**
   * レコード更新
   * @param {number} app アプリID（必須）
   * @param {Object} record 更新レコード
   * @return {Promise}
   */
  KintoneUtil.prototype.updateRecord = function(app, record) {
    var self = this;
    return new kintone.Promise(function (resolve, reject) {
      var _options = {
        app: app,
        record: record
      };
      self.request('/k/v1/record', 'PUT', _options).then(function (resp) {
        resolve(resp.record);
      }, function (error) {
        reject(error);
      });
    });
  };

  KintoneUtil.prototype._updateRecords = function(app, records, result, offset) {
    var self = this;
    var params = self.params;
    result = result || {records: []};
    offset = offset || 0;
    return new kintone.Promise(function (resolve, reject) {
      var _records = records.slice(offset, Math.min(offset + params.maxUpdateRecords, records.length));
      if (_records.length === 0) {
        resolve(result);
        return;
      }
      console.log('[_updateRecords]updating app=' + app + ' ' + (offset + 1) + '-' + (offset + _records.length) + '/' + records.length);
      var _options = {
        app: app,
        records: _records
      };
      //console.log(_options);
      self.request('/k/v1/records', 'PUT', _options).then(function (resp) {
        console.log('[_updateRecords]app=' + app + ' ' + resp.records.length + ' records updated.');
        result = {records: result.records.concat(resp.records)};
        offset += resp.records.length;
        if (resp.records.length >= params.maxUpdateRecords) {
          self._updateRecords(app, records, result, offset).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
          return;
        }
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  };

  /**
   * 複数レコード更新
   * @param {number} app アプリID（必須）
   * @param {Array[]} records 更新レコード
   * @return {Promise}
   */
  KintoneUtil.prototype.updateRecords = function(app, records) {
    var self = this;
    return self._updateRecords(app, records, 0);
  };

  /**
   * フォーム取得
   * @param {number} app アプリID（必須）
   * @return {Promise} response
   */
  KintoneUtil.prototype.getForm = function(app) {
    var self = this;
    var _options = {
      app: app
    };
    return self.request('/k/v1/form', 'GET', _options);
  };

  /**
   * 開発中フォーム取得
   * @param {number} app アプリID（必須）
   * @return {Promise} response
   */
  KintoneUtil.prototype.getPreviewForm = function(app) {
    var self = this;
    var _options = {
      app: app
    };
    return self.request('/k/v1/preview/form', 'GET', _options);
  };

  /**
   * 開発中フォーム取得
   * @param {number} app アプリID（必須）
   * @return {Promise} response
   */
  KintoneUtil.prototype.getPluginConfig = function(pluginId) {
    return kintone.plugin.app.getConfig(pluginId);
  };

  /**
   * escape HTML
   */
  KintoneUtil.escapeHtml = function (str) {
    var string = str;
    if (!string) {
      return '';
    }
    string = string.replace(/&/g, '&amp;');
    string = string.replace(/</g, '&lt;');
    string = string.replace(/>/g, '&gt;');
    string = string.replace(/"/g, '&quot;');
    string = string.replace(/'/g, '&#39;');
    return string;
  };

  /**
   * Base64 encode
   */
  KintoneUtil.base64encode = function (text) {
    return new Buffer(text).toString('base64');
  };

  /**
   * Base64 decode
   */
  KintoneUtil.base64decode = function (text) {
    return new Buffer(text, 'base64').toString();
  };

  /**
   * クエリ文字列エスケープ
   */
  KintoneUtil.escapeQueryString = function (str) {
    if (!str) {
      return '';
    }
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (chr) {
      switch (chr) {
      case '\0':
        return '\\0';
      case '\x08':
        return '\\b';
      case '\x09':
        return '\\t';
      case '\x1a':
        return '\\z';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '"':
      case '\'':
      case '\\':
      case '%':
        return '\\' + chr;
      }
    });
  };

  return KintoneUtil;
}();
