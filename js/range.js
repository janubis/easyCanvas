/*!
 *	Input range replacer version 1.0 BETA
 *
 *	By Ken Fyrstenberg Nilsen (c) 2013 Abdias Software
 *	http://abdiassoftware.com/
 *	PRIVATE.
*/
/*
 *	- Adds live onchange to Firefox
 *  - Currently fixes slider bounce-back in FF (slider moves back to inital position/value after mouse up)
 *	- Currently fixes click lock in Chrome (Chrome won't relase the mouse down after mouse up)
*/

window.addEventListener('load', replaceInputRange, false);

function replaceInputRange() {
	
	var inputs = document.querySelectorAll('input[type=range]'),	/// get all input elements of type range
		i = 0, l = inputs.length,									/// counter and number of elements
		cz = [],													/// store canvases here
		C = null,													/// Current canvas
		w, h,														/// default width / height of slider
		kx, kw = 10,												/// knob position and width
		nid = 0,													/// internal id

		knob = document.createElement('canvas'),					/// create a common knob image
		kctx = knob.getContext('2d'),
		hasKnob = false;
	
	/// loop through array of native input elements
	for(; i < l; i++) {

		if (!inputs[i]._ids) {										/// skip already replaced ones

			/// local declarations to avoid common references
			var	inp		= inputs[i],								/// current inpiut element
				cs		= window.getComputedStyle(inp),				/// computed styles
				parent	= inp.parentElement,						/// parent
				min		= parseFloat(inp.min || '0'),				/// get MIN attribute
				max		= parseFloat(inp.max || '100'),				/// get MAX
				value	= parseFloat(inp.value || '0'),				/// get VALUE
				step	= parseFloat(inp.step || '1'),				/// get STEP
				d		= decimals(step),							/// number of decimals if fractional step
				onchange = inp.onchange || inp.getAttribute('onchange'), /// get onchange callback
				canvas = document.createElement('canvas');			/// create replacment canvas
	
			/// get original input's dimensions
			w = parseInt(cs.getPropertyValue('width'), 10) || 182;
			h = Math.max(20, parseInt(cs.getPropertyValue('height'), 10) || 20);

			/// funky comnverting of callback if happen to be a string
			if (typeof onchange === 'string')
				onchange = new Function(onchange);

			/// remove original input from DOM
			parent.removeChild(inputs[i]);
			
			/// project some settings onto canvas
			canvas.id		= inp.id;
			canvas._id		= nid;
			canvas.name		= inp.name;
			canvas.width	= w;
			canvas.height	= h;
			
			/// custom properties transfered from input range
			canvas.className= inp.className;
			canvas.min		= min;
			canvas.max		= max;
			canvas.value	= value;
			canvas.step		= step;
			canvas.onchange	= onchange;
	
			/// get margin and padding
			canvas.style.margin		= cs.getPropertyValue('margin');
			canvas.style.padding	= cs.getPropertyValue('padding');
	
			/// calc initial knob position based on value
			kx = val2pos(canvas, value, kw);

			/// extend canvas with some custom settings (not for the faint-hearted!)	
			canvas._s = {
				isDown: false,
				isInside: false,
				kx: kx,
				kw: kw,
				oldx: -1,
				oldv: value,
				d: d,
				q: Math.pow(10, d)
			};

			/// render knob if not already rendered
			if (hasKnob === false) {
				knob.width = kw;
				knob.height = h;
				renderKnob(kctx, kw, h);
				hasKnob = true;
			}

			/// render the new slider	
			render(canvas);
	
			/// attach callbacks and events
			canvas.onmousedown = mouseDown;
			canvas.onkeydown = keyDown;
			canvas.onfocus = gotFocus;
	
			/// make sure we can focus and receive key events
			canvas.tabIndex = 0;
			
			/// show the master piece, attach to DOM where input was
			parent.appendChild(canvas);
			cz.push(canvas);
	
			/// next internal ID
			nid++;
		}
	}

	/// common event handlers so we can move the slider outside canvas
	window.addEventListener('mouseup', mouseUp, false);
	window.addEventListener('mousemove', mouseMove, false);

	/// handle focus (tab)
	function gotFocus(e) {
		
		var srcEl = e.srcElement || e.target,
			i = 0, el;
		
		C = null;

		/// find current focused canvas		
		for(; el = cz[i]; i++) {
			if (el._id === srcEl._id) {
				C = el;
				return;
			}
		}
	}

	/// slider mouse down	
	function mouseDown(e) {
		
		var pos = getMousePos(this, e),
			kx = this._s.kx,
			kw = this._s.kw;

		C = this;
		
		/// if not on knob we'll still want to move the knob to this position
		this._s.isInside = true;

		/// is on knob?
		if (pos.x > kx - kw * 0.5 && pos.x < kx + kw * 0.5) {
			this._s.isDown = true;
			C = this;
		}
	}

	/// knob moves?
	function mouseMove(e) {

		if (C === null) return;
		
		/// to move or knob
		if (C._s.isDown === true) {

			var pos = getMousePos(C, e),
				v;

			if (e.preventDefault) e.preventDefault();

			v = getValue(pos);			

			if (v == C._s.oldv) return false;
			C._s.oldv = v;

			render(C);
			
			/// send value to callback
			if (typeof C.onchange === 'function')
				C.onchange({value:v, timeStamp: e.timeStamp})

			return false;
		}
	}

	function mouseUp(e) {

		var i = 0, v;
		
		if (C !== null && C._s.isInside === true) {

			C._s.isInside = false;
			C._s.kx = getMousePos(C, e).x; // - C._s.kw * 0.5;

			v = getValue({x:C._s.kx});

			render(C);

			if (typeof C.onchange === 'function')
				C.onchange({value:v, timeStamp: e.timeStamp})
		}

		for(; i < cz.length; i++) {
			cz[i]._s.isDown = false;
		}
	}

	function getMousePos(canvas, e) {

		e = e || window.event;

		var rect = canvas.getBoundingClientRect(),
			x = ((e.clientX || e.offsetX || e.layerX) - rect.left + 0.5)|0,
			y = ((e.clientY || e.offsetY || e.layerY) - rect.top + 0.5)|0;

		return {x:x, y:y};
	}

	function keyDown(e) {
	
		e = e || window.event;
		
		var kc = e.keyCode || e.which;
		
		switch(kc) {

			case 38:	/// up
			case 39:	/// right

				if (e.preventDefault) e.preventDefault();
				
				C.value = parseFloat(C.value) + parseFloat(C.step);
				if (C.value > C.max) C.value = C.max;
	
				setValue();
				
				return false;
				
			case 37:	/// left
			case 40:	///	down
		
				if (e.preventDefault) e.preventDefault();
	
				C.value = parseFloat(C.value) - parseFloat(C.step);
				if (C.value < C.min) C.value = C.min;
				
				setValue();
				
				return false;
			
			case 35:	/// end
			
				if (e.preventDefault) e.preventDefault();
	
				C.value = parseFloat(C.max);
				setValue();
				
				return false;

			case 36:	/// min
			
				if (e.preventDefault) e.preventDefault();
	
				C.value = parseFloat(C.min);
				setValue();
				
				return false;
		}

	}

	function setValue() {

		var value = parseFloat(C.value),
			min = parseFloat(C.min),
			max = parseFloat(C.max),
			s = C._s,
			q = s.q,
			kw = C._s.kw,
			kx = kx = val2pos(C, value);

		/// quantize
		value = (parseInt(value * q + (C.step * 0.5), 10) / q).toFixed(s.d);

		C.value = value;

		s.kx = kx;

		render(C);

		if (typeof C.onchange === 'function')
			C.onchange({value:value})
	}

	function getValue(pos) {

		var v,
			s = C._s,
			q = s.q,
			step = parseFloat(C.step),
			kw = s.kw;
		
		if (pos.x < kw * 0.5) pos.x = kw * 0.5;
		if (pos.x > C.width - kw * 0.5) pos.x = C.width - kw * 0.5;

		v = ((pos.x - kw * 0.5) / (C.width - kw - 1)) * (C.max - C.min);

		/// quantize
		v = v / (step * q) * (step * q);

		if (v < C.min) v = C.min;
		if (v > C.max) v = C.max;
		
		v = v.toFixed(s.d);
		
		C.value = v;
		s.kx = pos.x;
		
		return v;
	}
	
	function render(canvas) {

		var ctx = canvas.getContext('2d'),
			s = canvas._s,
			kx = s.kx,
			kw = s.kw,
			ox = s.oldx,
			w = canvas.width,
			h = canvas.height,
			kwh = kw * 0.5;
		
		ctx.fillStyle = '#000';

		if (ox > -1) ctx.clearRect(ox - 1, 0, kw + 2, h);

		ctx.fillRect(kwh, h * 0.5 - 1, w - kw, 2);
		
		s.oldx = kx - kwh;
		ctx.drawImage(knob, kx - kwh, 0);
				
	}

	function renderKnob(ctx, w, h) {

		var poly = [2, 0, w - 2, 0, w, 2, w, h-2, w - 2, h, 2, h, 0, h -2, 0, 2],
			i = 0, l = poly.length;
		
		ctx.fillStyle = '#888';
		ctx.strokeStyle = '#ccc';

		ctx.beginPath();

		for(; i < l; i += 2)
			(i === 0) ? ctx.moveTo(poly[i], poly[i + 1])
					  : ctx.lineTo(poly[i], poly[i + 1]);

		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		if (w > 7) {
			drawR(0.5, '#333');
			drawR(-0.5, '#aaa');
		}

		function drawR(y, col) {
			ctx.translate(0, y);
			ctx.strokeStyle = col;
			ctx.beginPath();
			line(3, h * 0.3, w - 3, h * 0.3);
			line(3, h * 0.5, w - 3, h * 0.5);
			line(3, h * 0.7, w - 3, h * 0.7);
			ctx.stroke();
		}

		function line(x1, y1, x2, y2) {
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2)
		}
	}	

	function decimals(n) {
		var m = (n + '').match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		return m ? Math.max(0, (m[1] ? m[1].length : 0) - (m[2] ? + m[2] : 0)) : 0;
	}

	function val2pos(canvas, value, knobWidth) {

		var	w  = canvas.width,
			kw = knobWidth ? knobWidth : canvas._s.kw,
			kx = (value / (canvas.max - canvas.min)) * (w - kw) + kw * 0.5;

		if (kx < kw * 0.5) kx = kw * 0.5;
		if (kx > w - kw * 0.5) kx = w - kw * 0.5;

		return kx;
	}

/*	function sendEvent(v) {
		var event = new CustomEvent('change', {detail: {}, bubbles: true, value: v});
		C.dispatchEvent(event);
	}
*/
}
