const setRem = function() {
  (function(win, lib) {
      var doc = win.document;
      var docEl = doc.documentElement;
      var tid;
      win.flexible = lib.flexible || (lib.flexible = {});
      // console.log(doc);
      // console.log(docEl);
      function refreshRem(){
        //   var width = docEl.getBoundingClientRect().width>4600?docEl.getBoundingClientRect().width:4600
          var width = docEl.getBoundingClientRect().width>1920?1920:docEl.getBoundingClientRect().width
          var rem = width / 10;
          docEl.style.fontSize = rem + 'px';
      }
      win.addEventListener('resize', function() {
          clearTimeout(tid);
          tid = setTimeout(refreshRem, 300);
      }, false);
      win.addEventListener('pageshow', function(e) {
          if (e.persisted) {
              clearTimeout(tid);
              tid = setTimeout(refreshRem, 300);
          }
      }, false);
      refreshRem();
  })(global.window, global.window['lib'] || (global.window['lib'] = {}));
}
export default setRem