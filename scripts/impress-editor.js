/**
 * Interactive Video editor widget module
 *
 * @param {jQuery} $
 * @param {H5P.JoubelUI} JoubelUI
 * @param {H5PEditor.ImpressPresentationEditor.FreeTransform} FreeTransform
 * @param {H5PEditor.ImpressPresentationEditor.CoreMenu} CoreMenu
 */
H5PEditor.widgets.impressPresentationEditor =
H5PEditor.ImpressPresentationEditor =
(function ($, JoubelUI, FreeTransform, CoreMenu, OrderingMenu, TransformMenu, StepDialog) {

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
        includeInPath: true
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
    self.editingStepId = 0;

    /**
     * Keeps track of semantic fields for parameters
     *
     * @type {void|*}
     */
    self.semanticsList = $.extend(true, [], self.field.fields[0].field);

    /**
     * Editor wrapper
     *
     * @type {jQuery}
     */
    self.$wrapper = $(
      '<div class="impress-editor-wrapper">' +
        '<div class="impress-presentation-preview"></div>' +
        '<div class="impress-presentation-buttonbar"></div>' +
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
     * @type {H5PEditor.ImpressPresentationEditor.StepDialog}
     */
    self.stepDialog = new StepDialog().appendTo(self.$wrapper);

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
      var firstStep = self.IP.getStep(0);
      firstStep.createExampleContent(self.field.fields[0].field.fields[0].options)
        .setName(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' ' + firstStep.getId());
      self.updateActiveStepDisplay(firstStep.getName());
      self.params.views[0] = self.IP.getStep(0).getParams();
    }

    // Enable free transform of steps
    self.freeTransform = new FreeTransform(self.IP, self);

    // Core Menu
    self.coreMenu = new CoreMenu(self.IP, self);

    // Transform Menu
    self.transformMenu = new TransformMenu(self, self.IP);

    // Ordering Menu
    self.orderingMenu = new OrderingMenu(self);
  }



  /**
   * Create preview of Impressive Presentation
   */
  ImpressPresentationEditor.prototype.createPreview = function () {
    var self = this;
    self.IP = new H5P.ImpressPresentation({viewsGroup: self.params}, H5PEditor.contentId, {disableNavLine: true});

    // Reference IP params to only update params one place
    self.params.views = self.IP.params.viewsGroup.views;
    self.createStepSelector();
    self.createActiveStepDisplay();

    self.IP.on('createdStep', function (e) {
      var step = e.data;
      step.disableContentInteraction();
      self.addStepToSelector(step);

      // Listen for library (re)creation in Step
      step.on('createdLibraryElement', function () {
        step.disableContentInteraction();
      });

      self.registerEnterStepListener(step);
    });

    self.IP.attach(self.$preview);
    self.editingStepId = self.getUniqueId(self.IP.$jmpress.jmpress('active'));
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
    var $topButtonRow = self.createTopButtonRow($buttonBar);
    var $bottomButtonRow = self.createBottomButtonRow($buttonBar);


    self.coreMenu.appendTo($bottomButtonRow);
    var $coreButtonBar = self.coreMenu.getElement();


    self.transformMenu.appendTo($bottomButtonRow);
    var $transformButtonBar = self.transformMenu.getElement();

    self.orderingMenu.appendTo($bottomButtonRow);
    var $orderingButtonBar = self.orderingMenu.getElement();

    var setActiveButton = function ($button) {
      $coreMenuButton.removeClass('active');
      $transformMenuButton.removeClass('active');
      $orderingMenuButton.removeClass('active');
      $backgroundMenuButton.removeClass('active');
      $editContentMenuButton.removeClass('active');
      $button.addClass('active');
    };

    var showSubMenuBar = function ($subMenu) {
      $coreButtonBar.removeClass('show');
      $transformButtonBar.removeClass('show');
      $orderingButtonBar.removeClass('show');
      $subMenu.addClass('show');
    };

    // Create selector for selecting which step we are on.
    var $leftAlignedMenu = $('<div>', {
      'class': 'h5p-left-aligned-main-menu'
    }).appendTo($topButtonRow);

    self.createStepSelectorWidget()
      .appendTo($leftAlignedMenu);

    self.createActiveStepDisplayWidget()
      .appendTo($leftAlignedMenu);

    self.createModeDisplay()
      .appendTo($leftAlignedMenu);

    var $rightAlignedMenu = $('<div>', {
      'class': 'h5p-right-aligned-submenu'
    }).appendTo($topButtonRow);

    var coreTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'coreMenu', {});
    var $coreMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-core-menu-button active',
      'title': coreTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($coreButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var transformTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'transformMenu', {});
    var $transformMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-transform-menu-button',
      'title': transformTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($transformButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var orderingTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'orderingMenu', {});
    var $orderingMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-ordering-menu-button',
      'title': orderingTitle
    }).click(function () {
      setActiveButton($(this));
      showSubMenuBar($orderingButtonBar);
      self.IP.refocusView();
    }).appendTo($rightAlignedMenu);

    var backgroundTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'background', {});
    var $backgroundMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-background-menu-button',
      'title': backgroundTitle
    }).click(function () {
      self.editStepBackground();
    }).appendTo($rightAlignedMenu);

    var editTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'edit', {});
    var $editContentMenuButton = JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-edit-content-menu-button',
      'title': editTitle
    }).click(function () {
      self.editStepContent();
    }).appendTo($rightAlignedMenu);

  };

  ImpressPresentationEditor.prototype.createTopButtonRow = function ($buttonBar) {
    return $('<div>', {
      'class': 'h5p-buttonbar-top-row'
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.createBottomButtonRow = function ($buttonBar) {
    return $('<div>', {
      'class': 'h5p-buttonbar-bottom-row'
    }).appendTo($buttonBar);
  };

  ImpressPresentationEditor.prototype.editStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form and set dialog done callback
    self.stepDialog.append(step.getBackgroundForm())
      .show()
      .setDialogDoneCallback(function () {
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
      });
  };

  /**
   * Edit step content, show form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.editStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide jmpress
    self.IP.$jmpress.addClass('hide');

    // Show library form and set dialog done callback
    self.stepDialog.append(step.getLibraryForm())
      .show()
      .setDialogDoneCallback(function () {
        var valid = true;
        step.children.forEach(function (child) {
          if (!child.validate()) {
            valid = false;
          }
        });

        if (valid) {
          if (H5PEditor.Html) {
            H5PEditor.Html.removeWysiwyg();
          }
          step.updateLibrary();
          self.doneStepContent(step);
        }
      });
  };

  /**
   * Done editing step content, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepContent = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide library form
    step.getLibraryForm().detach();
    self.stepDialog.hide();

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');

    self.IP.refocusView();
  };

  /**
   * Done editing step background, remove form.
   * @param {H5P.ImpressPresentation.Step} [step]
   */
  ImpressPresentationEditor.prototype.doneStepBackground = function (step) {
    var self = this;
    step = step ? step : self.IP.getStep(self.editingStepId);

    // Hide library form
    step.getBackgroundForm().detach();
    self.stepDialog.hide();

    // Show jmpress
    self.IP.$jmpress.removeClass('hide');

    self.IP.refocusView();
  };

  ImpressPresentationEditor.prototype.createStepSelector = function () {
    var self = this;
    self.$stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
      var stepId = parseInt($(this).val());
      self.updateButtonBar(stepId);
      self.IP.refocusView();
    })
  };

  /**
   * Remove step from route
   *
   * @param {Number} stepId
   * @returns {Boolean} True if step was removed from route
   */
  ImpressPresentationEditor.prototype.removeFromRoute = function (stepId) {
    var self = this;

    // Route must have at least one step
    if (self.IP.getRoute().length <= 1) {
      self.IP.createErrorMessage(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'removeFromPathError', {}));
      return false;
    }

    self.IP.removeFromRoute(stepId);
    return true;
  };

  ImpressPresentationEditor.prototype.updateButtonBar = function (stepId) {
    var self = this;
    self.$stepSelector.val(stepId);
    self.editingStepId = stepId;
    self.orderingMenu.updateRouteCheckbox(self.IP.getStep(stepId));

    return this;
  };

  ImpressPresentationEditor.prototype.createActiveStepDisplay = function () {
    var self = this;
    self.$activeStepDisplay = $('<input>', {
      'class': 'h5p-active-step-display',
      'maxlength': 15
    }).change(function () {
      self.updateActiveStepDisplay($(this).val());
    }).val(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' 0');
  };

  ImpressPresentationEditor.prototype.updateActiveStepDisplay = function (newName) {
    var self = this;
    var $activeStep = self.IP.$jmpress.jmpress('active');
    var activeStepId = self.getUniqueId($activeStep);
    var activeStep = self.IP.getStep(activeStepId);
    activeStep.setName(newName);
    self.updateStepInSelector(activeStep);
    self.setActiveStepDisplay(activeStep);

    return this;
  };

  ImpressPresentationEditor.prototype.createActiveStepDisplayWidget = function () {
    var self = this;

    // Wrapper
    var $activeStepDisplayWrapper = $('<div>', {
      'class': 'h5p-active-step-wrapper'
    });

    // Title
    $('<div>', {
      'class': 'h5p-active-step-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'activeStep', {})
    }).appendTo($activeStepDisplayWrapper);

    // Display the active step
    self.$activeStepDisplay.appendTo($activeStepDisplayWrapper);

    return $activeStepDisplayWrapper;
  };

  ImpressPresentationEditor.prototype.setActiveStepDisplay = function (step) {
    var self = this;
    var stepName = step.getName();
    self.$activeStepDisplay.val(stepName);
  };

  ImpressPresentationEditor.prototype.createModeDisplay = function () {
    var self = this;
    var $modeContainer = $('<div>', {
      'class': 'h5p-mode-container hide'
    });

    $('<div>', {
      'class': 'h5p-mode-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'mode', {})
    }).appendTo($modeContainer);

    self.$activeMode = $('<div>', {
      'class': 'h5p-mode-active'
    }).appendTo($modeContainer);

    self.$modeContainer = $modeContainer;

    return $modeContainer;
  };

  ImpressPresentationEditor.prototype.createStepSelectorWidget = function () {
    var self = this;

    // Wrapper
    var $selectorContainer = $('<div>', {
      'class': 'h5p-select-container'
    });

    // Title
    $('<div>', {
      'class': 'h5p-select-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'editingStep', {})
    }).appendTo($selectorContainer);

    // Add selector
    self.$stepSelector.appendTo($selectorContainer);

    /**
     * Go to selected slide button
     */
    var goToTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'goTo', {});
    JoubelUI.createButton({
      'class': 'h5p-select-go-to',
      'title': goToTitle
    }).click(function () {
      self.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + self.editingStepId);
      self.IP.refocusView();
    }).appendTo($selectorContainer);

    return $selectorContainer;
  };

  /**
   * Update step name in selector.
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.updateStepInSelector = function (step) {
    var self = this;
    var stepId = step.getId();
    self.$stepSelector.find('option[value=' + stepId + ']')
      .each(function () {
        $(this).text(step.getName());
      });
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
    }).text(step.getName());
    self.$stepSelector.append($option);
  };

  /**
   * Register listener for when entering steps
   * @param {H5P.ImpressPresentation.Step} step
   */
  ImpressPresentationEditor.prototype.registerEnterStepListener = function (step) {
    var self = this;
    var $step = step.getElement();
    $step.on('enterStep', function () {
      self.setActiveStepDisplay(step);
    });
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
    step.children = step.children.concat(self.children);
    self.children = undefined;

    return this;
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
    if (!step.children.length) {
      step.children = [];
    }
    step.children = step.children.concat(self.children);
    self.children = undefined;

    return this;
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
   * Get unique id of step
   *
   * @param {jQuery} $step
   * @returns {Number}
   */
  ImpressPresentationEditor.prototype.getUniqueId = function ($step) {
    var stepId = $step.attr('id');
    var id = stepId.split(H5P.ImpressPresentation.ID_PREFIX);
    return parseInt(id[1]);
  };

  /**
   * Get current editing step id
   *
   * @returns {number} Id of editing step
   */
  ImpressPresentationEditor.prototype.getEditingStep = function () {
    return this.editingStepId;
  };

  /**
   * Toggle editor mode.
   * @returns {Boolean} Returns new state of mode
   */
  ImpressPresentationEditor.prototype.toggleMode = function (mode) {
    var self = this;
    if (self.editModes[mode]) {
      self.disableMode(mode);
    } else {
      self.enableMode(mode);
    }

    return self.editModes[mode];
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
    self.$activeMode.html(H5PEditor.t('H5PEditor.ImpressPresentationEditor', mode, {}));
    self.$modeContainer.removeClass('hide');
  };

  /**
   * Disable free transform mode.
   */
  ImpressPresentationEditor.prototype.disableMode = function (mode) {
    var self = this;
    self.editModes[mode] = false;
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
    self.$modeContainer.addClass('hide');
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
    self.$modeContainer.addClass('hide');
    var settings = self.IP.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
  };

  /**
   * Reselct current step, needed for some steps to update.
   */
  ImpressPresentationEditor.prototype.reselectStep = function () {
    var self = this;
    var $activeSlide = self.IP.$jmpress.jmpress('active');
    var activeSlideId = self.getUniqueId($activeSlide);
    if (self.editingStepId === activeSlideId) {
      self.IP.$jmpress.jmpress('select', $activeSlide, 'resize');
    }
  };

  /**
   * Update step by reapplying styles
   * @param {Number} [id]
   */
  ImpressPresentationEditor.prototype.updateStep = function (id) {
    var self = this;
    var $updateStep;
    if (id !== undefined) {
      var step = self.IP.getStep(id);
      $updateStep = step.getElement();
    }
    else {
      $updateStep = self.IP.$jmpress.jmpress('active');
    }

    self.IP.$jmpress.jmpress('reapply', $updateStep);
  };

  ImpressPresentationEditor.prototype.remove = function () {

  };

  ImpressPresentationEditor.prototype.validate = function () {
    var self = this;

    // Register route in semantics
    self.params.route = self.IP.route;

    // Always valid
    return true;
  };

  /**
   * Find property field
   *
   * @param property
   * @param semanticsList
   *
   * @returns {Array}
   */
  var findPropertyField = function (property, semanticsList) {
    var actionField = [];

    semanticsList.forEach(function (semanticField) {
      if (semanticField.name === property) {
        actionField.push(semanticField);
      }
    });

    return actionField;
  };

  ImpressPresentationEditor.MOVE = 'move';
  ImpressPresentationEditor.ROTATE = 'rotate';
  ImpressPresentationEditor.TRANSFORM = 'transform';

  return ImpressPresentationEditor;

}(H5P.jQuery,
  H5P.JoubelUI,
  H5PEditor.ImpressPresentationEditor.FreeTransform,
  H5PEditor.ImpressPresentationEditor.CoreMenu,
  H5PEditor.ImpressPresentationEditor.OrderingMenu,
  H5PEditor.ImpressPresentationEditor.TransformMenu,
  H5PEditor.ImpressPresentationEditor.StepDialog
));

// Default english translations
H5PEditor.language['H5PEditor.ImpressPresentationEditor'] = {
  libraryStrings: {
    step: 'Step',
    add: 'Add step',
    remove: 'Delete step',
    edit: 'Edit step content',
    background: 'Edit step background',
    coreMenu: 'Show core menu',
    transformMenu: 'Show transform menu',
    orderingMenu: 'Show ordering menu',
    goTo: 'Go to step',
    done: 'Done',
    removeStep: 'Are you sure you wish to remove this step?',
    removeStepError: 'You can not have zero steps, create a new step and try again.',
    removeFromPathError: 'You can not have an empty path, add a different step to the path and try again.',
    include: 'Included in path',
    mode: 'Mode:',
    move: 'Move',
    rotate: 'Rotate',
    transform: 'Transform',
    editingStep: 'Editing step:',
    activeStep: 'Active step:',
    orderSteps: 'Order steps',
    routeListText: 'Reorder a step by dragging it to a new place'
  }
};
