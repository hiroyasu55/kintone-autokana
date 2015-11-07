jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";
    $(function() {
        var terms = {
            "en": {
                "folder_id": "Box Parent Folder ID",
                "key_fld": "kintone Key Field",
                "key_fld_description": "Single-line text field (must be unique)",
                "box_url": "Box Shared Link Field",
                "box_url_description": "Single-line text or link field",
                "access": "Box Shared Link Permissions",
                "plugin_submit": "     Save   ",
                "plugin_cancel": "     Cancel   ",
                "required_field": "Please enter the required field.",
                "invalid_folder_id": "Invalid folder ID.",
                "fields_are_same": "The values of the "kintone Key Field" and "Box Shared Link Field" fields must be different.",
                "prohibit_to_download": "Allow file download only to collaborators"
            },
            "ja": {
                "folder_id": "Box親フォルダID",
                "key_fld": "kintoneキーフィールド",
                "key_fld_description": "文字列（1行）フィールド（重複禁止）",
                "box_url": "Box共有リンクの格納先",
                "box_url_description": "文字列（1行）またはリンクフィールド",
                "access": "Box共有リンクのアクセス権",
                "plugin_submit": "     保存   ",
                "plugin_cancel": "  キャンセル   ",
                "required_field": "必須項目を入力してください。",
                "invalid_folder_id": "フォルダIDが不正です。",
                "fields_are_same": "「kintoneキーフィールド」と「Box共有リンクの格納先」には、同じフィールドを指定できません。",
                "prohibit_to_download": "コラボレータにのみダウンロードを許可する"
            }
        };

        var getUrl = function(path) {
            var matchedGuestSpacePath = location.pathname.match(/^\/k\/(guest\/\d+\/)/);
            var guestSpacePath = "";
            if (matchedGuestSpacePath !== null && matchedGuestSpacePath.length === 2) {
                guestSpacePath = matchedGuestSpacePath[1]; // "guest/<space_id>/"
            }
            var apiPath = "/k/" + guestSpacePath + path;
            return apiPath;
        };

        var changeAccess = function() {
            var $check = $("#prohibit_to_download_row");
            var access = $("#access").val();
            if (access == "open" || access == "company") {
                $check.show();
            } else {
                $check.hide();
            }
        };


        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang]: terms["en"];

        var html = $("#boxPlugin-config-cybozu").html();
        var tmpl = $.templates(html);
        $("div#boxPlugin-config-cybozu").html(tmpl.render({"terms": i18n}));
        $("#access").change(function() {
            changeAccess();
        });
        kintone.api(getUrl("v1/preview/form"), "GET", {"app": kintone.app.getId()}, function(resp) {
            for (var i = 0; i < resp.properties.length; i++) {
                var prop = resp.properties[i];
                if (prop["type"] == "SINGLE_LINE_TEXT" || (prop["type"] == "LINK" && prop["protocol"] == "WEB")) {
                    $("#box_url").append($("<OPTION>").text(prop["label"]).val(prop["code"]));
                }

                if (prop["type"] == "SINGLE_LINE_TEXT" && prop["unique"] == "true") {
                    $("#key_fld").append($("<OPTION>").text(prop["label"]).val(prop["code"]));
                }
            }

            var config = kintone.plugin.app.getConfig(PLUGIN_ID);
            config["folderId"] && $("#folder_id").val(config["folderId"]);
            config["keyFld"] && $("#key_fld").val(config["keyFld"]);
            config["boxUrl"] && $("#box_url").val(config["boxUrl"]);
            config["access"] && $("#access").val(config["access"]);
            config["prohibitToDownload"] && $("#prohibit_to_download").prop("checked", (config["prohibitToDownload"] == "true"));
            changeAccess();
        });

        $("#plugin_submit").click(function() {
            var folderId = $("#folder_id").val();
            var keyFld = $("#key_fld").val();
            var boxUrl = $("#box_url").val();
            var access = $("#access").val();
            var prohibitToDownload = false;
            if (access == "company" || access == "open") {
                prohibitToDownload = $("#prohibit_to_download").prop("checked");
            }
            if (!folderId.match(/^[0-9]+$/) || folderId.length > 20) {
                alert(i18n.invalid_folder_id);
                return;
            }
            if (keyFld == null || boxUrl == null || access == null) {
                alert(i18n.required_field);
                return;
            }
            if (folderId.length == 0 || keyFld.length == 0 || boxUrl.length == 0 || access.length == 0) {
                alert(i18n.required_field);
                return;
            }
            if (keyFld == boxUrl) {
                alert(i18n.fields_are_same);
                return;
            }
            var config = {};
            config["folderId"] = folderId;
            config["keyFld"] = keyFld;
            config["boxUrl"] = boxUrl;
            config["access"] = access;
            config["prohibitToDownload"] = prohibitToDownload.toString();

            kintone.plugin.app.setConfig(config);
        });

        $("#plugin_cancel").click(function() {
            history.back();
        });

    });
})(jQuery, kintone.$PLUGIN_ID);