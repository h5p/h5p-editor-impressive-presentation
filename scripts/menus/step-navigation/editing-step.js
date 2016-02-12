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
      IPEditor.IP.$jmpress.jmpress('goTo', '#' + H5P.ImpressPresentation.ID_PREFIX + self.editingStepId);
      IPEditor.IP.refocusView();
    }).appendTo($selectorContainer);

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

    this.updateStepName = function (step) {
      var stepId = step.getId();
      $stepSelector.find('option[value=' + stepId + ']')
        .each(function () {
          $(this).text(step.getName());
        });
    };
  }

  return EditingStep;
})(H5P.jQuery, H5P.JoubelUI);
