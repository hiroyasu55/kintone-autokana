/* jshint strict: true */
jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";

    document.write('<script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="3qqo6tmqq58a35d"></script>'); // jshint ignore:line
    $(function() {

        var terms = {
            en: {
                edit: 'Edit',
                save: 'Save',
                cancel: 'Cancel',
                file_sharing_warning: '(Choosed files will be shared.)',
                error_conflict: 'Reload the record. The record has been changed by another user while you are editing.',
                not_editable: 'Editable in the details page.',
                unsupport_saving: 'The Dropbox shared link data is not saved on a test environment.'
            },
            ja: {
                edit: '編集',
                save: '保存',
                cancel: 'キャンセル',
                file_sharing_warning: '（選択されたファイルは共有状態になります。）',
                error_conflict: 'レコードを再読み込みしてください。編集中に、ほかのユーザーがレコードを更新しました。',
                not_editable: 'レコードの詳細画面で編集できます。',
                unsupport_saving: 'Dropbox共有リンクはテスト環境では保存できません。'
            }
        };

        var lang = kintone.getLoginUser().language;
        var i18n = (lang in terms) ? terms[lang] : terms.en;
        var config;
        var originalFiles;
        var currentFiles;
        var revision;
        var appRecordIndexEditShowEvent;

        function validateConfig(e) {
            config = kintone.plugin.app.getConfig(PLUGIN_ID);

            switch (e.type) {
            case 'app.record.create.show':
            case 'app.record.edit.show':
            case 'app.record.detail.show':
                if (typeof e.record[config.sharedLinkField] === 'undefined') {
                    return false;
                }
                break;

            case 'app.record.index.show':
            case 'app.record.index.edit.show':
                var fields = kintone.app.getFieldElements(config.sharedLinkField);
                if (fields === null || fields.length === 0) {
                    return false;
                }
                break;

            default:
                return false;
            }

            return true;
        }

        function bytesToSize(bytes) {
            if (bytes === 0) {
                return '0 byte';
            }
            var k = 1024;
            var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }

        function createDropboxFileListForIndexPage(files) {
            /* jshint multistr: true */
            var template = '\
<ul>\
  {{for files}}\
    {{if ~root.useThumbnail}}\
      {{if thumbnailLink}}\
        <li class="file-image-container-gaia">\
          <a href="{{>link}}" target="_blank" style="cursor: pointer;"><img src="{{>thumbnailLink}}" title="{{>name}}" class="gaia-ui-slideshow-thumbnail" /></a>\
        </li>\
      {{else}}\
        <li class="file-image-container-gaia">\
          <a href="{{>link}}" target="_blank"><img src="{{>icon}}" width=24 /><span>{{>name}}</span></a>\
        </li>\
      {{/if}}\
    {{else}}\
      <li class="file-image-container-gaia">\
        <a href="{{>link}}" target="_blank"><img src="{{>icon}}" width=24 /><span>{{>name}}</span></a>\
      </li>\
    {{/if}}\
  {{/for}}\
</ul>';

            if (files.length > 0) {
                return $.templates(template).render({files: files, useThumbnail: config.useThumbnail === 'true'});
            }else {
                return '<div></div>';
            }
        }

        function $createDropboxFileListForDetailPage(files) {
            /* jshint multistr: true */
            var template = '\
<ul>\
  {{for files}}\
    <li style="list-style:none;">\
    {{if ~root.useThumbnail}}\
      {{if thumbnailLink}}\
        <a href="{{>link}}" target="_blank"><img src="{{>thumbnailLink}}" title="{{>name}} ({{:size}})"  /></a>\
      {{else}}\
        <a href="{{>link}}" target="_blank"><img src="{{>icon}}" width=24 /><span>{{>name}}</span></a> <span style="font-size: 12px;">({{:size}})</span>\
      {{/if}}\
    {{else}}\
      <a href="{{>link}}" target="_blank"><img src="{{>icon}}" width=24 /><span>{{>name}}</span></a> <span style="font-size: 12px;">({{:size}})</span>\
    {{/if}}\
    </li>\
  {{/for}}\
</ul>';

            for (var i = 0; i < files.length; i++) {
                files[i].size = bytesToSize(files[i].bytes);
            }

            return $($.templates(template).render({files: files, useThumbnail: config.useThumbnail === 'true'}));
        }

        function createDropboxFileListEditRaw(files) {
            /* jshint multistr: true */
            var template = '\
<div id="dropbox-plugin-filelist" class="input-file-filelist-cybozu">\
  {{for files}}\
    <div class="plupload_delete input-file-item-cybozu" id="dropbox-plugin-file-{{:index}}">\
      <div class="plupload_file_name" title="{{>name}}">\
        <a href="{{>link}}" target="_blank"><span>{{>name}}</span></a>\
      </div>\
      <div class="plupload_file_action">\
        <a href="javascript:void(0)" id="dropboxPluginFileDelete-{{:index}}"></a>\
      </div>\
      <div class="plupload_file_size">{{:size}}</div>\
      <div class="plupload_clearer"></div>\
    </div>\
  {{/for}}\
</div>';
            for (var i = 0; i < files.length; i++) {
                files[i].index = i;
                files[i].size = bytesToSize(files[i].bytes);
            }

            return $.templates(template).render({files: files});
        }

        function attachFileDeleteEvent() {
            $('a[id|="dropboxPluginFileDelete"]').click(function(e) {
                var id = $(this).attr('id');
                var index = parseInt(id.substring('dropboxPluginFileDelete-'.length), 10);
                $('#dropbox-plugin-file-' + index).remove();

                var target = -1;
                for (var i = 0; i < currentFiles.length; i++) {
                    if (currentFiles[i].index === index) {
                        target = i;
                        break;
                    }
                }
                if (target !== -1) {
                    currentFiles.splice(target, 1);
                }

                //$('#dropbox-plugin-save').removeClass('button-disabled-cybozu');
            });
        }

        function $createDropboxFileListEdit(files) {
            var $outer = $('<div class="input-file-cybozu dropbox-plugin-filelist-edit-outer"></div>');
            $outer.append(createDropboxFileListEditRaw(files));

            var $chooserOuter = $('<div class="dropbox-plugin-chooser-outer"></div>');
            $outer.append($chooserOuter);
            // Dropbox Chooser
            var options = {
                success: function(files) {
                    currentFiles = currentFiles.concat(files);
                    $('#dropbox-plugin-filelist').replaceWith(createDropboxFileListEditRaw(currentFiles));

                    // attach click event
                    attachFileDeleteEvent();
                },
                linkType: "preview",
                multiselect: true
            };
            var chooser = Dropbox.createChooseButton(options);
            $chooserOuter.append(chooser);

            var constraints = $.templates('<p class="input-constraints-cybozu">{{>terms.file_sharing_warning}}</p>').render({terms: i18n});
            $chooserOuter.append(constraints);
            //var $saveButton = $($.templates('<button id="dropbox-plugin-save" class="button-simple-cybozu dialog-ok-button-cybozu button-disabled-cybozu" type="button">{{>terms.save}}</button>').render({terms: i18n}));
            var $saveButton = $($.templates('<button id="dropbox-plugin-save" class="button-simple-cybozu dialog-ok-button-cybozu" type="button">{{>terms.save}}</button>').render({terms: i18n}));
            $saveButton.click(function() {
                if (/^\/k\/(guest\/\d+\/)*admin\/preview\//.test(window.location.pathname)) {
                    alert(i18n.unsupport_saving);
                    return;
                }

                // remove properties added by the plugin
                for (var i = 0; i < currentFiles.length; i++) {
                    delete currentFiles[i].index;
                    delete currentFiles[i].size;
                }

                var record = {};
                record[config.sharedLinkField] = {value: JSON.stringify(currentFiles)};
                var params = {
                    app: kintone.app.getId(),
                    id: kintone.app.record.getId(),
                    record: record,
                    revision: revision
                };
                kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params, function(resp) {
                    revision = parseInt(resp.revision, 10);
                    originalFiles = currentFiles.concat();
                    recordDetailShowHandler(currentFiles);
                }, function(error) {
                    if (error.code === "GAIA_CO02") { // conflict error
                        alert(i18n.error_conflict);
                    }else if (error.message) { // other errors
                        alert(error.message);
                    }else { // something happened
                        alert(error);
                    }
                });
            });
            $outer.append($saveButton);

            var $cancelButton = $($.templates('<button class="button-simple-cybozu dialog-close-button-cybozu" type="button">{{>terms.cancel}}</button>').render({terms: i18n}));
            $cancelButton.click(function() {
                currentFiles = originalFiles.concat();
                recordDetailShowHandler(currentFiles);
            });
            $outer.append($cancelButton);

            return $outer;
        }

        function recordDetailShowHandler(files) {
            var $dropboxFileListShow = $createDropboxFileListForDetailPage(files);

            // edit button
            var $editButton = $($.templates('<button class="button-simple-cybozu dropbox-plugin-edit-button" type="button">{{>terms.edit}}</button>').render({terms: i18n}));
            $editButton.click(function() {
                var $dropboxFileListEdit = $createDropboxFileListEdit(files);
                $displaySpaceField.empty();
                $displaySpaceField.append($dropboxFileListEdit);
                // attach click event
                attachFileDeleteEvent();
            });
            $dropboxFileListShow.append($editButton);
            var $displaySpaceField = $(kintone.app.record.getSpaceElement(config.displaySpaceField));
            $displaySpaceField.empty();
            $displaySpaceField.append($dropboxFileListShow);
            $displaySpaceField.addClass('dropbox-plugin-filelist-show');
        }

        function recordCreateEditShowHandler() {
            // hide dropbox field
            kintone.app.record.setFieldShown(config.sharedLinkField, false);
        }

        function replaceSharedLinkField($field, fieldValue) {
            var files = fieldValue ? JSON.parse(fieldValue) : [];
            var fileList = createDropboxFileListForIndexPage(files);

            $field.removeClass('recordlist-single_line_text-gaia');
            $field.removeClass('recordlist-multiple_line_text-gaia');
            $field.removeClass('recordlist-editcell-gaia');
            $field.removeClass('recordlist-edit-single_line_text-gaia');
            $field.removeClass('recordlist-edit-multiple_line_text-gaia');
            $field.addClass('recordlist-cell-gaia');
            $field.addClass('recordlist-file-gaia');
            $field.html(fileList);
        }

        function recordIndexShowHandler(e) {
            var fields = kintone.app.getFieldElements(config.sharedLinkField);
            for (var i = 0; i < fields.length; i++) {
                var $field = $(fields[i]);
                var value = $field.text();
                replaceSharedLinkField($field, value);

                $field.parent().attr('id', 'dropbox-plugin-record-' + e.records[i].$id.value);
            }
        }

        function refreshSharedLinkField(e) {
            var fields = kintone.app.getFieldElements(config.sharedLinkField);
            for (var i = 0; i < fields.length; i++) {
                var $field = $(fields[i]);
                var id = $field.parent().attr('id');
                if (id === 'dropbox-plugin-record-' + e.recordId) {
                    var value = e.record[config.sharedLinkField].value;
                    replaceSharedLinkField($field, value);

                    break;
                }
            }
        }

        function observeSharedLinkFieldRegacy() {
            if (document.getElementById('dropbox-plugin-field')) {
                setTimeout(observeSharedLinkFieldRegacy, 100);
            }else {
                refreshSharedLinkField(appRecordIndexEditShowEvent);
            }
        }

        function observeSharedLinkField(e) {
            if (typeof MutationObserver !== 'undefined') {
                var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        if (!document.getElementById('dropbox-plugin-field')) {
                            observer.disconnect();
                            refreshSharedLinkField(e);
                            break;
                        }
                    }
                });
                observer.observe(document.getElementById('dropbox-plugin-record-' + e.recordId), {childList: true});
            }else { // for the browsers not support MutationObserver (e.g. IE8)
                appRecordIndexEditShowEvent = e;
                observeSharedLinkFieldRegacy();
            }
        }

        function recordIndexEditShowHandler(e) {
            var fields = kintone.app.getFieldElements(config.sharedLinkField);
            for (var i = 0; i < fields.length; i++) {
                var $field = $(fields[i]);
                var id = $field.parent().attr('id');
                if (id === 'dropbox-plugin-record-' + e.recordId) {
                    var value = e.record[config.sharedLinkField].value;
                    replaceSharedLinkField($field, value);
                    $field.attr('title', i18n.not_editable);
                    $field.append('<div class="recordlist-forms-error-gaia" style="display: none;"></div>');
                    $field.attr('id', 'dropbox-plugin-field');
                    observeSharedLinkField(e);

                    break;
                }
            }
        }

        function controlEditButtonVisibility() {
            if (kintone.app.getFieldElements(config.sharedLinkField) === null) {
                return;
            }

            kintone.api(kintone.api.url('/k/v1/form', true), 'GET', {app: kintone.app.getId()}, function(resp) {
                for (var i = 0; i < resp.properties.length; i++) {
                    var field = resp.properties[i];
                    switch (field.type) {
                    case 'SINGLE_LINE_TEXT':
                        if (field.code === config.sharedLinkField || field.expression !== '') {
                            continue;
                        }
                        /* falls through */
                    case 'NUMBER':
                    case 'LINK':
                    case 'DATE':
                    case 'USER_SELECT':
                    case 'DROP_DOWN':
                    case 'RADIO_BUTTON':
                    case 'CHECK_BOX':
                    case 'MULTI_SELECT':
                    case 'MULTI_LINE_TEXT':
                    case 'TIME':
                    case 'DATETIME':
                        if (kintone.app.getFieldElements(field.code) !== null) {
                            return;
                        }
                    }
                }

                var $editElement = $('.recordlist-edit-gaia');
                $editElement.hide();
                $editElement.closest('td').css('text-align', 'center');
            });
        }

        kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(e) {
            if (validateConfig(e)) {
                recordCreateEditShowHandler();
            }
        });

        kintone.events.on('app.record.detail.show', function(e) {
            if (validateConfig(e)) {
                revision = parseInt(e.record.$revision.value, 10);
                var value = e.record[config.sharedLinkField].value;
                originalFiles = value ? JSON.parse(value) : [];
                currentFiles = originalFiles.concat();
                recordDetailShowHandler(currentFiles);
            }
            kintone.app.record.setFieldShown(config.sharedLinkField, false);
        });

        kintone.events.on(['app.record.index.show'], function(e) {
            if (validateConfig(e)) {
                recordIndexShowHandler(e);
                controlEditButtonVisibility();
            }
        });

        kintone.events.on(['app.record.index.edit.show'], function(e) {
            if (validateConfig(e)) {
                recordIndexEditShowHandler(e);
            }
        });

    });

})(jQuery, kintone.$PLUGIN_ID);
