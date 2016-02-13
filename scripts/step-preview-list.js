H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.StepPreviewList = function ($, EventDispatcher) {

  function StepPreviewList() {

    var self = this;

    EventDispatcher.call(this);

    var $stepPreviewList = $('<div>', {
      'class': 'h5p-impress-step-preview-list'
    });

    $('<div>', {
      'class': 'h5p-impress-step-preview-list-title',
      role: 'button',
      tabindex: 0,
      html: H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'preview'),
      appendTo: $stepPreviewList
    }).click(function () {
      $stepPreviewList.addClass('hidden');
    });

    var $cloneList = $('<div>', {
      'class': 'h5p-impress-step-preview-clones',
      appendTo: $stepPreviewList
    });

    var clones = [];

    /**
     * Add step to preview list
     *
     * @param {H5P.ImpressPresentation.Step} step
     */
    this.addStep = function (step) {
      var $cloneWrapper = $('<div>', {
        'class': 'h5p-impress-step-preview-clone-wrapper'
      });

      // Append clone
      var $clone = step.getElement()
        .clone()
        .addClass('h5p-impress-step-preview-step-clone')
        .appendTo($cloneWrapper)
        .click(function () {
          self.trigger('selectedStep', step)
        });

      clones.push($clone);

      $cloneWrapper.appendTo($cloneList);

    };

    this.resize = function () {
      clones.forEach(function ($clone) {
        var $cloneWrapper = $clone.parent();

        // Scale down clone
        var cloneRatio = $clone.width() / $clone.height();
        var wrapperRatio = $cloneWrapper.width() / $cloneWrapper.height();

        // Stretch clone to fit height
        var height = $cloneWrapper.height();
        var width = $cloneWrapper.height() * cloneRatio;

        // Stretch to width
        if (cloneRatio > wrapperRatio) {
          width = $cloneWrapper.width();
          height = $cloneWrapper.width() / cloneRatio;
        }

        $clone.width(width).height(height);
      });
    };

    this.appendTo = function ($wrapper) {
      $stepPreviewList.appendTo($wrapper);

      return this;
    }
  }

  // Inherit support for events
  StepPreviewList.prototype = Object.create(EventDispatcher.prototype);
  StepPreviewList.prototype.constructor = EventDispatcher.StepPreviewList;

  return StepPreviewList;

}(H5P.jQuery, H5P.EventDispatcher);
