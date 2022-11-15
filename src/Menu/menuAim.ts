const MOUSE_LOCS_TRACKED = 3; // number of past mouse locations to trackv
const DELAY = 300; // ms delay when user appears to be entering submenu
const TOLERANCE = 75; // bigger = more forgivey when entering submenu
// Consider multiple instance using ReactMenuAim, we just listen mousemove once
const mouseLocs: any = [];
let __reactMenuAimTimer: any;
let _lastDelayDoc: any;

/**
 *
 * DOM helpers
 *
 */
function on(el: any, eventName: any, callback: any) {
  if (el.addEventListener) {
    el.addEventListener(eventName, callback, false);
  } else if (el.attachEvent) {
    el.attachEvent('on' + eventName, function (e: any) {
      callback.call(el, e || window.event);
    });
  }
}

function off(el: any, eventName: any, callback: any) {
  if (el.removeEventListener) {
    el.removeEventListener(eventName, callback);
  } else if (el.detachEvent) {
    el.detachEvent('on' + eventName, callback);
  }
}

function offset(el: any) {
  if (!el) {
    return {
      left: 0,
      top: 0,
    };
  }

  let rect = el.getBoundingClientRect();
  return {
    top: rect.top + document.body.scrollTop,
    left: rect.left + document.body.scrollLeft,
  };
}

function outerWidth(el: any) {
  let _width = el.offsetWidth;
  let style = el.currentStyle || getComputedStyle(el);

  _width += parseInt(style.marginLeft, 10) || 0;
  return _width;
}

function outerHeight(el: any) {
  let _height = el.offsetHeight;
  let style = el.currentStyle || getComputedStyle(el);

  _height += parseInt(style.marginLeft, 10) || 0;
  return _height;
}

/**
 *
 * Util helpers
 *
 */

// Mousemove handler on document
function handleMouseMoveDocument(e: any) {
  mouseLocs.push({
    x: e.pageX,
    y: e.pageY,
  });

  if (mouseLocs.length > MOUSE_LOCS_TRACKED) {
    mouseLocs.shift();
  }
}

function getActivateDelay(config: any) {
  config = config || {};
  let menu = document.querySelector(config.menuSelector);

  // If can't find any DOM node
  if (!menu || !menu.querySelector) {
    return 0;
  }

  let menuOffset = offset(menu);

  let upperLeft = {
    x: menuOffset.left,
    y: menuOffset.top - (config.tolerance || TOLERANCE),
  };
  let upperRight = {
    x: menuOffset.left + outerWidth(menu),
    y: upperLeft.y,
  };
  let lowerLeft = {
    x: menuOffset.left,
    y: menuOffset.top + outerHeight(menu) + (config.tolerance || TOLERANCE),
  };
  let lowerRight = {
    x: menuOffset.left + outerWidth(menu),
    y: lowerLeft.y,
  };

  let loc = mouseLocs[mouseLocs.length - 1];
  let prevLoc = mouseLocs[0];

  if (!loc) {
    return 0;
  }

  if (!prevLoc) {
    prevLoc = loc;
  }

  // If the previous mouse location was outside of the entire
  // menu's bounds, immediately activate.
  if (
    prevLoc.x < menuOffset.left ||
    prevLoc.x > lowerRight.x ||
    prevLoc.y < menuOffset.top ||
    prevLoc.y > lowerRight.y
  ) {
    return 0;
  }

  // If the mouse hasn't moved since the last time we checked
  // for activation status, immediately activate.
  if (_lastDelayDoc && loc.x === _lastDelayDoc.x && loc.y === _lastDelayDoc.y) {
    return 0;
  }

  function slope(a: any, b: any) {
    return (b.y - a.y) / (b.x - a.x);
  }

  let decreasingCorner = upperRight;
  let increasingCorner = lowerRight;

  if (config.submenuDirection === 'left') {
    decreasingCorner = lowerLeft;
    increasingCorner = upperLeft;
  } else if (config.submenuDirection === 'below') {
    decreasingCorner = lowerRight;
    increasingCorner = lowerLeft;
  } else if (config.submenuDirection === 'above') {
    decreasingCorner = upperLeft;
  }

  let decreasingSlope = slope(loc, decreasingCorner);
  let increasingSlope = slope(loc, increasingCorner);
  let prevDecreasingSlope = slope(prevLoc, decreasingCorner);
  let prevIncreasingSlope = slope(prevLoc, increasingCorner);

  if (
    decreasingSlope < prevDecreasingSlope &&
    increasingSlope > prevIncreasingSlope
  ) {
    _lastDelayDoc = loc;
    return config.delay || DELAY;
  }

  _lastDelayDoc = null;
  return 0;
}

function activate(rowIdentifier: any, handler: any, config: any) {
  handler(rowIdentifier);

  const subMenu = document.querySelector(config.classPopup);
  if (subMenu) subMenu.classList.add(config.classPopupActive);
}

function possiblyActivate(rowIdentifier: any, handler: any, config: any): any {
  let delay = getActivateDelay(config);

  if (delay) {
    __reactMenuAimTimer = setTimeout(function () {
      possiblyActivate(rowIdentifier, handler, config);
    }, delay);
  } else {
    if (__reactMenuAimTimer) {
      clearTimeout(__reactMenuAimTimer);
      __reactMenuAimTimer = null;
      return;
    }
    activate(rowIdentifier, handler, config);
  }
}

export const menuAim = function (options: any) {
  const __reactMenuAimConfig = options;
  const menu: any = document.querySelector(options.menuSelector);

  const handleMouseEnterRow = function (rowIdentifier: any, handler: any) {
    if (__reactMenuAimTimer) {
      clearTimeout(__reactMenuAimTimer);
      __reactMenuAimTimer = null;
      return;
    }

    possiblyActivate(rowIdentifier, handler, __reactMenuAimConfig);
  };

  const handleOnMouseLeave = () => {
    const subMenu = document.querySelector(options.classPopup);
    const itemActive = document.querySelector(`.${options.classItemActive}`);
    subMenu && subMenu.classList.remove(options.classPopupActive);
    itemActive && itemActive.classList.remove(options.classItemActive);
    _lastDelayDoc = undefined;

    if (__reactMenuAimTimer) {
      clearTimeout(__reactMenuAimTimer);
    }
    __reactMenuAimTimer = null;
  };

  const onDidmount = () => {
    handleOnMouseLeave();
    off(document, 'mousemove', handleMouseMoveDocument);
    off(menu, 'mouseleave', handleOnMouseLeave);
  };

  on(document, 'mousemove', handleMouseMoveDocument);
  on(menu, 'mouseleave', handleOnMouseLeave);

  return {
    handleMouseEnterRow,
    onDidmount,
  };
};
