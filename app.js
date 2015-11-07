(function() {
  "use strict";

  kintone.events.on('app.record.create.show', function(event) {
    var record = event.record;
    var phrase = kintone.app.getFieldElements('PHRASE');
    var tags = kintone.app.getFieldElements('TAGS');
//  	$(tags).tagit({placeholderText:"タグ", fieldName:"tags[]"});

    $('.control-gaia').each(function(i, control) {
      var input = $(control).find('input');
      if (input) {
        input.val("[");
      }
    });

    tags.val("ssssss");
    $(tags).val("Essssss");

  });


  kintone.events.on('app.record.create.submit', function(event) {
    return event;
  });


  var onPhraseChange = function(event) {
    var record = event.record;
    var phrase = kintone.app.getFieldElements('PHRASE');
    alert(JSON.stringify(phrase));
//    alert(JSON.stringify(phrase));
/*    $.fn.autoKana('#userName', '#userNameKana', {
        katakana : true  //true：カタカナ、false：ひらがな（デフォルト）
    });
*/
    record.PHRASE_KANA.value = record.PHRASE.value;
    return event;
  };

  kintone.events.on('app.record.create.change.PHRASE', onPhraseChange);
  kintone.events.on('app.record.edit.change.PHRASE', onPhraseChange);

  kintone.events.on('app.record.edit.submit', function(event) {
    return event;
  });
})();
