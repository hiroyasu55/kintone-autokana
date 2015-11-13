(function(PLUGIN_ID) {
  "use strict";

  kintone.api(kintone.api.url('/k/v1/preview/form', true), 'GET', {
    'app': kintone.app.getId()
  }, function(response) {
    $.each(response.properties, function(i, property) {
      if (property.type === 'SINGLE_LINE_TEXT') {
        $('#kanji_label_0').append($('<option/>').text(property.label).val(property.label));
        $('#kana_label_0').append($('<option/>').text(property.label).val(property.label));
        //console.log("[autokana]add"+property.type + ":" + property.label);
      }
    });
    var conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    //console.log("[autokana]conf:"+JSON.stringify(conf));
    if (conf) {
      $('#kanji_label_0').val(conf.kanji_label_0);
      $('#kana_label_0').val(conf.kana_label_0);
    }
  });

  $('#submit').click(function() {
    var kanji_label = $('#kanji_label_0').val();
    var kana_label = $('#kana_label_0').val();

    if (kanji_label === "") {
      alert("漢字フィールドが選択されていません。");
      return;
    }
    if (kana_label === "") {
      alert("かなフィールドが選択されていません。");
      return;
    }
    if (kanji_label === kana_label) {
      alert("漢字フィールドとかなフィールドは同一にはできません。");
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
