/*
 * @project BALT - DEVELOPER ASSIGNMENT
 *
 * @author Adriaan Balt Louis Scholvinck | www.BALT.us | www.linkedin.com/in/adriaans | adriaan@BALT.us
 *
 * @description Fifteen Puzzle Game - with drag and click
 */

(function(BALT){

	// namespace closure
	if ( !BALT )
	{
		BALT = {};
	};

	// FifteenPuzzle
	// setup the space with canvas and the tiles
	BALT.FifteenPuzzle = function()
	{
		var root = this, 			// makes functions public
			container,				// where the grid lives in the DOM
			source,					// image source
			imageLoaded = false,	// confirms image load
			emptyElement,			// store the empty element for easy reference
			dragElement,			// store the dragging element for easy reference
			originalZIndex,			// original Z index of dragged element
			startPt = {},			// for calculating the new X position on mouse move
			offsetPt = {},			// for calculating the new X position on mouse move
			dragClientPt = {},		// point coordinates while dragging -=-=-=- dont re-create this variable each time onMouseMove (trying to improve memory performance)
			dragElementPt = {},		// point coordindates of element's current position
			tileWidth,				// width of tile
			pointArray = [];		// state array && array of points

			

	// PUBLIC
		// gets the ball rolling
		root.init = function()
		{

			// store where the grid puzzle will exist
			container = document.getElementById('fifteenPuzzle');

			// retreive image to be used for puzzle
			source = document.getElementById("source");

			// load image for dawing
			loadImage();

			// not particularly necessary, but potentially useful
			return root;
		};

	// PRIVATE
		// modularize the image loading; habits die hard - can be repurposed for loading any image to play this game (with some minor modication)
		var loadImage = function()
		{
			source.onload = imageLoadHandler;
			if (source.complete)
			{
				imageLoadHandler();
			}
		};

		// when the image is loaded, then we begin the app
		var imageLoadHandler =function ()
		{
			// it's already loaded (this should never be called, but habits die hard)
			if (imageLoaded)
			{
				return;
			}

			// reveal the page now that the image has loaded
				// reduces initial jitter
			document.body.style.display = 'block';

			imageLoaded = true;

			// touch support
			if ( 'ontouchstart' in window )
			{
				window.addEventListener("touchstart", onTouchStart, false);
				window.addEventListener("touchmove", onTouchMove, false);
				window.addEventListener("touchend", onTouchEnd, false);
				//window.addEventListener("touchcancel", touchCancel, false);
			}
			else
			{
				// initialize the dragging functionality
				document.onmousedown = onMouseDown;
				document.onmouseup = onMouseUp;
			}

			// setup dimensions for container
			container.style.width = source.width + 'px';
			container.style.height = source.height + 'px';

			// commence the app
			start();
		};

		// commence the app
		var start = function()
		{
			// data order taken from assignment
			// BALT assignment instructions were missing the number "10", I've added it to the end
			var d = [4, 8 , 1, 14, 7, 2, 3, 0, 12, 5, 6, 11, 13, 9, 15, 10];

			scramble( );
		};

		// scramble the tiles and position them on the screen
		var scramble = function( data )
		{
			var	sliceX = 0,
				sliceY = 0,
				tileX = 0,
				tileY = 0,
				x,
				y,
				tileCanvas,
				tile,
				tileArray = [],
				tileHeight = source.offsetHeight / 4;

			tileWidth = source.offsetWidth / 4;

			// reset everything
			pointArray = [];
			tileArray = [];
			while( container.hasChildNodes() )
			{
				container.removeChild(container.lastChild);
			}

			// divide image into tiles via CANVAS
			for ( var i = 0; i < 16; i++ )
			{
				// grid logic
				if ( i % 4 == 0 && i != 0 )
				{
					tileX = 0;
					tileY += tileHeight;
				}

				// create image slice
				tileCanvas = getNewCanvas( tileWidth, tileHeight, i );
				tileCanvas.setAttribute( 'class', 'tile drag' );
				tileContext = tileCanvas.getContext('2d');
				tileContext.drawImage( source, tileX, tileY, tileWidth, tileHeight, 0,  0, tileWidth, tileHeight );

				// save an array of tiles
				tileArray.push( tileCanvas );

				// save an array of possible points
				pointArray.push( {'index':i,'x':tileX,'y':tileY} );

				tileX += tileWidth;
			};

			// either randomize or take the order from the data indices array
			if ( !data ) 
			{
				// randomize arrays
				pointArray = randomizeArray( pointArray );
			} else {
				// match order based on data array
				pointArray = mapArray( pointArray, data );
			}

			// print the tiles to positions
			for ( i=0; i < tileArray.length; i++ )
			{
				if ( i == tileArray.length-1 )
				{
					// empty tile element
					tileCanvas = getNewCanvas( tileWidth, tileHeight, pointArray[i].index );
					tileContext = tileCanvas.getContext('2d');

					// styling the empty tile 
					// (turned off)
					tileContext.fillStyle = "rgba(255,0,0,0)";
					tileContext.fillRect (0,0,tileWidth,tileHeight);

					tileCanvas.setAttribute( 'class', 'tile empty' );
				}
				else
				{
					// pre-made canvas tile element
					tileCanvas = tileArray[i];
				}
				// start positions
				tileCanvas.style.top = pointArray[i].y + 'px';
				tileCanvas.style.left = pointArray[i].x + 'px';

				// add to the DOM
				container.appendChild( tileCanvas );
			}

			// store the empty element so we don't have to refer to the DOM anymore than necessary
			emptyElement = document.getElementsByClassName('empty')[0];

			// returns whether the board can be solved or not
			return canBoardBeSolved( convertToStateArray() );
		};

		// helper to dynamically create and return a canvas element
		var getNewCanvas = function( w, h, index )
		{
			var c = document.createElement('canvas');
			c.width = w;
			c.height = h;
			return c;
		};

		// return if the tile being clicked is next to an empty position
		var isNextToEmpty = function( x, y )
		{
			var empty = getEmptyCoordinates();
			return ((empty.x == x) && (empty.y == y-tileWidth || empty.y == y+tileWidth ) ) || ((empty.x == x-tileWidth || empty.x == x+tileWidth) && empty.y == y )
		}

		// the distance to empty from a given point
		var getDistanceFromEmpty = function( x, y )
		{
			var empty = getEmptyCoordinates();
			var deltaPt = {};
			deltaPt.x = empty.x - x;
			deltaPt.y = empty.y - y;
			return deltaPt;
		};

		// returns the coordinates of the empty tile
		var getEmptyCoordinates = function()
		{
			return {'x':emptyElement.offsetLeft,'y':emptyElement.offsetTop};
		};

		// snaps to the empty position
		var snapToEmpty = function( x, y )
		{
			var empty = getEmptyCoordinates();

			// if it is next to the empty
			if ( isNextToEmpty( x,y ) )
			{

				// move the tile to empty position
				moveTile( empty.x, empty.y );
			}
		};

		// moves a tile to a specified location
		var moveTile = function( x, y )
		{
			// reordering the state array
			reorderState();

			// move the empty element to where the clicked tile was
			emptyElement.style.left = dragElementPt.x + 'px';
			emptyElement.style.top = dragElementPt.y + 'px';

			// move the dragging element to where the empty element was
			dragElement.style.left = x + 'px';
			dragElement.style.top = y + 'px';
		};

		// reorders the point (or state) array after a tile is moved and checks if the board is complete
		var reorderState = function() {
			var empty = getEmptyCoordinates();
			// index of item to swap
			var index1 = findIndexByPoint( pointArray, dragElementPt.x, dragElementPt.y );
			// index of item to swap
			var index2 = findIndexByPoint( pointArray, empty.x, empty.y );
			// swap array
			pointArray = swapArrayIndex( pointArray, index1, index2 );
			// once the order is reset, check if the array is in the correct order
			checkSuccess();
		};

		// an array of indices to define the state of the board
		var convertToStateArray = function() {
			var stateArray = [];
			for ( var i = 0; i < pointArray.length; i++ )
			{
				stateArray[ i ] = pointArray[i].index;
			}
			return stateArray;
		};

		// gets an index from a given x,y coordinate and given array
		var findIndexByPoint = function ( array, x, y ) {
			for ( var i = 0; i< array.length; i++ )
			{
				if ( array[i].x == x && array[i].y == y ) return i;
			}
		}

		// swaps items in a given array
		var swapArrayIndex = function ( array, index1, index2) {
			var t = array[index1];
			array[index1] = array[index2];
			array[index2] = t;
			return array;
		}

		// maps an array to given indices
		var mapArray = function ( array, map ) {
			var arr = [];
			for ( var i = 0; i < array.length; i++ )
			{
				arr[i] = array[castNumber(map[i])];
			}
			return arr;
		}

		// check if we have a successful board
		var checkSuccess = function() {
			for ( var i = 0; i < pointArray.length; i++ )
			{
				if ( i != pointArray[i].index )
				{
					return false;
				}
			}

			// display congratulations success div
			var successElement = document.getElementById('success');
			successElement.style.display = 'block';
			// find the reset button
			var restartBtn = document.getElementById('restart');
			// the reset button hook
			restartBtn.onmousedown = function()
			{
				successElement.style.display = 'none';
				scramble();
			};
		};

		// when the mouse button is clicked anywhere in the document
		var onMouseDown = function(e)
		{
			// reference to element clicked
			var target = e.target;

			// check if it's next to empty
			if ( isNextToEmpty( target.offsetLeft, target.offsetTop ) )
			{
				// check if item can be dragged
				if ( target.className.indexOf('drag') != '-1' )
				{
					// clicked element to top of z-index stack, until mouseUp
					originalZIndex = target.style.zIndex;
					target.style.zIndex = 10000;

					// mouse position over the clicked element
					startPt.x = e.clientX;
					startPt.y = e.clientY;

					// clicked element's position
					offsetPt.x = castNumber(target.style.left);
					offsetPt.y = castNumber(target.style.top);

					// store dragElement and release it's scope to it access anywhere
					dragElement = target;
					dragElementPt.x = dragElement.offsetLeft;
					dragElementPt.y = dragElement.offsetTop;

					// trigger the mouse move
					document.onmousemove = onMouseMove;

					// stop text selection
					document.body.focus();

					// stop text selection in IE
					document.onselectstart = function () { return false; };

					// stop IE from trying to drag the image
					target.ondragstart = function() { return false; };

					// prevent text selection (except IE)
					return false;
				}
			}
		};

		// when the mouse is moved while held down
		var onMouseMove = function(e)
		{
			// makes sure we have an event
			if (e == null)
			{
				var e = window.event;
			}

			// helper drag function
			dragHelper( e.clientX, e.clientY );
		};

		// when the mouse button is released
		var onMouseUp = function(e)
		{
			// make sure there is an element that is currently dragging
			if (dragElement != null)
			{
				// snap to empty no matter what
				snapToEmpty( dragElementPt.x, dragElementPt.y );

				// reset z-index
				dragElement.style.zIndex = originalZIndex;

				// clear mouse events
				document.onmousemove = null;
				document.onselectstart = null;
				dragElement.ondragstart = null;

				// no more dragging elements, so reset it
				dragElement = null;
			}
		};

		// touch - when the finger first taps on the surface
		var onTouchStart = function(e)
		{
			var target = event.targetTouches[0].target;

			// check if it's next to empty
			if ( isNextToEmpty( target.offsetLeft, target.offsetTop ) )
			{
				// check if item can be dragged
				if ( target.className.indexOf('drag') != '-1' )
				{
					// mouse position over the clicked element
					startPt.x = e.touches[0].pageX;
					startPt.y = e.touches[0].pageY;

					// clicked element's position
					offsetPt.x = target.offsetLeft;
					offsetPt.y = target.offsetTop;

					// store dragElement and release it's scope to it access anywhere
					dragElement = target;
					dragElementPt.x = dragElement.offsetLeft;
					dragElementPt.y = dragElement.offsetTop;
				}
			}
		};

		// touch - when the finger is dragging across the surface
		var onTouchMove = function(e)
		{
			// prevent page from slide when dragging
			e.preventDefault();

			if ( isNextToEmpty( offsetPt.x, offsetPt.y ) )
			{
				// helper drag function
				dragHelper( e.touches[0].pageX , e.touches[0].pageY );
			}
		};

		// touch - when the finger is removed from the surface
		var onTouchEnd = function(e)
		{

			// make sure there is an element that is currently dragging
			if (dragElement != null)
			{
				// snap to empty no matter what
				snapToEmpty( dragElementPt.x, dragElementPt.y );

				// no more dragging elements, so reset it
				dragElement = null;
			}
		};

		// performs the drag functionality
		// used by both touch and mouse
		var dragHelper = function( clientX, clientY )
		{
			// where the dragging position is determined
			dragClientPt.x = offsetPt.x + clientX - startPt.x;
			dragClientPt.y = offsetPt.y + clientY - startPt.y;

			// to build the constraints
			var deltaPt = getDistanceFromEmpty( dragElementPt.x, dragElementPt.y );
			var dX = dragElementPt.x + deltaPt.x;
			var dY = dragElementPt.y + deltaPt.y;

			// to make this more readible
			var top, left;

			// constaints for dragging
			if ( deltaPt.y < 0 )
			{
				// empty is above
				if ( dY < dragClientPt.y && dragClientPt.y < dragElementPt.y)
				{
					top = dragClientPt.y;
				}
			}
			else
			{
				// empty is below
				if ( dY > dragClientPt.y && dragClientPt.y > dragElementPt.y)
				{
					top = dragClientPt.y;
				}
			}

			if ( deltaPt.x < 0 )
			{
				// empty is left
				if ( dX < dragClientPt.x && dragClientPt.x < dragElementPt.x )
				{
					left = dragClientPt.x;
				}
			}
			else
			{
				// empty is right
				if ( dX > dragClientPt.x && dragClientPt.x > dragElementPt.x )
				{
					left = dragClientPt.x;
				}
			}

			// update style position for drag effect
			dragElement.style.left = left + 'px';
			dragElement.style.top = top + 'px';
		}

		// randomizes any array
		var randomizeArray = function( array )
		{
			array.sort( function() { return Math.round(Math.random())-0.5 });
			return array;
		};

		// cast to a number
		var castNumber = function(value)
		{
			var n = parseInt(value);
			return n == null || isNaN(n) ? 0 : n;
		};

	};

	// create the FifteenPuzzle
	(new BALT.FifteenPuzzle()).init();

})();
