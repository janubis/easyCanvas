
/**
 *	Sticky Menu - Ken Fyrstenberg Nilsen
*/
(function() {

	var win = $(window),
		main = $('#main'),
		menu = $('#menu'),
		bgmenu = $('#bgmenu'),
		menuTop = menu.position().top,
		menuHeight = menu.height(),
		isFixed = false,
		isDone = false;

	$(window).scroll(
		function() {

			var y = win.scrollTop();

			if (!isFixed && y > menuTop) {
				isFixed = true;

				menu.css('position', 'fixed').css('top', '0');
				main.css('margin-top', menuHeight);

			} else if (isFixed && y <= menuTop) {
				isFixed = false;

				main.css('margin-top', 0);

				menu.css('position', 'static');
				menu.css('box-shadow', 'none');
				menu.css('height', menuHeight);
				menu.css('border-radius', '0');
				menu.css('top', '0');

				bgmenu.css('opacity', 1);
			}

			if (y >= menuTop && y < (menuTop + menuHeight)) {

				var op = (y - menuTop) / menuHeight,
					br = (op * 7)|0;

				bgmenu.css('opacity', 1 - op);
				menu.css('box-shadow', '0 2px 4px rgba(0, 0, 0, ' + op * 0.75 + ')');
				menu.css('height', menuHeight * (1 - op * 0.05));
				menu.css('top', (1 - op * 8) - 1 + 'px');
				menu.css('border-radius', '0 0 ' + br + 'px ' + br + 'px');

				isDone = (y + 1 == (menuTop + menuHeight));
			}

			if (!isDone && y >= (menuTop + menuHeight)) {
				isDone = true;

				menu.css('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.75)');
				menu.css('height', menuHeight * 0.95);
				menu.css('border-radius', '0 0 7px 7px');
				menu.css('top', '-8px');

			} else if (isDone && y < menuTop) {
				isDone = false;
			}
		}
	)
})();
