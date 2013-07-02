"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(["jquery", "backbone-events"], function($, BackboneEvents) {
  function LivePreview(options) {
    var self = {codeMirror: options.codeMirror, title: ""},
        codeMirror = options.codeMirror,
        iframe = document.createElement("iframe"),
        previewLoader = options.previewLoader || "/previewloader.html",
        previewArea = options.previewArea,
        telegraph;

    // set up the loader script for the preview iframe
    iframe.src = previewLoader;

    // set up the code-change handling.
    codeMirror.on("reparse", function(event) {
      var isPreviewInDocument = $.contains(document.documentElement, previewArea);
      if (!isPreviewInDocument) {
        if (window.console)
          window.console.log("reparse triggered, but preview area is not " +
                             "attached to the document.");
        return;
      }

      if (!event.error || options.ignoreErrors) {
        var x = 0,
            y = 0,
            doc, wind;

        // add the preview iframe to the editor on the first
        // attempt to parse the Code Mirror text
        if(!iframe.contentWindow) {
          previewArea.append(iframe);
          telegraph = iframe.contentWindow;
        }

 /*
        if (iframe) {
          doc = $(iframe).contents()[0];
          wind = doc.defaultView;
          x = wind.pageXOffset;
          y = wind.pageYOffset;
          $(iframe).remove();
        }

        iframe = document.createElement("iframe");
        options.previewArea.append(iframe);

        // Update the preview area with the given HTML.
        doc = $(iframe).contents()[0];
        wind = doc.defaultView;
*/

        // Communicate content changes. For the moment,
        // we treat all changes as a full refresh.
        var message = JSON.stringify({
          type: "overwrite",
          sourceCode: event.sourceCode
        });

        try {
          telegraph.postMessage(message, "*");
        } catch (e) {
          console.log("An error occurred while postMessaging data to the preview pane");
          throw e;
        }


        // TODO: If the document has images that take a while to load
        // and the previous scroll position of the document depends on
        // their dimensions being set on load, we may need to refresh
        // this scroll position after the document has loaded.
        wind.scroll(x, y);

        self.trigger("refresh", {
          window: wind,
          documentFragment: event.document
        });

        if (wind.document.title != self.title) {
          self.title = wind.document.title;
          self.trigger("change:title", self.title);
        }
      }
    });

    BackboneEvents.mixin(self);
    return self;
  };

  return LivePreview;
});
