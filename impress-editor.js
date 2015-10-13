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

    self.defaults = {
      action: {},
      backgroundGroup: {
        transparentBackground: true
      },
      positioning: {
        centerText: true,
        yPosition: 0,
        xPosition: 0,
        zPosition: 0,
        absoluteRotation: 0
      }
    };

    // Set default params
    if (params === undefined) {
      params = [
        self.defaults
      ];
      setValue(field, params);

      self.emptyParams = true;
    }

    self.parent = parent;
    self.field = field;
    self.setValue = setValue;
    self.params = params;

    /**
     * Editor wrapper
     *
     * @type {H5P.jQuery}
     */
    self.$template = $(
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
    self.$preview = $('.impress-presentation-preview', self.$template);
    console.log(self.$preview);

    /**
     * Button bar
     *
     * @type {H5P.jQuery}
     */
    self.$buttonBar = $('.impress-presentation-buttonbar', self.$template);
    console.log(self.$buttonBar);

    /**
     * Semantics container
     *
     * @type {H5P.jQuery}
     */
    self.$semantics = $('.impress-editor-semantics', self.$template);

    // Recreate IP on semantics changed
    self.$semantics.change(function () {

      console.log("editor semantics changed!!");
    });
    console.log(self.$semantics);

    // Make sure widget can pass readies (used when processing semantics)
    self.passReadies = true;
    self.parent.ready(function () {
      self.passReadies = false;
    });

    self.resize();

    // Create preview
    self.IP = new H5P.ImpressPresentation({viewsGroup: self.params}, H5PEditor.contentId);
    self.IP.attach(self.$preview);

    self.semanticsList = [H5P.cloneObject(field.fields[0], true)];

    // Create example content if no params
    if (self.emptyParams) {
      self.createExampleAction(self.IP.viewElements[0]);
      self.params[0] = self.IP.viewElements[0].params;
      self.updateSemantics();
    }

    // Enable free transform of steps
    self.initMouseListeners();
  }

  /**
   * Append preview to container
   * @param {$} $wrapper
   */
  ImpressPresentationEditor.prototype.appendTo = function ($wrapper) {
    var self = this;
    self.$inner = $wrapper;
    self.createSemantics();
    self.$template.appendTo($wrapper);

    // Create buttons
    self.createButtons(self.$buttonBar);

    self.resize();
  };

  ImpressPresentationEditor.prototype.createButtons = function ($buttonBar) {
    var self = this;

    // Live edit of slide
    JoubelUI.createSimpleRoundedButton('Add slide!').click(function () {
      self.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton('Move slide!').click(function () {
      self.toggleMoveMode();
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton('Rotate slide!').click(function () {
      self.toggleRotateMode();
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton('Edit content!').click(function () {
      self.goToEditContent();
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.goToEditContent = function () {
    var self = this;
    console.log(self.$semantics);
    console.log(self.$semantics.children());
    console.log(H5P.$body);
    console.log(document);
    console.log(self.$semantics.offset().top);
    console.log(self.$semantics.offset().top);
    console.log(self.$template.offset().top);
    console.log(self.$template.scrollTop());
    console.log($(document));
    console.log($('html, body', window));
    console.log($('html, body', window.top));
    console.log(window);
    //self.$semantics.scrollTop();
    $('html, body').animate({
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
    var self = this;
    if (self.passReadies) {
      self.parent.ready(ready);
    } else {
      self.readies.push(ready);
    }
  };

  ImpressPresentationEditor.prototype.updateSemantics = function () {
    var self = this;
    self.$semantics.children().remove();
    self.createSemantics();
  };

  ImpressPresentationEditor.prototype.createSemantics = function () {
    var self = this;

    // semantics holder
    H5PEditor.processSemanticsChunk(self.semanticsList, {views: self.params}, self.$semantics, this);
  };

  /**
   * Resize area used for Impressive Presentation preview
   */
  ImpressPresentationEditor.prototype.resize = function () {
    var self = this;
    var containerWidth = self.$preview.width();
    var containerHeight = (containerWidth * 9) / 16;

    // Set container height, width already 100%
    self.$preview.height(containerHeight);
    if (self.IP) {
      H5P.trigger(self.IP, 'resize');
    }
  };

  ImpressPresentationEditor.prototype.addStep = function () {
    var self = this;

    // Initialize new step at the position of active step
    var $activeStep = self.IP.$jmpress.jmpress('active');
    var currentId = self.getUniqueId($activeStep);
    debugger;
    var activeStepParams = self.IP.viewElements[currentId].params;

    var newStepParams = $.extend(true, {}, self.defaults, activeStepParams);
    var viewObject = self.IP.createViewObject(self.IP.idCounter, newStepParams);

    // Create example html from active step
    var $newStep = self.IP.createViewHtml(viewObject);
    viewObject.$element = $newStep;


    console.log("what is new Step params ?", newStepParams.positioning);
    console.log("active step params", activeStepParams.positioning);
    console.log("did new step params get updated ?", newStepParams.positioning);



    console.log("create advanced text instance!");
    self.createExampleAction(viewObject);

    // Push to view elements array
    self.IP.viewElements.push(viewObject);
    self.IP.idCounter += 1;
    self.IP.$jmpress.jmpress('canvas').append($newStep);
    self.IP.$jmpress.jmpress('init', $newStep);

    // Add step to params
    console.log("adding step to params");
    console.log("viewobject", viewObject);
    console.log("what is params ? ", self.params);
    self.params.push(newStepParams);

    // Redraw semantics
    self.updateSemantics();

    // Set step as current
    self.IP.$jmpress.jmpress('goTo', '#' + self.IP.ID_PREFIX + viewObject.idCounter);
  };

  ImpressPresentationEditor.prototype.createExampleAction = function (viewObject) {
    var self = this;

    // Find Advanced Text option library with correct version from semantics, should be more robust.
    var libraryOptions = self.field.fields[0].field.fields[0].options;
    var foundLib = false;
    for (var libIndex in libraryOptions) {
      if (libraryOptions.hasOwnProperty(libIndex) && !foundLib) {
        var library = libraryOptions[libIndex];
        if ((typeof library === 'string' || library instanceof String)
          && library.indexOf('AdvancedText') > -1) {
          viewObject.params.action = {
            library: library,
              params: {
                text: '<p>Example content!</p>'
              },
            subContentId: H5P.createUUID()
          };
          self.IP.createActionLibrary(viewObject);
          foundLib = true;
        }
      }
    }
  };

  /**
   * Initializes mouse dragging functionality.
   */
  ImpressPresentationEditor.prototype.initMouseListeners = function () {
    var self = this;
    var isDragging = false;
    var initialPos = {
      x: 0,
      y: 0
    };
    var currentPos = {
      x: 0,
      y: 0
    };
    var $activeStep;
    var initialData;
    var scrollStep = 10;
    var scrollStepMultiple = 1;
    var maxScrollStepMultiple = 10;
    var startedScrolling;
    var progressiveScrollDelay = 400;

    self.IP.$jmpress.on('mousewheel', function (e) {
      if (self.moveEditing) {
        var currentTime = new Date().getTime();

        // Make scrolling faster when scrolling multiple times within progressive delay duration
        if (startedScrolling && (currentTime - startedScrolling) < progressiveScrollDelay) {
          scrollStepMultiple += 1;

          // Cap at max multiple
          if (scrollStepMultiple >= maxScrollStepMultiple) {
            scrollStepMultiple = maxScrollStepMultiple;
          }
        }
        else {
          scrollStepMultiple = 1;
        }
        startedScrolling = currentTime;

        console.log("scrolling!");
        $activeStep = self.IP.$jmpress.jmpress('active');
        var activeStepData = $activeStep.data('stepData');
        var activeId = self.getUniqueId($activeStep);
        var activeStepParams = self.IP.viewElements[activeId].params;
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
          // scroll up
          console.log("scrolling up!");
          activeStepData.z -= (scrollStep * scrollStepMultiple);
          activeStepParams.positioning.zPosition -= (scrollStep * scrollStepMultiple);
        }
        else {
          // scroll down
          console.log("scrolling down!");
          activeStepData.z += (scrollStep * scrollStepMultiple);
          activeStepParams.positioning.zPosition += (scrollStep * scrollStepMultiple);
        }
        self.reselectStep();
        self.updateSemantics();
        return false;
      }
    });

    self.IP.$jmpress.mousedown(function (e) {
      if (self.moveEditing) {
        initialPos.x = e.clientX;
        initialPos.y = e.clientY;
        isDragging = true;
        $activeStep = self.IP.$jmpress.jmpress('active');
        initialData = $.extend({}, $activeStep.data().stepData);
      }
    });

    self.IP.$jmpress.mouseup(function () {
      if (self.moveEditing) {
        isDragging = false;

        // Record the latest coordinates into params
        console.log("active step ?", $activeStep);
        var currentId = self.getUniqueId($activeStep);
        var activeStepData = $activeStep.data().stepData;
        console.log("active step data", activeStepData);
        var newStepParams = {
          yPosition: activeStepData.y,
          xPosition: activeStepData.x,
          zPosition: activeStepData.z,
          absoluteRotation: activeStepData.rotate
        };

        console.log("current id ?", currentId);
        console.log("params", self.params);
        console.log("current params", self.params[currentId]);
        $.extend(true, self.params[currentId].positioning, newStepParams);
        console.log("new step params", newStepParams);
        console.log("extended params", self.params[currentId]);
        self.updateSemantics();
      }
    });

    self.IP.$jmpress.mousemove(function (e) {
      if (isDragging && self.moveEditing) {
        currentPos.x = e.clientX;
        currentPos.y = e.clientY;

        // distance mouse moved since start of drag
        var deltaX = currentPos.x - initialPos.x;
        var deltaY = currentPos.y - initialPos.y;

        // Update active step
        $activeStep.data().stepData.x = initialData.x - deltaX;
        $activeStep.data().stepData.y = initialData.y - deltaY;
        self.reselectStep();

        // Do not propagate, prevents dragging of images/items
        return false;
      }
    });
  };

  ImpressPresentationEditor.prototype.getUniqueId = function ($step) {
    var self = this;
    var stepId = $step.attr('id');
    var id = stepId.split(self.IP.ID_PREFIX);
    return id[1];
  };

  /**
   * Toggle editor mode.
   */
  ImpressPresentationEditor.prototype.toggleMoveMode = function () {
    var self = this;
    console.log("toggle editor mode");
    console.log(self.moveEditing);
    if (self.moveEditing) {
      self.disableMoveMode();
    } else {
      self.enableMoveMode();
    }
  };

  /**
   * Enable editor mode, let's the user pan, zoom and rotate
   * the current step. Disables click navigation.
   */
  ImpressPresentationEditor.prototype.enableMoveMode = function () {
    var self = this;
    var settings = self.IP.$jmpress.jmpress('settings');
    // Disable click navigation
    settings.mouse.clickSelects = false;
    self.moveEditing = true;
  };

  /**
   * Disable editor mode.
   */
  ImpressPresentationEditor.prototype.disableMoveMode = function () {
    var self = this;
    self.moveEditing = false;
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
  };

  /**
   * Reselct current step, needed for some steps to update.
   */
  ImpressPresentationEditor.prototype.reselectStep = function () {
    var self = this;
    var $activeSlide = self.IP.$jmpress.jmpress('active');
    self.IP.$jmpress.jmpress('reapply', $activeSlide);
    self.IP.$jmpress.jmpress('select', $activeSlide, 'resize');
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    return true;
  };

  return ImpressPresentationEditor;

}(H5P.jQuery, H5P.JoubelUI));
