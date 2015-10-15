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

    /**
     * Editing slide index
     *
     * @type {number}
     */
    self.editingSlideIndex = 0;

    /**
     * Route
     *
     * @type {Array}
     */
    self.route = [];

    /**
     * Keeps track of semantic fields for parameters
     *
     * @type {void|*}
     */
    self.semanticsList = $.extend(true, [], self.field.fields[1].field);

    /**
     * Editor wrapper
     *
     * @type {H5P.jQuery}
     */
    self.$wrapper = $(
      '<div class="impress-editor-wrapper">' +
        '<div class="impress-presentation-preview"></div>' +
        '<div class="impress-presentation-buttonbar"></div>' +
        '<div class="impress-presentation-step-dialog"></div>' +
      '</div>'
    );

    /**
     * Preview container
     *
     * @type {jQuery}
     */
    self.$preview = $('.impress-presentation-preview', self.$wrapper);

    /**
     * Button bar
     *
     * @type {jQuery}
     */
    self.$buttonBar = $('.impress-presentation-buttonbar', self.$wrapper);

    /**
     * Step dialog
     *
     * @type {jQuery}
     */
    self.$stepDialog = $('.impress-presentation-step-dialog', self.$wrapper);

    // Make sure widget can pass readies (used when processing semantics)
    self.passReadies = true;
    self.parent.ready(function () {
      self.passReadies = false;
    });

    self.resize();

    // Create preview
    self.createPreview();

    // Create example content if no params
    if (self.emptyParams) {
      self.createExampleContent(self.IP.getStep(0));
      self.params.views[0] = self.IP.getStep(0).getParams();
      self.updateSemantics();
    }

    // Enable free transform of steps
    self.freeTransform = new FreeTransform(self.IP, self);
  }

  ImpressPresentationEditor.prototype.createPreview = function () {
    var self = this;
    self.IP = new H5P.ImpressPresentation({viewsGroup: self.params}, H5PEditor.contentId);

    // Reference IP params to only update params one place
    self.params.views = self.IP.params.viewsGroup.views;
    self.createStepSelector();

    self.IP.on('createdStep', function (e) {
      var step = e.data;
      self.addStepToSelector(step);
      step.disableContentInteraction();

      // Listen for library (re)creation in Step
      step.on('createdLibraryElement', function () {
        step.disableContentInteraction();
      });

      self.registerEnterStepListener(step);
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
    self.$wrapper.appendTo($wrapper);
    self.setPerspectiveRatio();

    // Create buttons
    self.createButtons(self.$buttonBar);

    self.resize();
  };

  ImpressPresentationEditor.prototype.createButtons = function ($buttonBar) {
    var self = this;

    // Create selector for selecting which step we are on.
    self.createStepSelectorWidget()
      .appendTo($buttonBar);

    // Add step dynamically
    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'add')).click(function () {
      self.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($buttonBar);

    // Remove step dynamically
    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'remove')).click(function () {
      self.removeStep();
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
      self.editStepContent();
    }).appendTo($buttonBar);
  };

  /**
   * Edit step content, show form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.editStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingSlideIndex);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form
    step.getLibraryForm().appendTo(self.$stepDialog);
    self.$stepDialog.addClass('show');
  };

  /**
   * Done editing step content, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingSlideIndex);

    // Hide library form
    step.getLibraryForm().detach();
    self.$stepDialog.removeClass('show');

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');
  };

  ImpressPresentationEditor.prototype.createStepSelector = function () {
    var self = this;
    self.$stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
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
      self.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + self.editingSlideIndex);
    }).appendTo($selectorContainer);

    return $selectorContainer;
  };

  /**
   * Add step to selector
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.addStepToSelector = function (step) {
    var self = this;

    var idx = step.getId();
    var $option = $('<option>', {
      value: idx
    }).text(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step') + ' ' + idx);
    self.$stepSelector.append($option);
  };

  ImpressPresentationEditor.prototype.removeStepFromSelector = function (step) {
    var self = this;
    self.$stepSelector.children().each(function () {
      if ($(this).val() === step.getId()) {
        $(this).remove();
      }
    })
  };

  /**
   * Register listener for when entering steps
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.registerEnterStepListener = function (step) {
    var self = this;
    var $step = step.getElement();
    var idx = step.getId();
    $step.on('enterStep', function () {
      if (idx !== self.editingSlideIndex) {
        self.setSelectorStep(idx);
      }
    });
  };

  ImpressPresentationEditor.prototype.setSelectorStep = function (idx) {
    var self = this;
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

  /**
   * Update semantics.
   */
  ImpressPresentationEditor.prototype.updateSemantics = function () {
    var self = this;
    self.createSemantics();
  };

  /**
   * Create semantics.
   */
  ImpressPresentationEditor.prototype.createSemantics = function () {
    var self = this;

    // semantics holder
    self.IP.steps.forEach(function (step) {
      self.createLibrarySemantics(step);
    });
  };

  /**
   * Create library semantics
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.createLibrarySemantics = function (step) {
    var self = this;
    var $libraryInstance = self.createSemanticsFields('action', step, self.semanticsList.fields);

    step.setLibraryForm($libraryInstance);

    // Store children on step
    step.children = self.children;
    self.children = undefined;

    // Create done button
    JoubelUI.createButton({
      'class': 'h5p-library-done',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'done')
    }).click(function () {
      var valid = true;
      step.children.forEach(function (child) {
        if (!child.validate()) {
          valid = false;
        }
      });

      if (valid) {
        step.updateLibrary();
        self.doneStepContent(step);
      }
    }).appendTo($libraryInstance);
  };

  var findPropertyField = function (property, semanticsList) {
    var actionField = [];

    semanticsList.forEach(function (semanticField) {
      if (semanticField.name === property) {
        actionField.push(semanticField);
      }
    });

    return actionField;
  };

  /**
   * Create semantic fields for step.
   * @param {String} property semantics property
   * @param {Object} step parameters for step containing property
   * @param {Object} semanticsList semantic field list containing property
   */
  ImpressPresentationEditor.prototype.createSemanticsFields = function (property, step, semanticsList) {
    var self = this;
    var actionField = findPropertyField(property, semanticsList);

    var $semanticsInstance = $('<div>', {
      'class': 'h5p-semantics-instance'
    });

    // Only process semantics field if found
    if (actionField.length) {
      H5PEditor.processSemanticsChunk(actionField, step.getParams(), $semanticsInstance, self);
    }

    return $semanticsInstance;
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

  /**
   * Add new step at active step position and go to new step.
   */
  ImpressPresentationEditor.prototype.addStep = function () {
    var self = this;

    // Initialize new step at the position of active step
    var $activeStep = self.IP.$jmpress.jmpress('active');
    var activeStepId = self.getUniqueId($activeStep);
    var activeStepParams = self.IP.getStep(activeStepId).getParams();
    var newStepParams = $.extend(true, {}, this.defaults);
    $.extend(true, newStepParams.positioning, activeStepParams.positioning);

    // Create step, example content and activate it
    var newStep = self.IP.createStep(newStepParams, true)
      .createExampleContent(self.field.fields[1].field.fields[0].options)
      .activateStep(self.IP.$jmpress);

    // Redraw semantics
    self.createLibrarySemantics(newStep);
    var newStepId = newStep.getId();

    // Set step as current
    self.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + newStepId);
    self.setSelectorStep(newStepId);
  };

  ImpressPresentationEditor.prototype.removeStep = function () {
    var self = this;
    if (confirm(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'removeStep'))) {
      var editingStep = self.IP.getStep(self.editingSlideIndex);
      self.IP.$jmpress.jmpress('prev');
      self.removeStepFromSelector(editingStep);
      editingStep.removeStep(self.IP.$jmpress);
      self.IP.removeStep(self.editingSlideIndex);
    }
  };

  ImpressPresentationEditor.prototype.getUniqueId = function ($step) {
    var stepId = $step.attr('id');
    var id = stepId.split(H5P.ImpressPresentation.ID_PREFIX);
    return parseInt(id[1]);
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
      var step = self.getStep(idx);
      $updateStep = step.getElement();
    }
    else {
      $updateStep = self.IP.$jmpress.jmpress('active');
    }

    self.IP.$jmpress.jmpress('reapply', $updateStep);
  };

  ImpressPresentationEditor.prototype.getStep = function (idx) {
    var self = this;
    return self.IP.getStep(idx);
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    // Always valid
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
    add: 'Add step',
    remove: 'Delete step',
    move: 'Move step',
    rotate: 'Rotate step',
    transform: 'Transform step',
    edit: 'Edit step content',
    done: 'Done',
    removeStep: 'Are you sure you wish to remove this step?'
  }
};
