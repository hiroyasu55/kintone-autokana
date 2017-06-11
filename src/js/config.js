/**
 * config.js
 */

import kUtil from 'node-kintone-util';
const MAX_INPUTS = 4;

let app = (PLUGIN_ID) => {
  let config = kUtil.getPluginConfig(PLUGIN_ID);
  if (!config) {
    config = {};
  }
  if (!config.pairs) {
    config.pairs = [];
    for (let i = 0; i < MAX_INPUTS; i++) {
      config.pairs.push({'kanji': '', 'kana': ''});
    }
  }

  kUtil.getPreviewForm(kUtil.getId()).then((resp) => {
    for (let prop of resp.properties) {
      if (prop.type === 'SINGLE_LINE_TEXT') {
        for (let i = 0; i < MAX_INPUTS; i++) {
          let kanjiSelect = $('select[name="kanji_label_' + i + '"]');
          if (!kanjiSelect) {
            console.warn('select[name="kanji_label_' + i + '"] not exists');
          } else {
            kanjiSelect.append($('<option/>').text(prop.label).val(prop.label));
            kanjiSelect.val(config.pairs[i].kanji);
          }
          let kanaSelect = $('select[name="kana_label_' + i + '"]');
          if (!kanaSelect) {
            console.warn('select[name="kana_label_' + i + '"] not exists');
          } else {
            kanaSelect.append($('<option/>').text(prop.label).val(prop.label));
            kanjiSelect.val(config.pairs[i].kana);
          }
        }
      }
    }
    //console.log('[autokana]conf:'+JSON.stringify(conf));
  });

  $('#submit').on('click', () => {
    for (let i = 0; i < MAX_INPUTS; i++) {
      let kanjiLabel = $('select[name="kanji_label_' + i);
      let kanaLabel = $('select[name="kana_label_' + i);
      if (!kanjiLabel || !kanaLabel) {
        continue;
      }
      if (kanjiLabel.val() !== '' && kanaLabel.val() === '') {
        alert('漢字フィールド' + (i + 1) + 'が選択されていません。');
        return;
      }
      if (kanjiLabel.val() !== '' && kanaLabel.val() === '') {
        alert('かなフィールド' + (i + 1) + 'が選択されていません。');
        return;
      }
      if (kanjiLabel.val() === kanaLabel.val()) {
        alert('漢字フィールドとかなフィールドは同一にはできません。');
        return;
      }
      config.pairs[i] = {
        kanji: kanjiLabel.val(),
        kana: kanaLabel.val(),
      };

    }

    kintone.plugin.app.setConfig(config);
    console.log('config:'+JSON.stringify(config));
  });

  $('#cancel').on('click', () => {
    history.back();
  });
};

app(kintone.$PLUGIN_ID);
