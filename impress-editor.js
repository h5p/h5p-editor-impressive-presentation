/*global H5P*/
var H5PEditor = H5PEditor || {};

/**
 * Interactive Video editor widget module
 *
 * @param {jQuery} $
 */
H5PEditor.widgets.impressPresentationEditor = H5PEditor.ImpressPresentationEditor = (function ($, JoubelUI, FreeTransform) {

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
        transparentBackground: true,
        backgroundColor: 'fff',
        backgroundWidth: 640,
        backgroundHeight: 360
      },
      positioning: {
        centerText: true,
        y: 0,
        x: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        absoluteRotation: 0
      },
      ordering: {
        includeInPath: true,
        pathIndex: 1
      }
    };

    // Set default params
    if (params === undefined) {
      params = {
        perspectiveRatio: 1,
        views: [
          self.defaults
        ]
      };
      setValue(field, params);

      self.emptyParams = true;
    }

    self.parent = parent;
    self.field = field;
    self.setValue = setValue;
    self.params = params;
    self.editModes = {
      move: false,
      rotate: false,
      transform: false
    };
    self.editingSlideIndex = 0;

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

    /**
     * Button bar
     *
     * @type {H5P.jQuery}
     */
    self.$buttonBar = $('.impress-presentation-buttonbar', self.$template);

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

    // Make sure widget can pass readies (used when processing semantics)
    self.passReadies = true;
    self.parent.ready(function () {
      self.passReadies = false;
    });

    self.resize();

    // Create preview
    self.createPreview();

    self.semanticsList = [H5P.cloneObject(field.fields[1], true)];

    // Create example content if no params
    if (self.emptyParams) {
      self.createExampleAction(self.IP.viewElements[0]);
      self.params.views[0] = self.IP.viewElements[0].params;
      self.updateSemantics();
    }

    // Enable free transform of steps
    self.freeTransform = new FreeTransform(self.IP, self);
  }

  ImpressPresentationEditor.prototype.createPreview = function () {
    var self = this;
    self.IP = new H5P.ImpressPresentation({viewsGroup: self.params}, H5PEditor.contentId);
    self.createStepSelector();

    self.IP.on('createdViewHtml', function (e) {
      self.addStepToSelector(e.data.$element, e.data.id);
    });

    self.IP.attach(self.$preview);
  };

  ImpressPresentationEditor.prototype.setPerspectiveRatio = function () {
    var self = this;
    self.params.perspectiveRatio = self.$preview.width() / 1000;
    self.IP.params.viewsGroup.perspectiveRatio = self.params.perspectiveRatio;
    self.IP.resize();
  };

  /**
   * Append preview to container
   * @param {$} $wrapper
   */
  ImpressPresentationEditor.prototype.appendTo = function ($wrapper) {
    var self = this;
    self.$inner = $wrapper;
    self.createSemantics();
    self.$template.appendTo($wrapper);
    self.setPerspectiveRatio();

    // Create buttons
    self.createButtons(self.$buttonBar);

    self.resize();
  };

  ImpressPresentationEditor.prototype.createButtons = function ($buttonBar) {
    var self = this;

    // Live edit of slide
    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'add')).click(function () {
      self.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'move')).click(function () {
      self.toggleMode(ImpressPresentationEditor.MOVE);
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'rotate')).click(function () {
      self.toggleMode(ImpressPresentationEditor.ROTATE);
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'transform')).click(function () {
      self.toggleMode(ImpressPresentationEditor.TRANSFORM);
      self.IP.refocusView();
    }).appendTo($buttonBar);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'edit')).click(function () {
      //self.goToEditContent();
    }).appendTo($buttonBar);

    // Create selector for selecting which slide we are on.
    self.createStepSelectorWidget()
      .appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.createStepSelector = function () {
    var self = this;
    self.$stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
      console.log("changing slide index!");
      self.editingSlideIndex = $(this).val();
    })
  };

  ImpressPresentationEditor.prototype.createStepSelectorWidget = function () {
    var self = this;

    var $selectorContainer = $('<div>', {
      'class': 'h5p-select-container'
    });

    /**
     * Selector for which slide we are editing
     */
    self.$stepSelector.appendTo($selectorContainer);

    /**
     * Go to selected slide button
     */
    JoubelUI.createButton({
      'class': 'h5p-select-go-to'
    }).click(function () {
      self.IP.$jmpress.jmpress('goTo', '#' + self.IP.ID_PREFIX + self.editingSlideIndex);
    }).appendTo($selectorContainer);

    return $selectorContainer;
  };

  ImpressPresentationEditor.prototype.addStepToSelector = function ($step, idx) {
    console.log("add step to selector ?", $step, idx);
    var self = this;
    var $option = $('<option>', {
      value: idx
    }).text(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step') + ' ' + idx);
    self.$stepSelector.append($option);

    self.registerEnterStepListener($step, idx);
  };

  ImpressPresentationEditor.prototype.registerEnterStepListener = function ($step, idx) {
    var self = this;
    console.log("register enter step listener", $step, idx);
    $step.on('enterStep', function () {
      console.log("entered step ??", $step, idx);
      var modeSelected = false;
      for (var editMode in self.editModes) {
        if (self.editModes.hasOwnProperty(editMode) && !modeSelected) {
          console.log("edit mode ?", self.editModes[editMode]);
          if (self.editModes[editMode]) {
            modeSelected = true;
          }
        }
      }
      if (!modeSelected) {
        self.setSelectorStep(idx)
      }
    });
  };

  ImpressPresentationEditor.prototype.setSelectorStep = function (idx) {
    var self = this;
    console.log("set selector step !!");
    self.$stepSelector.val(idx);
    self.editingSlideIndex = idx;
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
    H5PEditor.processSemanticsChunk(self.semanticsList, {views: self.params.views}, self.$semantics, this);
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
    var activeStepParams = self.params.views[currentId];

    var newStepParams = $.extend(true, {}, this.defaults);
    $.extend(true, newStepParams.positioning, activeStepParams.positioning);
    var viewObject = self.IP.createViewObject(self.IP.idCounter, newStepParams);

    // Create example html from active step
    var $newStep = self.IP.createViewHtml(viewObject);
    viewObject.$element = $newStep;
    self.registerEnterStepListener($newStep, self.IP.idCounter);
    self.createExampleAction(viewObject);

    // Push to view elements array
    self.IP.viewElements.push(viewObject);
    self.IP.idCounter += 1;
    self.IP.$jmpress.jmpress('canvas').append($newStep);
    self.IP.$jmpress.jmpress('init', $newStep);

    // Add step to params
    self.params.views.push(newStepParams);

    // Redraw semantics
    self.updateSemantics();

    // Set step as current
    self.IP.$jmpress.jmpress('goTo', '#' + self.IP.ID_PREFIX + viewObject.idCounter);
  };

  ImpressPresentationEditor.prototype.createExampleAction = function (viewObject) {
    var self = this;

    // Find Advanced Text library with correct version from semantics, should be more robust.
    var libraryOptions = self.field.fields[1].field.fields[0].options;
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

  ImpressPresentationEditor.prototype.getUniqueId = function ($step) {
    var self = this;
    var stepId = $step.attr('id');
    var id = stepId.split(self.IP.ID_PREFIX);
    return id[1];
  };

  /**
   * Toggle editor mode.
   */
  ImpressPresentationEditor.prototype.toggleMode = function (mode) {
    var self = this;
    if (self.editModes[mode]) {
      self.disableMode(mode);
    } else {
      self.enableMode(mode);
    }
  };

  /**
   * Enable free transform mode. Disables click navigation.
   */
  ImpressPresentationEditor.prototype.enableMode = function (mode) {
    var self = this;

    // Disable all modes before enabling new mode
    self.disableAllModes();
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = false;
    self.editModes[mode] = true;
  };

  /**
   * Disable free transform mode.
   */
  ImpressPresentationEditor.prototype.disableMode = function (mode) {
    var self = this;
    self.editModes[mode] = false;
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
  };

  /**
   * Disable all free transform modes
   */
  ImpressPresentationEditor.prototype.disableAllModes = function () {
    var self = this;

    for (var mode in self.editModes) {
      if (self.editModes.hasOwnProperty(mode)) {
        self.editModes[mode] = false;
      }
    }

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

  /**
   * Update step by reapplying styles
   * @param {Number} [idx]
   */
  ImpressPresentationEditor.prototype.updateStep = function (idx) {
    var self = this;
    var $updateStep;
    if (idx) {
      var viewObject = self.getViewObjectFromIndex(idx);
      $updateStep = viewObject.$element;
    }
    else {
      $updateStep = self.IP.$jmpress.jmpress('active');
    }
    console.log("update step", $updateStep);

    self.IP.$jmpress.jmpress('reapply', $updateStep);
  };

  ImpressPresentationEditor.prototype.getViewObjectFromIndex = function (idx) {
    var self = this;
    return self.IP.viewElements[idx];
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    return true;
  };

  ImpressPresentationEditor.MOVE = 'move';
  ImpressPresentationEditor.ROTATE = 'rotate';
  ImpressPresentationEditor.TRANSFORM = 'transform';

  return ImpressPresentationEditor;

}(H5P.jQuery, H5P.JoubelUI, H5PEditor.ImpressPresentationEditor.FreeTransform));

// Default english translations
H5PEditor.language['H5PEditor.ImpressPresentationEditor'] = {
  libraryStrings: {
    step: 'Step',
    add: 'Add slide!',
    move: 'Move step!',
    rotate: 'Rotate slide!',
    transform: 'Transform step!',
    edit: 'Edit content!'
  }
};
