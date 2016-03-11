/// Simple syntax high-lighter for easyCanvas demos, by Ken Nilsen (Epistemex)

function codeFormatter() {

	/// show actual demo code
	codePre.innerHTML = codeJS.innerHTML.substring(1);

	var els = document.querySelectorAll('[data-code]'), el, i = 0;

	for(; el = els[i]; i++) {
		el.innerHTML = el.innerHTML.replace(/\>/gm, '&gt;');
		el.innerHTML = el.innerHTML.replace(/\</gm, '&lt;');
		el.innerHTML = el.innerHTML.replace(/[\+\-\*,.=!\?\:](?=([^']*'[^']*')*[^']*$)/gm, '<span class="ops">$&</span>');
		el.innerHTML = el.innerHTML.replace(/'([^\\']|\\\\|\\')*'/gm, '<span class="string">$&</span>');
		el.innerHTML = el.innerHTML.replace(/\/\/\/(.*)$/gm, '<span class="cmt">$&</span>');
		el.innerHTML = el.innerHTML.replace(/\d{1,6}(\.\d{0,2})?(?=([^']*'[^']*')*[^']*$)/gm, '<span class="num">$&</span>');
		el.innerHTML = el.innerHTML.replace(/[({\[\]})]/gm, '<span class="paranthesis">$&</span>');
		el.innerHTML = el.innerHTML.replace(/\bfunction|true|false|var|if|else|function|new/gm, '<span class="res">$&</span>');
		el.innerHTML = el.innerHTML.replace(/\bez|easyCanvas/gm, '<span class="ez">$&</span>');
	}
}
