(function(PLUGIN_ID) {
  "use strict";

  var conf = kintone.plugin.app.getConfig(PLUGIN_ID);

  if(conf) {
    $('#kanji_field').val(conf.kanji_field);
    $('#kana_field').val(conf.kana_field);
  }

  $('#submit').click(function() {
    var config = [];
    var kanji_field = $('#kanji_field').val();
    var kana_field = $('#kana_field').val();

    if (kanji_field === "" || kana_field === "") {
      alert("必須項目が入力されていません");
      return;
    }
    config.kanji_field = kanji_field;
    config.kana_field = kana_field;

    kintone.plugin.app.setConfig(config);
  });

  $('#cancel').click(function() {
    history.back();
  });
})(kintone.$PLUGIN_ID);
