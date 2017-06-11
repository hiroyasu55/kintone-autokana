(function(PLUGIN_ID) {
  'use strict';

  var kUtil = require('../../lib/node-kintone-util');

  kUtil.getPreviewForm(kUtil.getId()).then(function (resp) {
    $.each(resp.properties, function(i, prop) {
      if (prop.type === 'SINGLE_LINE_TEXT') {
        $('#kanji_label_0').append($('<option/>').text(prop.label).val(prop.label));
        $('#kana_label_0').append($('<option/>').text(prop.label).val(prop.label));
      }
    });
    var conf = kUtil.getPluginConfig(PLUGIN_ID);
    //console.log('[autokana]conf:'+JSON.stringify(conf));
    if (conf) {
      $('#kanji_label_0').val(conf['kanji_label_0']);
      $('#kana_label_0').val(conf['kana_label_0']);
    }
  });

  $('#submit').click(function() {
    var kanji_label = $('#kanji_label_0').val();
    var kana_label = $('#kana_label_0').val();

    if (kanji_label === '') {
      alert('漢字フィールドが選択されていません。');
      return;
    }
    if (kana_label === '') {
      alert('かなフィールドが選択されていません。');
      return;
    }
    if (kanji_label === kana_label) {
      alert('漢字フィールドとかなフィールドは同一にはできません。');
      return;
    }

    var config = {
      kanji_label_0: kanji_label,
      kana_label_0: kana_label
    };
    kintone.plugin.app.setConfig(config);
  });

  $('#cancel').click(function() {
    history.back();
  });
})(kintone.$PLUGIN_ID);
