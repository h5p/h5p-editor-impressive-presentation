H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.OverviewStep = (function ($, JoubelUI) {

  function OverviewStep(IPEditor) {

    var self = this;

    var currentStep;

    var overviewStep;

    var title = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'showOverview', {});

    var createStep = function () {
      if (!currentStep) {
        throw new ReferenceError('No current step set!');
      }

      var params = currentStep.getParams();

      // Strip params of library data
      params.action = {};
      params.backgroundGroup = {};

      // Initialize new step at the position of active step
      var newStepParams = $.extend(true, {}, IPEditor.defaults);

      // Extend positions
      $.extend(true, newStepParams.positioning, params.positioning);

      // Increase positioning to a point where we see straight at the step and can see
      // the whole step.
      newStepParams.positioning.z += 2000;

      // Create step, example content and activate it
      overviewStep = IPEditor.createStep(newStepParams, {addToParams: true, insertAfter: currentStep.getElement()})
        .isOverviewStep(true)
        .activateStep(IPEditor.IP.$jmpress);

      IPEditor.createLibrarySemantics(overviewStep)
        .createBackgroundSemantics(overviewStep);

      // Set step as current
      overviewStep.setName(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'showingOverview'));
      IPEditor.IP.goToStep(overviewStep);
      IPEditor.updateActiveStepDisplay(overviewStep.getName());
    };

    var toggleOverviewStep = function () {
      $overviewButton.toggleClass('active', !overviewStep);
      if (overviewStep) {
        self.removeOverviewStep();
      }
      else {
        createStep();
      }
    };

    // Create button
    var $overviewButton = JoubelUI.createButton({
      'class': 'h5p-impress-overview-step-button',
      'title': title
    }).click(function () {
      toggleOverviewStep();
    });

    // Create step

    // Move step out until we are able to see all steps

    // Alternative: Find furthest out step, move further out

    this.removeOverviewStep = function () {
      if (overviewStep) {
        var overviewStepId = overviewStep.getId();
        overviewStep = undefined;
        IPEditor.removeStep({
          stepId: overviewStepId,
          skipConfirmation: true,
          goToStep: currentStep
        });
      }

      return this;
    };

    this.enteredStep = function (step) {
      if (!step.isOverviewStep()) {
        this.removeOverviewStep();
      }

      return this;
    };

    this.setStep = function (step) {

      if (!step.isOverviewStep()) {
        currentStep = step;
      }

      return this;
    };

    this.appendTo = function ($wrapper) {
      $overviewButton.appendTo($wrapper);

      return this;
    }

  }

  return OverviewStep;
})(H5P.jQuery, H5P.JoubelUI);
