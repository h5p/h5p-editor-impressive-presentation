/*global H5P*/
var H5PEditor = H5PEditor || {};

/**
 * Interactive Video editor widget module
 *
 * @param {jQuery} $
 */
H5PEditor.widgets.impressPresentationEditor = H5PEditor.ImpressPresentationEditor = (function ($, JoubelUI) {

  /**
   * Initialize interactive video editor.
   *
   * @returns {ImpressPresentationEditor}
   */
  function ImpressPresentationEditor(parent, field, params, setValue) {
    var self = this;

    // Set default params
    if (params === undefined) {
      params = [
        {
          centerText: true,
          yPosition: 0,
          xPosition: 0,
          zPosition: 0,
          absoluteRotation: 0,
          absoluteScale: 1,
          action: {}
        }
      ];
      setValue(field, params);
    }

    this.parent = parent;
    this.field = field;
    this.setValue = setValue;
    this.params = params;

    //TODO: Use Mustache template
    /**
     * Editor wrapper
     *
     * @type {H5P.jQuery}
     */
    this.$template = $(
      '<div class="impress-editor-wrapper">' +
        '<div class="impress-presentation-preview"></div>' +
        '<div class="impress-presentation-buttonbar"></div>' +
        '<div class="impress-editor-semantics"></div>' +
        '</div>'
    );

    /**
     * Preview container
     *
     * @type {H5P.jQuery}
     */
    this.$preview = $('.impress-presentation-preview', this.$template);
    console.log(this.$preview);

    /**
     * Button bar
     *
     * @type {H5P.jQuery}
     */
    this.$buttonBar = $('.impress-presentation-buttonbar', this.$template);
    console.log(this.$buttonBar);

    /**
     * Semantics container
     *
     * @type {H5P.jQuery}
     */
    this.$semantics = $('.impress-editor-semantics', this.$template);
    console.log(this.$semantics);

    // Make sure widget can pass readies (used when processing semantics)
    this.passReadies = true;
    this.parent.ready(function () {
      self.passReadies = false;
    });

    this.resize();

    // Create preview
    this.IP = new H5P.ImpressPresentation({viewsGroup: this.params}, H5PEditor.contentId);
    this.IP.on('paramsChanged', function (params) {

      // Update params
      self.params = params.data.viewsGroup;

      // Update semantics
      self.updateSemantics();
    });
    this.IP.attach(this.$preview);

    this.semanticsList = [H5P.cloneObject(field.fields[0], true)];

  }

  /**
   * Append preview to container
   * @param {$} $wrapper
   */
  ImpressPresentationEditor.prototype.appendTo = function ($wrapper) {
    this.$inner = $wrapper;
    this.createSemantics();
    this.$template.appendTo($wrapper);

    // Create buttons
    this.createButtons(this.$buttonBar);

    this.resize();
  };

  ImpressPresentationEditor.prototype.createButtons = function ($buttonBar) {
    var self = this;

    // Live edit of slide
    JoubelUI.createSimpleRoundedButton('Add slide!').click(function () {
      self.IP.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton('Move slide!').click(function () {
      self.IP.toggleEditorMode();
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton('Edit content!').click(function () {
      self.goToEditContent();
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.goToEditContent = function () {
    var self = this;
    var activeStepIndex = this.IP.getActiveStepParamIndex();
    console.log(this.$semantics);
    console.log(this.$semantics.children());
    console.log(H5P.$body);
    console.log(document);
    console.log($('html, body'));
    console.log(self.$semantics.offset().top);
    console.log(self.$semantics.offset().top);
    console.log(self.$template.offset().top);
    console.log(self.$template.scrollTop());
    console.log($(document));
    console.log($('html, body', window));
    console.log($('html, body', window.top));
    console.log(window);
    //self.$semantics.scrollTop();
    window.$('html, body').animate({
      scrollTop: self.$semantics.offset().top
    }, 2000);
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   * @returns {undefined}
   */
  ImpressPresentationEditor.prototype.ready = function (ready) {
    if (this.passReadies) {
      this.parent.ready(ready);
    } else {
      this.readies.push(ready);
    }
  };

  ImpressPresentationEditor.prototype.updateSemantics = function () {
    this.$semantics.children().remove();
    this.createSemantics();
  };

  ImpressPresentationEditor.prototype.createSemantics = function () {
    // semantics holder
    H5PEditor.processSemanticsChunk(this.semanticsList, {views: this.params}, this.$semantics, this);
  };

  /**
   * Resize area used for Impressive Presentation preview
   */
  ImpressPresentationEditor.prototype.resize = function () {
    var containerWidth = this.$preview.width();
    var containerHeight = (containerWidth * 9) / 16;

    // Set container height, width already 100%
    this.$preview.height(containerHeight);
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    return true;
  };

  ImpressPresentationEditor.prototype.updatePreview = function () {
    // Update IP
    this.IP.updatePresentation({viewsGroup: this.params});
  };

  return ImpressPresentationEditor;

}(H5P.jQuery, H5P.JoubelUI));
