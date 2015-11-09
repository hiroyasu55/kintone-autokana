(function (PLUGIN_ID) {

  "use strict";

  kintone.events.on(
    ['app.record.create.show', 'app.record.edit.show'],
    function(event) {
      var config = kintone.plugin.app.getConfig(PLUGIN_ID);
      if (!config) return;

/*
      for (var i in config.fields) {
        var field = config.fields[i];
        var kanji_input = findInputByLabel(field.kanji_label);
        if (!kanji_input) {
          console.warn("[autokana]漢字フィールド\""+field.kanji_label+"\"が存在しません。");
          continue;
        }
        var kana_input = findInputByLabel(field.kana_label);
        if (!kana_input) {
          console.warn("[autokana]かなフィールド\""+field.kana_label+"\"が存在しません。");
          continue;
        }

        console.log("[autokana]"+pair.kanji_label+"->"+field.kana_label);
        $.fn.autoKana(kanji_input, kana_input, field.options);
      }
*/
      var kanji_input = findInputByLabel(config.kanji_label);
      if (!kanji_input) {
        console.warn("[autokana]漢字フィールド\""+config.kanji_label+"\"が存在しません。");
        return;
      }
      var kana_input = findInputByLabel(config.kana_label);
      if (!kana_input) {
        console.warn("[autokana]かなフィールド\""+config.kana_label+"\"が存在しません。");
        return;
      }
      var options = {};

      console.log("[autokana]"+config.kanji_label+"->"+config.kana_label);
      $.fn.autoKana(kanji_input, kana_input, options);
    }
  );

  function findInputByLabel(label) {
    console.log("[autokana]label="+label);
    var element = null;
    $('span.control-label-text-gaia').each(function(i, span) {
      console.log("[autokana]span="+$(span).text());
      if ($(span).text() !== label) return;
      var control_gaia = $(span).closest('.control-gaia');
      var input = control_gaia.find('input[type="text"]');
      if (!input) {
        input = control_gaia.find('textarea');
        if (!input) {
          console.log("[autokana]no input");
          rerurn;
        }
      }
      element = input;
    });
    return element;
  }

})(kintone.$PLUGIN_ID);
