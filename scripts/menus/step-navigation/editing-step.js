H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.EditingStep = (function ($, JoubelUI) {

  function EditingStep(IPEditor) {
    var self = this;

    // Container
    var $selectorContainer = $('<div>', {
      'class': 'h5p-select-container'
    });

    // Create step selector
    var $stepSelector = $('<select>', {
      'class': 'h5p-step-selector'
    }).change(function () {
      var stepId = parseInt($(this).val());
      self.updateButtonBar(stepId);
      IPEditor.IP.refocusView();
    });

    // Title
    $('<div>', {
      'class': 'h5p-select-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'editingStep', {})
    }).appendTo($selectorContainer);

    // Add selector
    $stepSelector.appendTo($selectorContainer);

    /**
     * Go to selected slide button
     */
    var goToTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'goTo', {});
    JoubelUI.createButton({
      'class': 'h5p-select-go-to',
      'title': goToTitle
    }).click(function () {
      IPEditor.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + IPEditor.editingStepId);
      IPEditor.IP.refocusView();
    }).appendTo($selectorContainer);

    var getOption = function (step) {
      return $stepSelector.find('option[value=' + step.getId() + ']');
    };

    this.updateButtonBar = function (stepId) {
      $stepSelector.val(stepId);
      IPEditor.editingStepId = stepId;
      IPEditor.orderingMenu.updateRouteCheckbox(IPEditor.IP.getStep(stepId));
    };

    this.appendTo = function ($wrapper) {
      $selectorContainer.appendTo($wrapper);
    };

    this.addStepOption = function ($option) {
      $stepSelector.append($option);
    };

    this.removeStep = function (step) {
      getOption(step).remove();

      // Make sure we update step selector, in case we deleted current step
      $stepSelector.change();
    };

    this.updateStepName = function (step) {
      getOption(step).text(step.getName());
    };
  }

  return EditingStep;
})(H5P.jQuery, H5P.JoubelUI);
