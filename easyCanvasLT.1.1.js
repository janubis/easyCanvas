/*!
 *	EasyCanvasLT (light) version 1.1
 *	Ken Fyrstenberg Nilsen, (c) 2013 Abidas Software
 *	http://abdiassoftware.com
 *	GPL-3.0 license (http://opensource.org/licenses/GPL-3.0
*/

'use strict';

function easyCanvasLT() {

	/// internals
	var me = this, w, h, el,
		padL = 0, padT = 0, padR = 0, padB = 0, i = 0,

		globalMove = true,
		isFirstNum = true,

		_initCnt = 25;		// for polling onredraw at init

	/**
	 *	PROPERTIES
	*/
	this.canvas				= null;

	this.onmousedown		= null;
	this.onmousemove		= null;
	this.onmouseup			= null;
	this.onredraw			= null;
	this.deltaX				= 0;
	this.deltaY				= 0;

	this.reportResize		= true;
	this.autoResize			= false;
	this.trackMove			= false;
	this.clearColor			= null;
	this.clearBeforeDraw	= true;

	this.width;
	this.height;

	this.firstX				= -1;
	this.firstY				= -1;
	this.prevX				= -1;
	this.prevY				= -1;
	this.prevStamp			= null;
	this.count				= 0;

	/// PRIVATE
	this.isDown = false;

	/**
	 *	PARSE ARGUMENTS
	*/
	if (arguments.length > 0) {

		for(;i < arguments.length; i++) {

			/// dimensions
			if (typeof arguments[i] === 'number') {
				if (isFirstNum === true) {
					this.width = w = parseInt(arguments[i]);
					isFirstNum = false;
				} else {
					this.height = h = parseInt(arguments[i]);
				}
			}

			/// element as ID
			if (typeof arguments[i] === 'string') {
				el = document.getElementById(arguments[i]);

				if (el instanceof HTMLCanvasElement) {
					this.canvas = el;
					this.width  = this.canvas.width;
					this.height = this.canvas.height;
				}
			}

			/// element as canvas
			if (arguments[i] instanceof HTMLCanvasElement) {
				this.canvas = arguments[i];
				this.width  = this.canvas.width;
				this.height = this.canvas.height;
			}

			/// element as a DOM element
			if (arguments[i] instanceof HTMLElement) {
				el = arguments[i];
			}
		}
	}

	/**
	 *	Methods
	*/

	this.resize = function(w, h) {

		if (typeof w !== 'number' || typeof h !== 'number')
			throw 'Illegal numbers for width or height.';

		try {
			this.canvas.width = parseInt(w, '10') - (padL + padR);
			this.canvas.height = parseInt(h, '10') - (padT + padB);
			this.canvas.style.left = padL + 'px';
			this.canvas.style.top = padT + 'px';

			this.width = this.canvas.width;
			this.height = this.canvas.height;

			if (this.ctx !== undefined) {
				calcDeltas();
				setTransform();
			}

			redraw();

		} catch(err) {
			console.error(err);
		}

		return this;
	}

	/// add padding around canvas
	this.padding = function(top, right, bottom, left) {

		if (parameters.length === 0)
			return [padT, padR, padB, padL];

		padT = top;
		padR = right;
		padB = bottom;
		padL = left;

		this.resize(this.width, this.height);

		return this;
	}

	/// short-cut for clearing the canvas
	this.clear = function() {

		var ctx = this.ctx;
		
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		
		if (this.clearColor === null) {
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		} else {
			ctx.fillStyle = this.clearColor;
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}

		ctx.restore();
		
		return this;
	}

	/// detach canvas from parent DOM element and destroy
	this.remove = function() {

		try {

			if (typeof el !== 'undefined' && el !== null && typeof el !== 'string') {

				window.removeEventListener('resize', _resize, false);
				window.removeEventListener('mouseup', _mouseup, false);

				if (globalMove === true)
					window.removeEventListener('mousemove', _mousemove, false);

				this.canvas.onmousedown = null;
				this.canvas.onmousemove = null;
				this.canvas.onmouseup = null;

				if (!(el instanceof HTMLCanvasElement)) {
					el.removeChild(this.canvas);
				}

				this.ctx = undefined;
				this.canvas = undefined;
			}

		} catch(err) {
			console.error(err);
		}
	}

	/// download canvas as image
	this.download = function(filename, itype, arg) {

		if (typeof filename !== 'string' || filename.trim().length === 0)
			filename = 'Untitled';
			
		itype = (typeof itype === 'string') ? itype.toLowerCase() : 'png';

		if (filename.length < 5 || filename.substring(filename.length - itype.length) !== itype)
			filename += '.' + itype;

		var lnk = document.createElement('a'),
			c = this.canvas,
			e;

		lnk.download = filename;		

		if (itype === 'png') {
			lnk.href = c.toDataURL();	

		} else if (itype === 'jpg' || itype === 'jpeg') {

			(typeof arg === 'number') ? lnk.href = c.toDataURL('image/jpeg', arg) : 
										lnk.href = c.toDataURL('image/jpeg');
		}

		if (document.createEvent) {

			e = document.createEvent("MouseEvents");
			e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

			lnk.dispatchEvent(e);

		} else if (lnk.fireEvent) {

			lnk.fireEvent("onclick");
		}

		return this;
	}

	/// set clip coords
	this.clipCoords = function(clip) {

		if (typeof clip !== 'boolean')
			return !globalMove;

		if (clip !== globalMove) return this;

		if (clip === true) {
			window.removeEventListener('mousemove', _mousemove, false);
			this.canvas.onmousemove = _mousemove;

		} else {
			this.canvas.onmousemove = null;
			window.addEventListener('mousemove', _mousemove, false);
		}

		globalMove = !clip;

		return this;
	}


	/// callback onredraw
	this.update = function() {
		redraw();
	}

	/// get off-screen canvas
	this.getOffscreenCanvas = function(w, h) {

		if (arguments.length !== 2) {
			w = this.width;
			h = this.height;
		}

		var c = document.createElement('canvas'),
			x;

		c.width = w;
		c.height = h;

		x = c.getContext('2d');

		return {canvas: c, ctx: x, context: x, width: w, height: h, centerX: w * 0.5, centerY: h * 0.5};
	}

	/// stroke line
	this.strokeLine = function(x1, y1, x2, y2, lwidth, color) {

		var ctx = this.ctx,
			l = arguments.length;
			
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		if (l > 4) ctx.lineWidth = lwidth;
		if (l > 5) ctx.strokeStyle = color;

		ctx.stroke();

		return this;		
	}

	/**
	 *	INTERNALS - PRIVATE
	*/

	function redraw() {
		if (me.onredraw !== null) {
			if (me.clearBeforeRedraw === true) me.clear();
			me.onredraw(false);
		}
	}

	function calcDeltas() {
	
		var cs = getComputedStyle(me.canvas);

		me.deltaX = parseInt(cs.getPropertyValue('padding-left'), 10) + parseInt(cs.getPropertyValue('border-left-width'), 10);
		me.deltaY = parseInt(cs.getPropertyValue('padding-top'), 10) + parseInt(cs.getPropertyValue('border-top-width'), 10);

		if (isNaN(me.deltaX) === true) me.deltaX = 0;
		if (isNaN(me.deltaY) === true) me.deltaY = 0;
	}

	function calcCoords(x, y) {

		var r = me.canvas.getBoundingClientRect();

		x = (x - r.left - me.deltaX);
		y = (y - r.top - me.deltaY);

		return [x, y];
	}

	/**
	 *	INIT CANVAS
	*/

	try {

		if (this.canvas === null) {

			this.canvas = document.createElement('canvas');

			if (typeof this.canvas === 'undefined')
				throw 'Could not create a canvas element.';

			/// set width and height
			if (typeof w !== 'number' || typeof h !== 'number') {

				this.canvas.style.position	= 'fixed';
				this.canvas.style.left		= '0';
				this.canvas.style.top		= '0';

				this.resize(window.innerWidth, window.innerHeight);
				this.autoResize = true;

			} else {
				this.canvas.width	= this.width;
				this.canvas.height	= this.height;
			}

		} else {

			el = null;
		}

		calcDeltas();

		/// get context
		this.ctx = this.context = this.canvas.getContext('2d');

		if (typeof this.ctx === 'undefined')
			throw 'Could not create a 2D canvas context.';

		/// handle the variations of possible 'element' types
		if (el !== null) {

			if (typeof el === 'undefined') {
				el = document.getElementsByTagName('body')[0];
			}

			if (typeof el === 'undefined')
				throw 'No element is defined (body seem unavailable)';

			/// attach canvas to element
			el.appendChild(this.canvas);
		}

	} catch(err) {
		console.error(err);
	}

	/**
	 *	EVENTS
	*/

	window.addEventListener('resize', _resize, false);
	window.addEventListener('mouseup', _mouseup, false);
	window.addEventListener('mousemove', _mousemove, false);

	/// handle resize of canvas and window
	function _resize(e) {

		if (me.reportResize === true) {

			if (me.autoResize === true) {
				me.resize(window.innerWidth, window.innerHeight);

			} else {
				redraw();
			}
		}
	}

	/// handle mouse down events
	this.canvas.onmousedown = function(e) {

		var coords = calcCoords(e.clientX, e.clientY),
			x = coords[0],
			y = coords[1];

		me.firstX		= me.prevX = x;
		me.firstY		= me.prevY = y;
		me.prevStamp	= e.timeStamp;
		me.count		= 1;
		me.isDown		= true;

		if (me.onmousedown !== null)
			me.onmousedown(x, y, e);
	}

	/// handle mouse move events
	function _mousemove(e) {

		var mel = me,			 	//don't walk parent context
			coords, x, y;

		if (mel.isDown === true || mel.trackMove === true) {

			coords = calcCoords(e.clientX, e.clientY);
			x = coords[0];
			y = coords[1];

			mel.count++;

			e.isMouseDown = mel.isDown;

			if (mel.onmousemove !== null)
				mel.onmousemove(x, y, e);

			mel.prevStamp = e.timeStamp;
			mel.prevX = x;
			mel.prevY = y;
		}
	}

	/// handle global mouse up events
	function _mouseup(e) {

		var	coords = calcCoords(e.clientX, e.clientY),
			x = coords[0],
			y = coords[1];

		if (me.isDown === true) {

			me.isDown = false;

			e.count = me.count;

			if (me.onmouseup !== null)
				me.onmouseup(x, y, e);
		}
	}

	/**
	 *	Init-poll so we can call onredraw the first time (async)
	*/
	function _init() {
		if (me.onredraw === null) {
			_initCnt--
			if (_initCnt > 0) setTimeout(_init, 10);
		} else {
			me.clear();
			me.onredraw(false);
		}
	}
	_init();

	/// the easyCanvas object at your service
	return this;
}

window.requestAnimationFrame = (function(){
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
	function(cb){window.setTimeout(cb, 16)};
})();
