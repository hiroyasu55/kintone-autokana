(function (PLUGIN_ID) {

  "use strict";

  function init(event) {
    var record = event.record;
    alert("init");
  }

  function check(event) {

    var config = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!config) return false;

    var record = event.record;
    var kanji = record[config.kanji_field].value;
    var kana = record[config.kanji_field].value;

    alert("["+kanji+":"+kana+"]");
  }

  kintone.events.on(
    ['app.record.create.show', 'app.record.edit.show'], init);
  kintone.events.on(
    ['app.record.create.submit', 'app.record.edit.submit'], check);

})(kintone.$PLUGIN_ID);
