/*global H5P*/
var H5PEditor = H5PEditor || {};
H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

/**
 * Free Transform helper class for Impressive Presentation
 */
H5PEditor.ImpressPresentationEditor.FreeTransform = (function () {

  function FreeTransform(IP, IPEditor) {
    /**
     * Keeps track of dragging mouse state.
     * @type {boolean}
     */
    var isDragging = false;

    /**
     * Keeps track of initial mouse down position.
     */
    var initialPos;

    /**
     * Keeps track of mouse moved amount.
     */
    var mouseMoved;

    /**
     * Keeps track of active step element.
     */
    var $editingStep;

    /**
     * Keeps track of active step parameters.
     */
    var editingStepParams;

    /**
     * Keeps track of initial scroll amount.
     * @type {number}
     */
    var scrollStep = 10;

    /**
     * Keeps track of scroll step multiple for progressively faster scrolling within a time interval.
     * @type {number}
     */
    var scrollStepMultiple = 1;

    /**
     * Keeps track of maximum scroll multiple to avoid scrolling getting out of hand.
     * @type {number}
     */
    var maxScrollStepMultiple = 10;

    /**
     * Rotate a fraction of the delta mouse movements to slow down rotation.
     * @type {number}
     */
    var rotateFraction = 0.1;

    /**
     * The time/date object a scroll was started.
     */
    var startedScrolling;

    /**
     * Progressive scroll delay in ms, used to measure if multiple scrolls are used in the given interval.
     * @type {number}
     */
    var progressiveScrollDelay = 400;

    /**
     * Mouse scroll functionality
     */
    IP.$jmpress.on('mousewheel', function (e) {
      if (IPEditor.editModes.move || IPEditor.editModes.rotate || IPEditor.editModes.transform) {

        $editingStep = IP.$jmpress.find('#' + IP.ID_PREFIX + IPEditor.editingSlideIndex);
        editingStepParams = IPEditor.params.views[IPEditor.editingSlideIndex];


        updateScrollMultiple();
        // scroll up
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
          if (IPEditor.editModes.move || IPEditor.editModes.transform) {
            updateEditingStep('z', (editingStepParams.positioning.z - (scrollStep * scrollStepMultiple)));
          }
          else if (IPEditor.editModes.rotate) {
            updateEditingStep('rotateZ', (editingStepParams.positioning.rotateZ - (scrollStep * scrollStepMultiple * rotateFraction)));
          }
        }
        else { // scroll down
          if (IPEditor.editModes.move || IPEditor.editModes.transform) {
            updateEditingStep('z', (editingStepParams.positioning.z + (scrollStep * scrollStepMultiple)));
          }
          else if (IPEditor.editModes.rotate) {
            updateEditingStep('rotateZ', (editingStepParams.positioning.rotateZ + (scrollStep * scrollStepMultiple * rotateFraction)));
          }
        }

        IPEditor.updateStep(IPEditor.editingSlideIndex);
        IPEditor.reselectStep();
        IPEditor.updateSemantics();
        return false;
      }
    });

    /**
     * Mouse press and move functionality
     */
    IP.$jmpress.mousedown(function (e) {
      if (IPEditor.editModes.move || IPEditor.editModes.rotate || IPEditor.editModes.transform) {
        setInitialPos(e);
        resetMouseMoved();
        isDragging = true;
        $editingStep = IP.$jmpress.find('#' + IP.ID_PREFIX + IPEditor.editingSlideIndex);
        editingStepParams = IPEditor.params.views[IPEditor.editingSlideIndex];

        // Register mouse events on body
        H5P.$window.mousemove(function (e) {
          mouseMove(e);
        }).mouseup(function () {
          mouseUp();
        });

        // Do not propagate, prevents dragging of images/items
        return false;
      }
    });

    /**
     * Update view and params relative to how much mouse moved.
     */
    var mouseUp = function () {
      if (isDragging && (IPEditor.editModes.move || IPEditor.editModes.rotate || IPEditor.editModes.transform)) {
        isDragging = false;
        if (IPEditor.editModes.move) {
          updateEditingStep('x', editingStepParams.positioning.x - mouseMoved.deltaX);
          updateEditingStep('y', editingStepParams.positioning.y - mouseMoved.deltaY);
        }
        else if (IPEditor.editModes.rotate) {
          updateEditingStep('rotateY', editingStepParams.positioning.rotateY + (mouseMoved.deltaX * rotateFraction));
          updateEditingStep('rotateX', editingStepParams.positioning.rotateX - (mouseMoved.deltaY * rotateFraction));
        }
        else if (IPEditor.editModes.transform) {
          var newWidth = editingStepParams.backgroundGroup.backgroundWidth + (mouseMoved.deltaX);
          var newHeight = editingStepParams.backgroundGroup.backgroundHeight - (mouseMoved.deltaY);
          $editingStep.height(newHeight);
          $editingStep.width(newWidth);
          editingStepParams.backgroundGroup.backgroundWidth = newWidth;
          editingStepParams.backgroundGroup.backgroundHeight = newHeight;
        }

        IPEditor.updateStep(IPEditor.editingSlideIndex);
        IPEditor.reselectStep();
        IPEditor.updateSemantics();
      }

      H5P.$window.off('mousemove').off('mouseup');
    };

    /**
     * Update view relative to how much mouse moved.
     * @param e mouseEvent
     */
    var mouseMove = function (e) {
      if (isDragging && (IPEditor.editModes.move || IPEditor.editModes.rotate || IPEditor.editModes.transform)) {
        updateMouseMovedAmount(e);
        console.log("what is editmodes ?", IPEditor.editModes);
        if (IPEditor.editModes.move) {
          updateEditingStepView('x', editingStepParams.positioning.x - mouseMoved.deltaX);
          updateEditingStepView('y', editingStepParams.positioning.y - mouseMoved.deltaY);
        }
        else if (IPEditor.editModes.rotate) {
          updateEditingStepView('rotateY', editingStepParams.positioning.rotateY + (mouseMoved.deltaX * rotateFraction));
          updateEditingStepView('rotateX', editingStepParams.positioning.rotateX - (mouseMoved.deltaY * rotateFraction));
        }
        else if (IPEditor.editModes.transform) {
          var newWidth = editingStepParams.backgroundGroup.backgroundWidth + (mouseMoved.deltaX);
          var newHeight = editingStepParams.backgroundGroup.backgroundHeight - (mouseMoved.deltaY);
          $editingStep.height(newHeight);
          $editingStep.width(newWidth);
        }

        IPEditor.updateStep(IPEditor.editingSlideIndex);
        IPEditor.reselectStep();
      }
    };

    /**
     * Get mouse moved since start
     * @param e
     * @returns {{deltaX: number, deltaY: number}}
     */
    var updateMouseMovedAmount = function (e) {
      mouseMoved.deltaX = e.clientX - initialPos.x;
      mouseMoved.deltaY = e.clientY - initialPos.y;
    };

    /**
     * Update active step view
     * @param prop
     * @param value
     */
    var updateEditingStepView = function (prop, value) {
      $editingStep.data('stepData')[prop] = value;
    };

    /**
     * Update active step logic
     * @param prop
     * @param value
     */
    var updateEditingStepParams = function (prop, value) {
      editingStepParams.positioning[prop] = value;
    };

    /**
     * Update active step logic and view
     * @param prop
     * @param value
     */
    var updateEditingStep = function (prop, value) {
      updateEditingStepParams(prop, value);
      updateEditingStepView(prop, value);
    };

    /**
     * Determine scroll multiple from how fast user scrolls
     */
    var updateScrollMultiple = function () {
      var currentTime = new Date().getTime();

      // Make scrolling faster when scrolling multiple times within progressive delay duration
      if (startedScrolling && (currentTime - startedScrolling) < progressiveScrollDelay) {
        scrollStepMultiple += 1;

        // Cap at max scroll multiple
        if (scrollStepMultiple >= maxScrollStepMultiple) {
          scrollStepMultiple = maxScrollStepMultiple;
        }
      }
      else {
        scrollStepMultiple = 1;
      }
      startedScrolling = currentTime;
    };

    /**
     * Reset mouse moved amount
     */
    var resetMouseMoved = function () {
      mouseMoved = {
        deltaX: 0,
        deltaY: 0
      };
    };

    /**
     * Set initial mouse position from event
     * @param e mouseEvent
     */
    var setInitialPos = function (e) {
      initialPos = {
        x: e.clientX,
        y: e.clientY
      }
    };
  }

  return FreeTransform;

}());
