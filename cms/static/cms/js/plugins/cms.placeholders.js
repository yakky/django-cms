/*##################################################|*/
/* #CMS.PLACEHOLDERS# */
(function($) {
// CMS.$ will be passed for $
CMS.$(document).ready(function () {
	/*!
	 * Placeholder
	 * @version: 2.0.0
	 * @description: Adds placeholder handling
	 */
	/*
	concept:
	the bar only stores default options.
	we need to send an ajax request to the backend to figure out all the details
	so we can speed up the rendering
	question: is the ID enough information?
	- we might also need the plugin type
	 */

	CMS.Placeholder = new CMS.Class({

		options: {
			'type': '', // bar, holder or layer
			'page_id': null, // TODO SHOULD BE REMOVED
			'placeholder_id': null,
			'plugin_type': '',
			'plugin_id': null,
			'plugin_language': '',
			'plugin_parent': null,
			'plugin_order': null,
			'plugin_breadcrumb': [],
			'urls': {
				'add_plugin': '',
				'edit_plugin': '',
				'move_plugin': '',
				'remove_plugin': ''
			}
		},

		initialize: function (container, options) {
			this.container = $(container);
			this.options = $.extend(true, {}, this.options, options);

			this.toolbar = $('#cms_toolbar');
			this.tooltip = this.toolbar.find('.cms_placeholders-tooltip');

			// attach event handling to placeholder bar
			if(this.options.type === 'bar') this._setBar();

			// attach events to the placeholders itself
			if(this.options.type === 'plugin') this._setPlugin();

			// attach events to the placeholders itself
			if(this.options.type === 'layer') this._setLayer();
		},

		_setBar: function () {
			var that = this;

			// attach event to the button
			this.container.find('.cms_placeholder-btn').bind('mouseenter mouseleave', function (e) {
				if(e.type === 'mouseenter') {
					$(this).find('> a').addClass('active');
					$(this).parent().css('z-index', 999999);
				} else {
					$(this).find('> a').removeClass('active');
					$(this).parent().css('z-index', 99999);
				}
			});

			// attach events to the anchors
			this.container.find('.cms_placeholder-subnav a').bind('click', function (e) {
				e.preventDefault();
				that.addPlugin($(this));
			});
		},

		_setPlugin: function () {
			var that = this;
			var event = 'mousemove.cms.placeholder';

			// save placeholder elements, we need to unbind the event if its already available
			$(document.body).unbind(event).bind(event, function (e) {
				that.tooltip.css({
					'left': e.pageX + 20,
					'top': e.pageY - 12
				});
			});

			// add tooltip event to every placeholder
			this.container.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {

				(e.type === 'mouseenter') ? that.tooltip.show() : that.tooltip.hide();


				// TODO lets do some more prototyping
				//that.container.css('background', 'red');

				console.log(that.container.width());

				that.container.css('display', 'block').css('padding', 1);

				var btn = that.container.find('.cms_placeholder-add');
					btn.css('left', that.container.outerWidth(true) / 2);
					btn.css('top', that.container.outerHeight(true) + 10);

				(e.type === 'mouseenter') ? btn.show() : btn.hide();


				that.container.css('display', 'inline').css('padding', 0);
			});

			// prevent edit events
			// this._preventEvents();

			// add plugin edit event
			this.container.bind('dblclick', function (e) {
				e.preventDefault();
				e.stopPropagation();

				// TODO this url should be passed as option
				var url = that.options.urls.edit_plugin + that.options.page_id + '/edit-plugin/' + that.options.plugin_id;

				// TODO breadcrumb should be saved through that.options.plugin_breadcrumb
				that.editPlugin(url, [{
					'title': that.options.plugin_type,
					'url': url
				}]);
			});
		},

		_setLayer: function () {

		},

		addPlugin: function (el) {
			// TODO needs refactoring
			// I pass the plugin type and

			var that = this;
			var data = {
				'plugin_type': el.attr('href').replace('#', ''),
				'language': this.options.plugin_language,
				// TODO this should be page_id, not required for new system
				'placeholder_id': this.options.page_id,
				// TODO this should be placeholder_id
				'placeholder': this.options.placeholder_id,
				'csrfmiddlewaretoken': CMS.API.Toolbar.options.csrf
			};

			/*
			 * new should be the following
			 * plugin_id (id)
			 * plugin_language (string)
			 * plugin_parent (null)
			 * plugin_order (id)
			 * plugin_breadcrumb (array)
			 * placeholder_id (id)
			 */

			$.ajax({
				'type': 'POST',
				'url': this.options.urls.add_plugin,
				'data': data,
				'success': function (id) {
					// TODO instead of the id we should get the full url so options.edit_plugin is not required
					var url = that.options.urls.edit_plugin + that.options.page_id + '/edit-plugin/' + id;

					that.editPlugin(url, [{
						'title': data.plugin_type,
						'url': url
					}]);
				},
				'error': function (jqXHR) {
					var msg = 'The following error occured while adding a new plugin: ';
					// trigger error
					CMS.API.Toolbar.showError(msg + jqXHR.status + ' ' + jqXHR.statusText);
				}
			});
		},

		editPlugin: function (url, breadcrumb) {
			// trigger modal window
			CMS.API.Toolbar.openModal(url, breadcrumb);
		},

		_preventEvents: function () {
			var clicks = 0;
			var delay = 500;
			var timer = function () {};
			var prevent = true;

			// unbind click event if already initialized
			$('a, button, input[type="submit"], input[type="button"]').unbind('click').bind('click', function (e) {
				// TODO: cancel links from toolbar

				if(prevent) {
					e.preventDefault();

					// clear timeout after click and increment
					clearTimeout(timer);

					timer = setTimeout(function () {
						// if there is only one click use standard event
						if(clicks === 1) {
							prevent = false;

							$(e.currentTarget)[0].click();
						}
						// reset
						clicks = 0;
					}, delay);

					clicks++;
				}

			});
		}

	});

});
})(CMS.$);