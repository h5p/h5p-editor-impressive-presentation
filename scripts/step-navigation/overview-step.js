H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.OverviewStep = (function ($, JoubelUI) {

  function OverviewStep(IPEditor) {

    // Default viewport
    var initZoom = IPEditor.getViewport();

    // Zoom factor
    var zoomFactor = 5;

    // Current zoom state
    var isZoomedOut = false;

    /**
     * Toggle overview step
     *
     * @param {boolean} [enable] Force zoom state
     */
    var toggleOverviewStep = function (enable) {
      if (enable !== undefined) {
        isZoomedOut = !enable;
      }

      if (isZoomedOut) {
        // Restore defaults
        IPEditor.setViewport(initZoom);
      }
      else {
        // Zoom out
        IPEditor.setViewport({
          height: initZoom.height * zoomFactor,
          width: initZoom.width * zoomFactor
        });
      }
      $overviewButton.toggleClass('active', !isZoomedOut);
      IPEditor.refreshView();

      // Update zoom state
      isZoomedOut = !isZoomedOut;
    };

    // Create button
    var $overviewButton = JoubelUI.createButton({
      'class': 'h5p-impress-overview-step-button',
      'title': H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'showOverview', {})
    }).click(function () {
      toggleOverviewStep();
      IPEditor.refocusView();
    });

    /**
     * Set new zoom factor to specified value or to default.
     *
     * @param {number} [newZoomFactor] New zoom factor
     * @returns {H5PEditor.ImpressPresentationEditor.OverviewStep}
     */
    this.setZoomFactor = function (newZoomFactor) {
      zoomFactor = newZoomFactor || 5;

      return this;
    };

    /**
     * Append overview button to element
     *
     * @param {jQuery} $wrapper Wrapper for button
     * @returns {H5PEditor.ImpressPresentationEditor.OverviewStep}
     */
    this.appendTo = function ($wrapper) {
      $overviewButton.appendTo($wrapper);

      return this;
    }
  }

  return OverviewStep;
})(H5P.jQuery, H5P.JoubelUI);
