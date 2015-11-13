(function (PLUGIN_ID) {

  "use strict";

  kintone.events.on(
    ['app.record.create.show', 'app.record.edit.show'],
    function(event) {
      var config = kintone.plugin.app.getConfig(PLUGIN_ID);
      if (!config) return;

      var kanji_input = findInputByLabel(config.kanji_label_0);
      if (!kanji_input) {
        console.warn("[autokana]漢字フィールド\""+config.kanji_label_0+"\"が存在しません。");
        return;
      }
      var kana_input = findInputByLabel(config.kana_label_0);
      if (!kana_input) {
        console.warn("[autokana]かなフィールド\""+config.kana_label_0+"\"が存在しません。");
        return;
      }
      var options = {
        katakana: false
      };

      //console.log("[autokana]"+config.kanji_label+"->"+config.kana_label);
      $.fn.autoKana(kanji_input, kana_input, options);
    }
  );

  function findInputByLabel(label) {
    console.log("[autokana]label="+label);
    var element = null;
    $('span.control-label-text-gaia').each(function(i, span) {
      if ($(span).text() !== label) return;
      var control_gaia = $(span).closest('.control-gaia');
      var input = control_gaia.find('input[type="text"]');
      if (!input) {
        console.warn("[autokana]no input");
        return;
      }
      element = input;
    });
    return element;
  }

})(kintone.$PLUGIN_ID);
