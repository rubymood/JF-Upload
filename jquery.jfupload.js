/*
 * JFUpload
 *   file upload with iframe
 *   jQuery ajax events support (like ajaxComplete, ajaxError etc.)
 *   jQuery ajax options support (like success, error, dataType etc.)
 *   live support (if you use livequery plugin or jQuery 1.4alpha+)
 *
 * Usage:
 *   $('#formId').JFUpload(options)
 *
 *   options: http://docs.jquery.com/Ajax/jQuery.ajax#options
 *      default: {dataType: 'script'}
 */
 
(function($) {

  $.fn.JFUpload = function(options) {

    var s = $.extend($.ajaxSettings, {
      dataType: 'script'
    }, options);

    var uploadFail = function(data) {
      $.handleError(s, data.xhr, "error");
      ajaxComplete(data.xhr, "error");
      cleanup(data);
    }

    var ajaxComplete = function(xhr, status) {
      if (s.global)
        $.event.trigger("ajaxComplete", [xhr, s]);

      if (s.global && ! --$.active)
        $.event.trigger("ajaxStop");

      if (s.complete)
        s.complete(xhr, status);
    }

    var cleanup = function(data) {
      setTimeout(function() {
        data.form.remove();
        data.iframe.remove();
      }, 500);
    }

    var uploadDone = function(e) {
      var responseTag;
      var data = e.data;
      data.done = true;

      var xhr = data.xhr;
      var body = data.iframe.contents().find('body');
      var pre = body.find('> pre');
      
      if (pre.size())
        responseTag = pre;
      else
        responseTag = body;

      xhr.responseXML = xhr.responseText = responseTag.html();

      try {
        var ajaxData = $.httpData(xhr, s.dataType, s);

        if (s.success)
          s.success(ajaxData, "success");

        if (s.global)
          $.event.trigger("ajaxSuccess", [xhr, s]);
      } catch(e) {
        $.handleError(s, xhr, "error", e);
      }

      ajaxComplete(xhr, "success");
      cleanup(data);
    }

    var upload = function() {
      var data = { xhr: {
                     getResponseHeader: function(_) {return ""}
                   },
                   done: false
                 };

      var uid = new Date().getTime();

      data.iframe = $('<iframe src="javascript:false;" name="'+uid+'" style="display:none" />').appendTo(document.body).bind("load",  data, uploadDone);
      
      data.form = $(this).clone().attr('target', uid).css({display:'none'}).appendTo(document.body).submit();

      if (s.global && ! $.active++)
        $.event.trigger("ajaxStart");

      if (s.global)
        $.event.trigger("ajaxSend", [data.xhr, s]);

      if (s.timeout > 0) {
        setTimeout(function() {
          if (!data.done)
            uploadFail(data);
        }, s.timeout);
      }

      return false;
    }

    if (/^1\.4/.test($.fn.jquery)) {
      return this.live('submit',upload);
    } else if ($.livequery) {
      return this.livequery('submit', upload);
    }  else {
      return this.bind('submit', upload);
    }
  }
})(jQuery);
