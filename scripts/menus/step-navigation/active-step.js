H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.ActiveStep = (function ($, JoubelUI) {

  function ActiveStep(IPEditor) {

    // Wrapper
    var $activeStepDisplayWrapper = $('<div>', {
      'class': 'h5p-active-step-wrapper'
    });

    // Title
    $('<div>', {
      'class': 'h5p-active-step-title',
      'html': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'activeStep', {}),
      appendTo: $activeStepDisplayWrapper
    });

    // Display the active step
    var $activeStepDisplay = $('<input>', {
      'class': 'h5p-active-step-display',
      'maxlength': 15,
      appendTo: $activeStepDisplayWrapper
    }).change(function () {
      IPEditor.updateActiveStepDisplay($(this).val());
    }).val(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'step', {}) + ' 0');

    this.setActiveStepDisplay = function (step) {
      var stepName = step.getName();
      $activeStepDisplay.val(stepName);
    };

    this.appendTo = function ($wrapper) {
      $activeStepDisplayWrapper.appendTo($wrapper);
    }
  }

  return ActiveStep;
})(H5P.jQuery, H5P.JoubelUI);
