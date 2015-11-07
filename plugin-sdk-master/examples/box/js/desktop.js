jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";

    $(function() {
        var BOX_CLIENT_ID = "wkgp4k64whsha8mwvg7k5k63cim82mmv";
        // localStorage
        var LOCAL_STORAGE_PREFIX = "kintone.plugin." + PLUGIN_ID;
        var LOCAL_STORAGE_JUDGED_ALLOW_ACCESS = LOCAL_STORAGE_PREFIX + ".judgedAllowAccess";

        var config;

        var BOX_EMBED_WIDTH = 540;
        var BOX_EMBED_HEIGHT = 420;
        var API_BASE_PATH = "https://api.box.com/2.0";

        var terms = {
            "en": {
                "failed_to_create_folder": "Cannot create new folder.",
                "failed_to_create_shared_link": "Cannot create a shared link.",
                "enter_key_field": "kintone key field is required.",
                "error": "Error:"
            },
            "ja": {
                "failed_to_create_folder": "フォルダを作成できません。",
                "failed_to_create_shared_link": "共有リンクを作成できません。",
                "enter_key_field": "kintoneキーフィールドは必須です。",
                "error": "Error:"
            }
        };
        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang] : terms["en"];

        var getUrl = function(path) {
            var matchedGuestSpacePath = location.pathname.match(/^\/k\/(guest\/\d+\/)/);
            var guestSpacePath = "";
            if (matchedGuestSpacePath !== null && matchedGuestSpacePath.length === 2) {
                guestSpacePath = matchedGuestSpacePath[1]; // "guest/<space_id>/"
            }
            var apiPath = "/k/" + guestSpacePath + path;
            return apiPath;
        };

        var boxApi = {
            clientInfo: {"provider": "box", "client": BOX_CLIENT_ID},

            getAccessToken: function() {
                // add a hash parameter for distinguishing OAuth redirect
                var delimiter = (location.hash.indexOf("#") === 0) ? "&" : "#";
                location.hash += delimiter + PLUGIN_ID + ".oauth_redirect=true";
                kintone.oauth.redirectToAuthenticate(this.clientInfo, location.href);
            },
            hasAccessToken: function() {
                return kintone.oauth.hasAccessToken(boxApi.clientInfo);
            }
        };

        var validateConfig = function(record) {
            config = kintone.plugin.app.getConfig(PLUGIN_ID);
            if (!config) return false;
            return true;
        };

        var decorateBoxLinkField = function(boxUrl) {

            var boxLinkPattern = /^https:\/\/([a-zA-Z0-9]+).box.(com|net)(\/s\/[a-z0-9]+)$/;
            var match = boxUrl.match(boxLinkPattern);
            if (!match) {
                return;
            }
            var iframeSrc = 
                "https://app.box.com/embed_widget/000000000000"+
                match[3]+
                "?theme=gray"+
                "&show_parent_path=no"+
                "&show_item_feed_actions=no"+
                "&partner_id=233";

            var elEmbed = kintone.app.record.getFieldElement(config.boxUrl);
            if (elEmbed == null) return;
            $(elEmbed).empty();

            var width = BOX_EMBED_WIDTH;
            var height = BOX_EMBED_HEIGHT;

            $(elEmbed).parent().css({"width": (width + 100) + "px", "height": "auto", "background-color": "rgba( 255, 255, 255, 0 )"});
            var embedIframe = $("<iframe></iframe>",{
                src:iframeSrc,
                width:width,
                height:height,
                frameborder:"0",
                allowfullscreen:"true",
                allowscriptaccess:"always"
            });
            $(elEmbed).append(embedIframe)
        };

        var syncApi = function(url, method, data, success, error) {

            url = API_BASE_PATH + url;

            // "GET" method
            if (method === "GET") {
                url = [url, "?", $.param(data)].join("");
                data = {};
            }

            var xmlHttp = new XMLHttpRequest();

            xmlHttp.open("POST", kintone.api.url(getUrl("api/oauth/call")), false);

            var body = {};
            body["__REQUEST_TOKEN__"] = kintone.getRequestToken();
            body.body = data == null ? {} : data;
            body.headers = {};
            body.method = method;
            body.url = url;
            body.providerCode = "box";
            body.clientId = BOX_CLIENT_ID;

            xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xmlHttp.setRequestHeader("Content-Type", "application/json");
            xmlHttp.send(JSON.stringify(body));

            var json = $.parseJSON(xmlHttp.responseText);

            if (xmlHttp.status !== 200) {
                if (typeof error === "function") {
                    if (json) {
                        error({type: "error", code: json.code, message: json.message});
                    } else {
                        error({type: "error", code: "kintone_proxy_error", message: xmlHttp.status});
                    }
                }
                return;
            }

            var status = Number(json.result.status);
            var response = $.parseJSON(json.result.body);
            if (status >= 200 && status < 300) {
                success(response);
            } else if (typeof error === "function") {
                error(response);
            }
        };

        /*
         */
        var judgedAllowAccessFlag = {
            isSet: function() {
                    return (localStorage.getItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS) !== null);
                },

            set: function() {
                    localStorage.setItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS, "true");
                },

            remove: function() {
                localStorage.removeItem(LOCAL_STORAGE_JUDGED_ALLOW_ACCESS);
            }
        };

        var createSharedLink = function(folderId) {
            var d = new $.Deferred();

            var errorHandler = function(response) {
                d.reject(response);
            };

            var folderPath = "/folders/" + folderId;
            var createLinkParam = {shared_link: {access: config.access}};
            if (config.prohibitToDownload === "true") {
                createLinkParam.shared_link.permissions = {can_download: false, can_preview: true};
            }

            syncApi(folderPath, "PUT", createLinkParam, function(response) {
                var sharedUrl = getNormalizedSharedUrlFromResponse(response);
                d.resolve(sharedUrl);
            }, errorHandler);

            return d.promise();
        };

        var createBoxFolder = function(record) {
            var d = new $.Deferred();
            var errorHandler = function(response) {
                    d.reject(response);
                };

            var name = record[config.keyFld].value;
            var createParam = {name: name, parent: {id: config.folderId}};
            syncApi("/folders", "POST", createParam, function(response) {
                d.resolve(response.id);
            }, function(res) {
                // find the folder if it already exists.
                if (res.status && res.status === 409) {
                    if (res.context_info
                        && res.context_info.conflicts
                        && res.context_info.conflicts.length > 0) {
                        d.resolve(res.context_info.conflicts[0].id);
                        return;
                    }
                }
                errorHandler(res);
            });

            return d.promise();
        };

        var getNormalizedSharedUrlFromResponse = function(response) {
            var sharedLink = response.shared_link;
            if (!sharedLink) {
                return null;
            }

            var sharedUrl = sharedLink.url;
            if (!sharedLink) {
                return null;
            }

            return sharedUrl.replace(/([a-zA-Z0-9_-]*)\.box\.(net|com)\//, "app.box.com/");
        };

        kintone.events.on("app.record.detail.show", function(e) {
            if (validateConfig(e.record)) {
                var boxUrl = e.record[config.boxUrl].value;
                if (!e.record[config.boxUrl].value) {

                    var elEmbed = kintone.app.record.getFieldElement(config.boxUrl);
                    if (elEmbed == null) return null;
                    $(elEmbed).empty();

                } else {
                    decorateBoxLinkField(boxUrl);
                }
            }

            return e;
        });

        var checkAccessToken = function() {
            var oauth_redirect_param = PLUGIN_ID + ".oauth_redirect=true";
            if (location.hash.indexOf(oauth_redirect_param) !== -1) {
                judgedAllowAccessFlag.set();

                // remove a hash parameter
                location.hash = location.hash.replace(oauth_redirect_param, "");

                var t = setInterval(function() {
                    if (location.hash.indexOf(oauth_redirect_param) !== -1) {
                        // cancel button was clicked
                        clearInterval(t);
                        location.href = getUrl(kintone.app.getId() + "/");
                    }
                }, 500);
            } else {
                if (!judgedAllowAccessFlag.isSet() || !boxApi.hasAccessToken()) {
                    kintone.oauth.clearAccessToken(boxApi.clientInfo, function(body, status, headers) {
                        boxApi.getAccessToken();
                        return null;
                    });
                }
            }
        };

        var submitRecord = function(e) {
            if (!validateConfig(e.record)) {
                e.error = i18n.failed_to_create_folder;
                return e;
            }

            if (!e.record[config.keyFld] || !e.record[config.boxUrl]) {
                e.error = i18n.failed_to_create_folder;
                return e;
            }

            if (!e.record[config.keyFld].value) {
                e.record[config.keyFld].error = i18n.enter_key_field;
                return e;
            }

            var error = null;
            createBoxFolder(e.record).then(function(id) {
                return createSharedLink(id);
            }, function(res) {
                if (res) {
                    error = i18n.failed_to_create_folder + " " + i18n.error + res.message;
                }
                return false;
            }).then(function(sharedUrl) {
                if (sharedUrl) {
                    e.record[config.boxUrl].value = sharedUrl;
                }
            }, function(res) {
                if (res) {
                    error = i18n.failed_to_create_shared_link + " " + i18n.error + res.message;
                }
                return false;
            });
            if (error) e.error = error;

            return e;
        };

        kintone.events.on("app.record.create.submit", function(e) {
            return submitRecord(e);
        });

        kintone.events.on("app.record.edit.submit", function(e) {
            if (!e.record[config.boxUrl].value) {
                return submitRecord(e);
            }
            return undefined;
        });

        kintone.events.on("app.record.create.show", function(e) {
            if (validateConfig(e.record)) {
                checkAccessToken();
                e.record[config.boxUrl]["disabled"] = true;
            }

            return e;
        });

        kintone.events.on("app.record.edit.show", function(e) {
            if (validateConfig(e.record)) {
                if (!e.record[config.boxUrl].value) {
                    checkAccessToken();
                } else {
                    e.record[config.keyFld]["disabled"] = true;
                }
                e.record[config.boxUrl]["disabled"] = true;
            }
            return e;
        });

        kintone.events.on("app.record.index.edit.show", function(e) {
            if (validateConfig(e.record)) {
                e.record[config.boxUrl]["disabled"] = true;
                e.record[config.keyFld]["disabled"] = true;
            }
            return e;
        });
    });
})(jQuery, kintone.$PLUGIN_ID);
