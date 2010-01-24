/*
 * JFUpload:
 *   file upload with iframe
 *   jQuery ajax events support (like ajaxComplete, ajaxError etc.)
 *   jQuery ajax settings support (like success, error, dataType etc.)
 *   live support (if you use livequery plugin or jQuery 1.4alpha+)
 *   small size (LOC ~ 100)
 *
 * Usage:
 *   $('#formId').JFUpload(settings)
 *
 *   settings: http://api.jquery.com/jQuery.ajax/
 *      default: {dataType: 'script'}
 *
 * Tested in:
 *    Opera, Chrome, Firefox
 *
 *
 */

(function($) {

  $.fn.JFUpload = function(settings) {

    var s = $.extend($.ajaxSettings, {dataType: 'script'}, settings);

    var uploadFail = function(data) {
      $.handleError(s, data.xhr, "error");
      ajaxComplete(data.xhr, "error");
      cleanup(data);
    }

    var ajaxComplete = function(xhr, status) {
      if (s.global) $.event.trigger("ajaxComplete", [xhr, s]);
      if (s.global && ! --$.active) $.event.trigger("ajaxStop");
      if (s.complete) s.complete(xhr, status);
    }

    var cleanup = function(data) {
      setTimeout(function() {
        data.iframe.remove();
      }, 500);
    }

    var uploadDone = function(e) {
      var responseTag;
      var data = e.data;
      var xhr = data.xhr;
      var $doc = data.iframe.contents()
      var doc = $doc[0]

      if (doc.readyState && doc.readyState != 'complete') return;
      if (doc.body && doc.body.innerHTML == "false") return;

      data.done = true;

      var body = $doc.find('body');
      var pre = body.find('> pre');

      if (pre.size()) responseTag = pre; else responseTag = body;

      xhr.responseXML = xhr.responseText = responseTag.text();

      try {
        var ajaxData = $.httpData(xhr, s.dataType, s);

        if (s.success) s.success(ajaxData, "success");
        if (s.global) $.event.trigger("ajaxSuccess", [xhr, s]);
      } catch(e) {
        $.handleError(s, xhr, "error", e);
      }

      ajaxComplete(xhr, "success");
      cleanup(data);
    }

    var upload = function() {
      var data = { xhr: {getResponseHeader: function(_) {return ""}}, done: false };
      var uid = new Date().getTime();

      data.iframe = $('<iframe id="'+uid+'" src="javascript:false;" name="'+uid+'" style="display:none" />').appendTo('body')
      data.iframe.bind("load",  data, uploadDone);
      $(this).parents('form').attr('target', uid).attr('enctype','multipart/form-data').attr('encoding','multipart/form-data').submit();

      if (s.global && !$.active++) $.event.trigger("ajaxStart");
      if (s.global) $.event.trigger("ajaxSend", [data.xhr, s]);

      if (s.timeout > 0) {
        setTimeout(function() {
          if (!data.done) uploadFail(data);
        }, s.timeout);
      }

      return false;
    }

    var submitBtn = this.find('input:submit');

    if (/^1\.4/.test($.fn.jquery)) {
      submitBtn.live('click', upload);
    } else if ($.livequery) {
      submitBtn.livequery('click', upload);
    }  else {
      submitBtn.bind('click', upload);
    }
    return this;
  }
})(jQuery);
