const MOUSE_LOCS_TRACKED = 3; // number of past mouse locations to trackv
const DELAY = 300; // ms delay when user appears to be entering submenu
const TOLERANCE = 75; // bigger = more forgivey when entering submenu
const mouseLocs: any = [];
let timerId: any;
let lastDelayLoc: any;

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

  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + document.body.scrollTop,
    left: rect.left + document.body.scrollLeft,
  };
}

function outerWidth(el: any) {
  let _width = el.offsetWidth;
  const style = el.currentStyle || getComputedStyle(el);

  _width += parseInt(style.marginLeft, 10) || 0;
  return _width;
}

function outerHeight(el: any) {
  let _height = el.offsetHeight;
  const style = el.currentStyle || getComputedStyle(el);

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
  let menuContainer = document.querySelector(config.menuContainer);

  // If can't find any DOM node
  if (!menuContainer || !menuContainer.querySelector) {
    return 0;
  }

  const menuOffset = offset(menuContainer);

  let upperLeft = {
    x: menuOffset.left,
    y: menuOffset.top - (config.tolerance || TOLERANCE),
  };
  let upperRight = {
    x: menuOffset.left + outerWidth(menuContainer),
    y: upperLeft.y,
  };
  let lowerLeft = {
    x: menuOffset.left,
    y:
      menuOffset.top +
      outerHeight(menuContainer) +
      (config.tolerance || TOLERANCE),
  };
  let lowerRight = {
    x: menuOffset.left + outerWidth(menuContainer),
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
  if (lastDelayLoc && loc.x == lastDelayLoc.x && loc.y == lastDelayLoc.y) {
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
    increasingCorner = upperRight;
  }

  let decreasingSlope = slope(loc, decreasingCorner);
  let increasingSlope = slope(loc, increasingCorner);
  let prevDecreasingSlope = slope(prevLoc, decreasingCorner);
  let prevIncreasingSlope = slope(prevLoc, increasingCorner);

  if (
    decreasingSlope < prevDecreasingSlope &&
    increasingSlope > prevIncreasingSlope
  ) {
    lastDelayLoc = loc;
    return config.delay || DELAY;
  }

  lastDelayLoc = null;

  return 0;
}

function activate(rowIdentifier: any, handler: any, config: any) {
  handler(rowIdentifier);

  const subMenu = document.querySelector(config.classPopup);
  if (subMenu) subMenu.classList.add(config.classPopupActive);
}

function possiblyActivate(rowIdentifier: any, handler: any, config: any): any {
  const delay = getActivateDelay(config);

  if (delay) {
    timerId = setTimeout(function () {
      possiblyActivate(rowIdentifier, handler, config);
    }, delay);
  } else {
    activate(rowIdentifier, handler, config);
  }
}

export const menuAim = function (configs: any) {
  const menuContainer: any = document.querySelector(configs.menuContainer);
  const menuSelector: any = document.querySelector(configs.menuSelector);

  const handleMouseEnterRow = function (rowIdentifier: any, handler: any) {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }

    possiblyActivate(rowIdentifier, handler, configs);
  };

  const clearTime = () => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = null;
  };

  const handleOnMouseLeave = () => {
    const subMenu = document.querySelector(configs.classPopup);
    const itemActive = document.querySelector(`.${configs.classItemActive}`);
    subMenu && subMenu.classList.remove(configs.classPopupActive);
    itemActive && itemActive.classList.remove(configs.classItemActive);
    lastDelayLoc = undefined;

    clearTime();
  };

  const onDidmount = () => {
    handleOnMouseLeave();
    off(document, 'mousemove', handleMouseMoveDocument);
    off(menuContainer, 'mouseleave', handleOnMouseLeave);
    off(menuSelector, 'mouseleave', clearTime);
  };

  on(document, 'mousemove', handleMouseMoveDocument);
  on(menuContainer, 'mouseleave', handleOnMouseLeave);
  on(menuSelector, 'mouseleave', clearTime);

  return {
    handleMouseEnterRow,
    onDidmount,
  };
};
