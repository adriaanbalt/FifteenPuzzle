var canBoardBeSolved;

(function () {

  const IDENTITY_BOARD = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const TILES_PER_ROW_AND_COLUMN = 4;

  /**
  *  Returns whether the specified board can be solved.
  *
  *  For example:
  *
  *  canBoardBeSolved([4, 8, 1, 14, 7, 2, 3, 0, 12, 5, 6, 11, 13, 9, 15, 10]) => true
  *  canBoardBeSolved([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 13, 15]) => false
  *
  *  @param {Array} data An array containing a set of numbers defining the board state.
  *  @return {Boolean} true if the board can be solved; otherwise, returns false.
  */
  canBoardBeSolved = function (data) {
    if (data.length !== IDENTITY_BOARD.length) {
      return false;
    }
    data = _positionalOrderToLevelOrder(data);
    var expectedLastTilePosition = TILES_PER_ROW_AND_COLUMN * TILES_PER_ROW_AND_COLUMN - 1;
    var lastTilePosition = data.indexOf(expectedLastTilePosition);
    if (lastTilePosition === -1) {
      console.warn("ASSERTION FAILED: " + expectedLastTilePosition + " doesn't exist in [" + data + "].");
      return false;
    }
    var cyclicInterchanges = _cyclicInterchangeBetweenBoardStates(data, IDENTITY_BOARD, TILES_PER_ROW_AND_COLUMN);
    if (lastTilePosition !== expectedLastTilePosition) {
      cyclicInterchanges += _manhattanDistance(_tileToCanonicalPoint(lastTilePosition), _tileToCanonicalPoint(expectedLastTilePosition));
    }
    return cyclicInterchanges % 2 == 0;
  };

  function _manhattanDistance(firstPoint, secondPoint) {
    // See <http://en.wikipedia.org/wiki/Taxicab_geometry#Formal_description>.
    return Math.abs(firstPoint.x - secondPoint.x) + Math.abs(firstPoint.y - secondPoint.y);
  }

  function _tileToCanonicalPoint(tileNumber) {
    return {x: tileNumber % TILES_PER_ROW_AND_COLUMN, y: Math.floor(tileNumber / TILES_PER_ROW_AND_COLUMN)};
  }

  function _positionalOrderToLevelOrder(data) {
    // Assumes that the values in data are in [0, data.length - 1].
    var length = data.length;
    var result = new Array(length);
    for (var i = 0; i < length; ++i) {
      result[data[i]] = i;
    }
    return result;
  }

  // Note, startState and goalState must be in level order.
  function _cyclicInterchangeBetweenBoardStates(startState, goalState, tilesPerRowAndColumn) {
    return _actualCyclicInterchangeBetweenBoardStates(startState, goalState, 0, 0, 1, 0, tilesPerRowAndColumn, {});
  }

  // See section 1.2.1 of <http://www.tara.tcd.ie/bitstream/2262/13099/1/TCD-CS-2001-24.pdf>.
  // Note, startState and goalState must be in level order.
  // FIXME: This is an O(n^3) algorithm, but seems sufficient for our usage.
  function _actualCyclicInterchangeBetweenBoardStates(startState, goalState, startNum, numCheckedSoFar, numInCycle, totalInterchanges, tilesPerRowAndColumn, hasAlreadyCheckedNumber) {
    if (numCheckedSoFar === tilesPerRowAndColumn * tilesPerRowAndColumn) {
      return totalInterchanges;
    }
    if (hasAlreadyCheckedNumber[startNum]) {
      return _actualCyclicInterchangeBetweenBoardStates(startState, goalState, numCheckedSoFar + 1, numCheckedSoFar + 1,
                                                        1, totalInterchanges, tilesPerRowAndColumn, hasAlreadyCheckedNumber);
    }
    hasAlreadyCheckedNumber[startNum] = true;
    var startNumPos = startState.indexOf(startNum);
    if (startNumPos === -1) {
      console.warn("ASSERTION FAILED: " + startNum + " doesn't exist in [" + startState + "].");
      return -1;
    }
    var goalNum = goalState[startNumPos];
    if (goalNum === numCheckedSoFar) {
      return _actualCyclicInterchangeBetweenBoardStates(startState, goalState, numCheckedSoFar + 1, numCheckedSoFar + 1,
                                                        1, totalInterchanges + numInCycle - 1, tilesPerRowAndColumn, hasAlreadyCheckedNumber);
    }
    return _actualCyclicInterchangeBetweenBoardStates(startState, goalState, goalNum, numCheckedSoFar,
                                                      numInCycle + 1, totalInterchanges, tilesPerRowAndColumn, hasAlreadyCheckedNumber);
  }
})()
