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
    var $activeStep;

    /**
     * Keeps track of active step parameters.
     */
    var activeStepParams;

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
      if (IPEditor.editModes.move || IPEditor.editModes.rotate) {

        $activeStep = IP.$jmpress.jmpress('active');
        activeStepParams = IPEditor.params[IPEditor.getUniqueId($activeStep)];

        updateScrollMultiple();
        // scroll up
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
          if (IPEditor.editModes.move) {
            updateActiveStep('z', (activeStepParams.positioning.z - (scrollStep * scrollStepMultiple)));
          }
          else if (IPEditor.editModes.rotate) {
            updateActiveStep('rotateZ', (activeStepParams.positioning.rotateZ - (scrollStep * scrollStepMultiple * rotateFraction)));
          }
        }
        else { // scroll down
          if (IPEditor.editModes.move) {
            updateActiveStep('z', (activeStepParams.positioning.z + (scrollStep * scrollStepMultiple)));
          }
          else if (IPEditor.editModes.rotate) {
            updateActiveStep('rotateZ', (activeStepParams.positioning.rotateZ + (scrollStep * scrollStepMultiple * rotateFraction)));
          }
        }

        IPEditor.reselectStep();
        IPEditor.updateSemantics();
        return false;
      }
    });

    /**
     * Mouse press and move functionality
     */
    IP.$jmpress.mousedown(function (e) {
      if (IPEditor.editModes.move || IPEditor.editModes.rotate) {
        setInitialPos(e);
        resetMouseMoved();
        isDragging = true;
        $activeStep = IP.$jmpress.jmpress('active');
        activeStepParams = IPEditor.params[IPEditor.getUniqueId($activeStep)];

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
      if (isDragging && (IPEditor.editModes.move || IPEditor.editModes.rotate)) {
        isDragging = false;
        if (IPEditor.editModes.move) {
          updateActiveStep('x', activeStepParams.positioning.x - mouseMoved.deltaX);
          updateActiveStep('y', activeStepParams.positioning.y - mouseMoved.deltaY);
        }
        else if (IPEditor.editModes.rotate) {
          updateActiveStep('rotateY', activeStepParams.positioning.rotateY - (mouseMoved.deltaX * rotateFraction));
          updateActiveStep('rotateX', activeStepParams.positioning.rotateX - (mouseMoved.deltaY * rotateFraction));
        }

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
      if (isDragging && (IPEditor.editModes.move || IPEditor.editModes.rotate)) {
        updateMouseMovedAmount(e);
        console.log("what is editmodes ?", IPEditor.editModes);
        if (IPEditor.editModes.move) {
          updateActiveStepView('x', activeStepParams.positioning.x - mouseMoved.deltaX);
          updateActiveStepView('y', activeStepParams.positioning.y - mouseMoved.deltaY);
        }
        else if (IPEditor.editModes.rotate) {
          console.log("edit modes, update rotateX and Y");
          updateActiveStepView('rotateY', activeStepParams.positioning.rotateY - (mouseMoved.deltaX * rotateFraction));
          updateActiveStepView('rotateX', activeStepParams.positioning.rotateX - (mouseMoved.deltaY * rotateFraction));
        }

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
    var updateActiveStepView = function (prop, value) {
      console.log("active step data ?", $activeStep.data('stepData'));
      $activeStep.data('stepData')[prop] = value;
      console.log("Setting prop to", prop, $activeStep.data('stepData')[prop]);
    };

    /**
     * Update active step logic
     * @param prop
     * @param value
     */
    var updateActiveStepParams = function (prop, value) {
      console.log("updating active step params", prop, value, activeStepParams.positioning, activeStepParams.positioning[prop]);
      activeStepParams.positioning[prop] = value;
      console.log("new active step params", activeStepParams.positioning, activeStepParams.positioning[prop]);
    };

    /**
     * Update active step logic and view
     * @param prop
     * @param value
     */
    var updateActiveStep = function (prop, value) {
      updateActiveStepParams(prop, value);
      updateActiveStepView(prop, value);
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
