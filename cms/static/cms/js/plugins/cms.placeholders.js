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

	// TODO we might move all the cms placeholder initializers to CMS.Placeholders
	CMS.Placeholders = new CMS.Class({

		options: {
			'mode': 'edit' // edit, layout or view
		},

		initialize: function (container, options) {
			this.containers = $(container);
			this.options = $.extend(true, {}, this.options, options);

			this.toolbar = $('#cms_toolbar');
			this.tooltip = this.toolbar.find('.cms_placeholders-tooltip');
			this.menu = this.toolbar.find('.cms_placeholders-menu');
			this.bars = $('.cms_placeholder-bar');
			this.layouts = $('.cms_placeholder-layout');
			this.timer = function () {};

			this._events();
			this._preventEvents();

			// handle initial modes
			if(this.options.mode === 'edit') {
				this.bars.hide();
				this.layouts.hide();
			}
		},

		_events: function () {
			var that = this;

			// bind events to each placeholder
			this.containers.each(function () {
				that._setupPlaceholder($(this));
			});

			// save placeholder elements, we need to unbind the event if its already available
			$(document.body).bind('mousemove.cms.placeholder', function (e) {
				that.tooltip.css({
					'left': e.pageX + 20,
					'top': e.pageY - 12
				});
			});

			// add event to menu
			this.menu.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
				(e.type === 'mouseenter') ? that._showMenu() : that._hideMenu();
			});

			// TODO prototyping only
			this.menu.bind('click', function (e) {
				that._enableLayoutMode();
			});

			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(0).bind('click', function (e) {
				e.preventDefault();
				that._enableEditMode();
			});
			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(1).bind('click', function (e) {
				e.preventDefault();
				that._enableLayoutMode();
			});

		},

		// TODO prototyping
		_enableEditMode: function () {
			this.bars.hide();
			this.layouts.hide();
			this.containers.fadeIn(300);

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(0).addClass('active');
		},

		_enableLayoutMode: function () {
			this.bars.fadeIn(300);
			this.layouts.fadeIn(300);
			this.containers.hide();
			this.menu.hide();

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(1).addClass('active');
		},








		_setupPlaceholder: function (placeholder) {
			var that = this;

			// attach mouseenter/mouseleave event
			placeholder.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
				// add tooltip event to every placeholder
				(e.type === 'mouseenter') ? that.tooltip.show() : that.tooltip.hide();
				(e.type === 'mouseenter') ? that._showMenu() : that._hideMenu();
			});

			placeholder.bind('mousemove.cms.placeholder', function () {
				that.menu.css({
					'left': $(this).position().left,
					'top': $(this).position().top
				});
			});
		},

		_showMenu: function () {
			clearTimeout(this.timer);
			this.menu.fadeIn(100);
		},

		_hideMenu: function () {
			var that = this;

			this.timer = setTimeout(function () {
				that.menu.fadeOut(100);
			}, 500);
		},

		_preventEvents: function () {
			var clicks = 0;
			var delay = 500;
			var timer = function () {};
			var prevent = true;

			// unbind click event if already initialized
			this.containers.find('a, button, input[type="submit"], input[type="button"]').bind('click', function (e) {
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
		},

		_toggleMenu: function () {
			var mousemove = 'mousemove.cms.placeholder';
			var mouseenter = 'mouseenter.cms.placeholder';
			var mouseleave = ' mouseleave.cms.placeholder';

			// add tooltip event to every placeholder
			this.container.unbind(mouseenter + mouseleave).bind(mouseenter + mouseleave, function (e) {
				that.menu.css({
					'left': that.container.position().left,
					'top': that.container.position().top
				});

				(e.type === 'mouseenter') ? that.tooltip.show() : that.tooltip.hide();
				(e.type === 'mouseenter') ? show(that.menu) : hide(that.menu);
			});


		}

	});

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
		}

	});

});
})(CMS.$);