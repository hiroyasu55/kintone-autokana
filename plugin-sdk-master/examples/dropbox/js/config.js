jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";

    $(function() {
        var terms = {
            en: {
                shared_link_field: 'Dropbox Shared Link Field',
                shared_link_field_desc: 'Single-line text or multi-line text field',
                display_blank_space: 'Dropbox Files Display Field',
                display_blank_space_desc: 'Blank Space field(Only Blank space fields that have Element IDs set will be shown below)',
                thumbnail: 'Thumbnail',
                use_thumbnail: 'Show thumbnail',
                submit: 'Save',
                cancel: 'Cancel'
            },
            ja: {
                shared_link_field: 'Dropboxリンクの保存フィールド',
                shared_link_field_desc: '文字列（1行）または文字列（複数行）',
                display_blank_space: 'ファイル表示スペース',
                display_blank_space_desc: 'スペース要素 (スペース要素IDが設定されていないスペースは表示されません)',
                thumbnail: 'サムネイル',
                use_thumbnail: 'サムネイルを使用する',
                submit: '保存',
                cancel: 'キャンセル'
            }
        };

        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang] : terms.en;

        var $id = function(name) {
            return $('#dropbox-plugin' + (name ? '-' + name : ''));
        };

        $id().html($id('config-template').render({terms: i18n}));

        var $sharedLinkField = $id('shared-link-field');
        var $displaySpaceField = $id('display-space-field');
        var $useThumbnail = $id('use-thumbnail');
        var $submit = $id('submit');
        var $cancel = $id('cancel');

        function changeSubmitAvailability(enabled) {
            if (enabled) {
                $submit.removeClass('button-disabled-cybozu');
            }else {
                $submit.addClass('button-disabled-cybozu');
            }
        }

        $sharedLinkField.change(function() {
            changeSubmitAvailability($(this).val());
        });
        $displaySpaceField.change(function() {
            changeSubmitAvailability($(this).val());
        });

        // load & restore configuration
        var config = kintone.plugin.app.getConfig(PLUGIN_ID);
        var useThumbnailConfig = false;
        $useThumbnail.prop('checked', useThumbnailConfig);

        kintone.api(kintone.api.url('/k/v1/preview/form', true), 'GET', {app: kintone.app.getId()}, function(resp) {
            for (var i = 0; i < resp.properties.length; i++) {
                var prop = resp.properties[i];
                if (prop.type === 'SINGLE_LINE_TEXT' || prop.type === 'MULTI_LINE_TEXT') {
                    $sharedLinkField.append($('<OPTION>').text(prop.label).val(prop.code));
                }
                if (prop.type === 'SPACER' && prop.elementId) {
                    $displaySpaceField.append($('<OPTION>').text(prop.elementId).val(prop.elementId));
                }
            }

            if (config.sharedLinkField && $id('shared-link-field option[value="' + config.sharedLinkField + '"]').length !== 0 && config.displaySpaceField && $id('display-space-field option[value="' + config.displaySpaceField + '"]').length !== 0) {
                $sharedLinkField.val(config.sharedLinkField);
                $displaySpaceField.val(config.displaySpaceField);
                changeSubmitAvailability($sharedLinkField.val());
                changeSubmitAvailability($displaySpaceField.val());
            }
        });

        $submit.click(function() {
            // save configuration
            var sharedLinkField = $sharedLinkField.val();
            var displaySpaceField = $displaySpaceField.val();

            if (!sharedLinkField) {
                return;
            }

            var config = {};
            config.sharedLinkField = sharedLinkField;
            config.displaySpaceField = displaySpaceField;
            config.useThumbnail = $useThumbnail.prop('checked').toString();
            kintone.plugin.app.setConfig(config);
        });

        $cancel.click(function() {
            history.back();
        });

    });

})(jQuery, kintone.$PLUGIN_ID);
