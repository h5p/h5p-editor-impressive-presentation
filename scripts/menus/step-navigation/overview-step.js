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

      $overviewButton.addClass('active');
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
      console.log("new step params", newStepParams.positioning);
      var distanceMultiple = 2000;
      var xRad = (Math.abs(newStepParams.positioning.rotateX) * Math.PI) / 180;
      var yRad = (Math.abs(newStepParams.positioning.rotateY) * Math.PI) / 180;
      console.log("radians", xRad, yRad);

      var xMultiple = Math.sin(xRad);
      var yMultiple = Math.sin(yRad);
      var zMultiple = Math.cos(yRad) * Math.cos(xRad);
      //var zMultiple = Math.cos((Math.abs(newStepParams.positioning.rotateZ) * Math.PI) / 180);
      console.log("rotations", newStepParams.positioning.rotateX, newStepParams.positioning.rotateY, newStepParams.positioning.rotateZ);
      console.log("multiples)", xMultiple, yMultiple, zMultiple);
      newStepParams.positioning.x -= (yMultiple * distanceMultiple);
      newStepParams.positioning.y += (xMultiple * distanceMultiple);
      newStepParams.positioning.z += (zMultiple * distanceMultiple);

      // absolute value of rotateY divided by 180 determines direction of positioning, 90 means 0

      console.log("updated params", newStepParams.positioning);

      // Create step, example content and activate it
      overviewStep = IPEditor.createStep(newStepParams, {addToParams: true, insertAfter: currentStep.getElement()})
        .setOverviewStep(true)
        .activateStep(IPEditor.IP.$jmpress);

      IPEditor.createLibrarySemantics(overviewStep)
        .createBackgroundSemantics(overviewStep);

      // Set step as current
      overviewStep.setName(H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'showingOverview'));
      IPEditor.IP.goToStep(overviewStep);
      IPEditor.updateActiveStepDisplay(overviewStep.getName());
    };

    var toggleOverviewStep = function () {
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
        $overviewButton.removeClass('active');
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
        self.removeOverviewStep();
      }

      return this;
    };

    this.setStep = function (step) {

      if (!step.isOverviewStep()) {
        currentStep = step;
      }

      return this;
    };

    this.getCurrentStep = function () {
      return currentStep;
    };

    this.getActiveStep = function () {
      return overviewStep ? overviewStep : currentStep;
    };

    this.appendTo = function ($wrapper) {
      $overviewButton.appendTo($wrapper);

      return this;
    }

  }

  return OverviewStep;
})(H5P.jQuery, H5P.JoubelUI);
