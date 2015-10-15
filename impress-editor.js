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
    self.createTopButtonRow($buttonBar);
    self.createBottomButtonRow($buttonBar);
  };

  ImpressPresentationEditor.prototype.createTopButtonRow = function ($buttonBar) {
    var self = this;

    var $topButtonRow = $('<div>', {
      'class': 'h5p-buttonbar-top-row'
    }).appendTo($buttonBar);

    // Create selector for selecting which step we are on.
    self.createStepSelectorWidget()
      .appendTo($topButtonRow);

    // Create route check box
    self.createRouteCheckbox()
      .appendTo($topButtonRow);
  };

  ImpressPresentationEditor.prototype.createBottomButtonRow = function ($buttonBar) {
    var self = this;

    var $bottomButtonRow = $('<div>', {
      'class': 'h5p-buttonbar-bottom-row'
    }).appendTo($buttonBar);

    // Add step dynamically
    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'add')).click(function () {
      self.addStep();
      self.IP.refocusView();
      return false;
    }).appendTo($bottomButtonRow);

    // Remove step dynamically
    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'remove')).click(function () {
      self.removeStep();
      self.IP.refocusView();
      return false;
    }).appendTo($bottomButtonRow);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'move')).click(function () {
      self.toggleMode(ImpressPresentationEditor.MOVE);
      self.IP.refocusView();
    }).appendTo($bottomButtonRow);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'rotate')).click(function () {
      self.toggleMode(ImpressPresentationEditor.ROTATE);
      self.IP.refocusView();
    }).appendTo($bottomButtonRow);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'transform')).click(function () {
      self.toggleMode(ImpressPresentationEditor.TRANSFORM);
      self.IP.refocusView();
    }).appendTo($bottomButtonRow);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'edit')).click(function () {
      self.editStepContent();
    }).appendTo($bottomButtonRow);

    JoubelUI.createSimpleRoundedButton(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'background')).click(function () {
      self.editStepBackground();
    }).appendTo($bottomButtonRow);
  };

  ImpressPresentationEditor.prototype.editStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingSlideIndex);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form
    step.getBackgroundForm().appendTo(self.$stepDialog);
    self.$stepDialog.addClass('show');
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

  /**
   * Done editing step background, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingSlideIndex);

    // Hide library form
    step.getBackgroundForm().detach();
    self.$stepDialog.removeClass('show');

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');
  };

  ImpressPresentationEditor.prototype.createStepSelector = function () {
    var self = this;
    self.$stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
      self.updateButtonBar(parseInt($(this).val()));
      self.IP.refocusView();
    })
  };

  ImpressPresentationEditor.prototype.createRouteCheckbox = function () {
    var self = this;
    var $routeCheckbox = $('<div>', {
      'class': 'h5p-check-box'
    });

    var $includeInPathLabel = $('<label>', {
      'text': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'include')
    }).appendTo($routeCheckbox);

    self.$includeInPathCheckbox = $('<input>', {
      'type': 'checkbox',
      'checked': 'checked'
    }).click(function () {
      console.log("is it checked now ?", $(this).is(':checked'));
      var step = self.IP.getStep(self.editingSlideIndex);
      var checked = $(this).is(':checked');
      step.setRouteState(checked);

      if (checked) {
        self.IP.addToRoute(step.getId());
      }
      else {
        self.IP.removeFromRoute(step.getId());
      }
      self.IP.updateRoute();
      self.IP.refocusView();
    }).prependTo($includeInPathLabel);

    return $routeCheckbox;
  };

  /**
   * Update route checkbox with step params
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.updateRouteCheckbox = function (step) {
    var self = this;
    self.$includeInPathCheckbox.prop('checked', step.getRouteState());
  };

  ImpressPresentationEditor.prototype.updateButtonBar = function (stepId) {
    var self = this;
    self.$stepSelector.val(stepId);
    self.updateRouteCheckbox(self.IP.getStep(stepId));
    self.editingSlideIndex = stepId;
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
      self.IP.refocusView();
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
    var stepId = step.getId();
    self.$stepSelector.children().each(function () {
      if ($(this).val() === stepId) {
        $(this).remove();
      }
    });
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
    self.updateButtonBar(idx);
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
      self.createBackgroundSemantics(step);
    });
  };

  /**
   * Create background semantics
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.createBackgroundSemantics = function (step) {
    var self = this;
    var $libraryInstance = $('<div>', {
      'class': 'h5p-semantics-instance'
    });

    H5PEditor.processSemanticsChunk(self.semanticsList.fields[2].fields, step.getParams().backgroundGroup, $libraryInstance, self);

    step.setBackgroundForm($libraryInstance);

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
        step.setBackground(self.IP.contentId);
        self.doneStepBackground(step);
      }
    }).appendTo($libraryInstance);
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
    var newStep = self.IP.createStep(newStepParams, true, activeStepId)
      .createExampleContent(self.field.fields[1].field.fields[0].options)
      .activateStep(self.IP.$jmpress);

    self.IP.updateRoute();

    // Redraw semantics
    self.createLibrarySemantics(newStep);
    self.createBackgroundSemantics(newStep);
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
    background: 'Edit step background',
    done: 'Done',
    removeStep: 'Are you sure you wish to remove this step?',
    include: 'Included in path'
  }
};
