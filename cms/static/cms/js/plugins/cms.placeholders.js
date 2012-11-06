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
			'mode': 'edit' // edit, drag or view
		},

		initialize: function (container, options) {
			this.containers = $(container);
			this.options = $.extend(true, {}, this.options, options);

			this.toolbar = $('#cms_toolbar');
			this.tooltip = this.toolbar.find('.cms_placeholders-tooltip');
			this.menu = this.toolbar.find('.cms_placeholders-menu');

			this.bars = $('.cms_placeholder-bar');
			this.dragholders = $('.cms_dragholder');
			this.dragitems = $('.cms_dragholder-draggable');
			this.dropareas = $('.cms_dragholder-droppable');
			this.sortareas = $('.cms_sortables');

			this.timer = function () {};

			this._events();
			this._preventEvents();
			this._dragging();

			// handle initial modes
			if(this.options.mode === 'edit') this._enableEditMode();
			if(this.options.mode === 'drag') this._enableDragMode();
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

			// add event to placeholder bar menu
			this.menu.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
				(e.type === 'mouseenter') ? that._showMenu() : that._hideMenu();
			});

			// TODO only prototyping
			this.menu.bind('click', function (e) {
				if($(this).hasClass('cms_placeholders-menu-layout')) {
					that._enableEditMode(300);
				} else {
					that._enableDragMode(300);
				}

				// reset dragholders
				that.dragholders.removeClass('cms_dragholder-selected');
				// attach active class to current element
				var id = $(this).data('id');
				$('#cms_dragholder-' + id).addClass('cms_dragholder-selected');
			});
			// TODO only prototyping
			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(0).bind('click', function (e) {
				e.preventDefault();
				that._enableEditMode(300);
			});
			// TODO only prototyping
			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(1).bind('click', function (e) {
				e.preventDefault();
				that._enableDragMode(300);
			});
		},

		// TODO only prototyping
		_enableEditMode: function (speed) {
			this.bars.hide();
			this.dragholders.hide();
			this.containers.fadeIn(speed);
			this.menu.hide();
			this.menu.removeClass('cms_placeholders-menu-layout');

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(0).addClass('active');
		},

		// TODO only prototyping
		_enableDragMode: function (speed) {
			this.bars.fadeIn(speed);
			this.dragholders.fadeIn(speed);
			this.containers.hide();
			this.menu.hide();
			this.menu.removeClass('cms_placeholders-menu-layout');

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(1).addClass('active');
		},

		_setupPlaceholder: function (placeholder) {
			var that = this;
			// setup corresponding drag element
			var id = this._getId(placeholder);
			var dragholder = $('#cms_dragholder-' + id);

			// attach mouseenter/mouseleave event
			placeholder.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
				// add tooltip event to every placeholder
				(e.type === 'mouseenter') ? that.tooltip.show() : that.tooltip.hide();
				(e.type === 'mouseenter') ? that._showMenu(that._getId($(this))) : that._hideMenu();
			});

			placeholder.add(dragholder).bind('mousemove.cms.placeholder', function () {
				that.menu.css({
					'left': $(this).position().left,
					'top': $(this).position().top
				});
			});

			dragholder.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
				// add tooltip event to every placeholder
				(e.type === 'mouseenter') ? that._showMenu(that._getId($(this)), true) : that._hideMenu(true);
				// bind current element id to
			});
		},

		_showMenu: function (id, dragging) {
			clearTimeout(this.timer);
			this.menu.fadeIn(100);
			if(dragging) this.menu.addClass('cms_placeholders-menu-layout');
			// attach element to menu
			this.menu.data('id', id);
		},

		_hideMenu: function (dragging) {
			var that = this;

			this.timer = setTimeout(function () {
				that.menu.fadeOut(100, function () {
					if(dragging) that.menu.removeClass('cms_placeholders-menu-layout');
				});
			}, 500);
		},

		_getId: function (el) {
			var id = null;

			if(el.hasClass('cms_placeholder')) {
				id = el.attr('id').replace('cms_placeholder-', '');
			} else {
				id = el.attr('id').replace('cms_dragholder-', '');
			}

			return id;
		},

		_dragging: function () {
			var that = this;

			// sortable allows to rearrange items, it also enables draggable which is kinda weird
			// TODO we need to connect to a list directly
			// TODO successfull sorting should also update the position
			this.sortareas.sortable({
				'items': '> .cms_dragholder-draggable',
				'cursor': 'move',
				'connectWith': this.sortareas,
				'tolerance': 'pointer',
				// creates a cline thats over everything else
				'helper': 'clone',
				'appendTo': 'body',
				'placeholder': 'cms_reset cms_light cms_dragholder cms_dragholder-empty cms_dragholder-droppable ui-droppable',
				'zIndex': 999999,
				'stop': function (event, ui) {
					// TODO this needs refactoring, first should be ALL placeholders than all dragitems within a list
					// TODO otherwise this wont work
					var origin = ui.item;
					var id = origin.attr('id').replace('cms_dragholder-', '');
					var shadow = $('#cms_placeholder-' + id);


					shadow.insertBefore(origin);


					// TODO we need some ajax checking before actually replacing
					// TODO we might also need some loading indication


					/*

					ui.item.attr('style', '');

					// TODO we need to handle double sortings
					clearTimeout(that.timer);
					that.timer = setTimeout(function () {
						that.update(ui.item.attr('id').replace('cms_dragholder-', ''), ui.item);
					}, 100);

					*/

				}
			});

			// define which areas are droppable

			this.dropareas.droppable({
				'greedy': true,
				// todo, this is important to check if elements are allowed to be dropped here
				'accept': '.cms_dragholder-draggable',
				'tolerance': 'pointer',
				'activeClass': 'cms_dragholder-allowed',
				'hoverClass': 'cms_dragholder-hover-allowed'
			});
		},

		update: function (id, dragitem) {

			var plugin = $('#cms_placeholder-' + id);
				plugin.insertBefore(dragitem);

			console.log(dragitem);

			// attach new position for plugin
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
		}

	});

	CMS.Placeholder = new CMS.Class({

		options: {
			'type': '', // bar or plugin
			'page_id': null, // TODO SHOULD BE REMOVED
			'placeholder_id': null,
			'plugin_type': '',
			'plugin_id': null,
			'plugin_language': '',
			'plugin_parent': null,
			'plugin_order': null,
			'plugin_breadcrumb': [],
			'plugin_restriction': [],
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
		},

		_setBar: function () {
			var that = this;

			// attach event to the button
			this.container.find('.cms_placeholder-btn').bind('click mouseenter mouseleave', function (e) {
				e.preventDefault();

				if(e.type === 'mouseenter') {
					$(this).find('> a').addClass('active');
					$(this).parent().css('z-index', 99999);
				} else if(e.type === 'mouseleave') {
					$(this).find('> a').removeClass('active');
					$(this).parent().css('z-index', 9999);
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

			// attach options as data values
			//this.container.data(this.options);

			var draggable = $('#cms_dragholder-' + this.options.plugin_id);
			var menu = draggable.find('.cms_dragmenu-dropdown');
			var speed = 200;
			// attach events
			draggable.find('.cms_dragmenu').bind('click', function () {
				if(menu.is(':visible')) {
					hide();
				} else {
					show();
				}
			}).bind('mouseleave', function (e) {
				that.timer = setTimeout(hide, speed);
			});
			draggable.find('.cms_dragmenu-dropdown').bind('mouseleave.cms.draggable mouseenter.cms.draggable', function (e) {
				clearTimeout(that.timer);
				if(e.type === 'mouseleave') {
					that.timer = setTimeout(hide, speed);
				}
			});

			function hide() {
				menu.hide();
				draggable.css('z-index', 99);
			}

			function show() {
				menu.show();
				draggable.css('z-index', 999);
			}

			// atach default item behaviour
			// _setNavigation
			menu.find('a').bind('click', function (e) {
				e.preventDefault();
				CMS.API.Toolbar.delegate($(this));
			});
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
