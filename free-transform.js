/*global H5P*/
var H5PEditor = H5PEditor || {};
H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

/**
 * Free Transform helper class for Impressive Presentation
 */
H5PEditor.ImpressPresentationEditor.FreeTransform = (function () {

  function FreeTransform(IP, IPEditor) {
    var isDragging = false;
    var initialPos = {};
    var mouseMoved;
    var $activeStep;
    var activeStepParams;
    var scrollStep = 10;
    var scrollStepMultiple = 1;
    var maxScrollStepMultiple = 10;
    var startedScrolling;
    var progressiveScrollDelay = 400;

    /**
     * Mouse scroll functionality
     */
    IP.$jmpress.on('mousewheel', function (e) {
      if (IPEditor.moveEditing || IPEditor.rotateEditing) {
        updateScrollMultiple();
        $activeStep = IP.$jmpress.jmpress('active');
        activeStepParams = IPEditor.params[IPEditor.getUniqueId($activeStep)];

        // scroll up
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
          updateActiveStep('z', (activeStepParams.positioning.z - (scrollStep * scrollStepMultiple)));
        }
        else { // scroll down
          updateActiveStep('z', (activeStepParams.positioning.z + (scrollStep * scrollStepMultiple)));
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
      if (IPEditor.moveEditing || IPEditor.rotateEditing) {
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
      if (isDragging && (IPEditor.moveEditing || IPEditor.rotateEditing)) {
        isDragging = false;
        updateActiveStep('x', activeStepParams.positioning.x - mouseMoved.deltaX);
        updateActiveStep('y', activeStepParams.positioning.y - mouseMoved.deltaY);
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
      if (isDragging && (IPEditor.moveEditing || IPEditor.rotateEditing)) {
        updateMouseMovedAmount(e);
        updateActiveStepView('x', activeStepParams.positioning.x - mouseMoved.deltaX);
        updateActiveStepView('y', activeStepParams.positioning.y - mouseMoved.deltaY);
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
      $activeStep.data('stepData')[prop] = value;
    };

    /**
     * Update active step logic
     * @param prop
     * @param value
     */
    var updateActiveStepParams = function (prop, value) {
      activeStepParams.positioning[prop] = value;
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
