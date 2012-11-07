/*##################################################|*/
/* #CMS.PLACEHOLDERS# */
(function($) {
// CMS.$ will be passed for $
	$(document).ready(function () {
		/*!
		 * Placeholders
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

			initialize: function (container, options) {
				this.containers = $(container);
				this.options = $.extend(true, {}, this.options, options);

				this.toolbar = $('#cms_toolbar');
				this.tooltip = this.toolbar.find('.cms_placeholders-tooltip');
				this.menu = this.toolbar.find('.cms_placeholders-menu');

				this.bars = $('.cms_placeholder-bar');
				this.sortareas = $('.cms_sortables');
				this.dragholders = $('.cms_dragholder');

				this.dragitems = $('.cms_dragholder-draggable');
				this.dropareas = $('.cms_dragholder-droppable');

				this.timer = function () {};

				this._events();
				this._preventEvents();
				this._dragging();
			},

			_events: function () {
				var that = this;

				// bind events to each placeholder
				this.containers.each(function () {
					that._setupPlaceholder($(this));
					that._setupDragholder($('#cms_dragholder-' + that.getId($(this))));
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
			},

			_setupPlaceholder: function (placeholder) {
				var that = this;

				// attach mouseenter/mouseleave event
				placeholder.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
					// add tooltip event to every placeholder
					(e.type === 'mouseenter') ? that.tooltip.show() : that.tooltip.hide();
					(e.type === 'mouseenter') ? that._showMenu(that.getId($(this))) : that._hideMenu();
				});

				placeholder.bind('mousemove.cms.placeholder', function () {
					that.menu.css({
						'left': $(this).position().left,
						'top': $(this).position().top
					});
				});
			},

			_setupDragholder: function (dragholder) {
				var that = this;

				dragholder.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
					// add tooltip event to every placeholder
					(e.type === 'mouseenter') ? that._showMenu(that.getId($(this)), true) : that._hideMenu(true);
					// bind current element id to
				});

				dragholder.bind('mousemove.cms.placeholder', function () {
					that.menu.css({
						'left': $(this).position().left,
						'top': $(this).position().top
					});
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

			getId: function (el) {
				var id = null;

				if(el.hasClass('cms_placeholder')) {
					id = el.attr('id').replace('cms_placeholder-', '');
				} else if(el.hasClass('cms_dragholder')) {
					id = el.attr('id').replace('cms_dragholder-', '');
				} else {
					id = el.attr('id').replace('cms_placeholder-bar-', '');
				}

				return id;
			},

			_dragging: function () {
				// sortable allows to rearrange items, it also enables draggable which is kinda weird
				// TODO we need to connect to a list directly
				// TODO successfull sorting should also update the position
				this.sortareas.sortable({
					'items': this.dragitems,
					'cursor': 'move',
					'connectWith': this.sortareas,
					'tolerance': 'pointer',
					// creates a cline thats over everything else
					'helper': 'clone',
					'appendTo': 'body',
					'placeholder': 'cms_reset cms_light cms_dragholder cms_dragholder-empty cms_dragholder-droppable ui-droppable',
					'zIndex': 999999,
					'start': function (event, ui) {
						// remove with from helper
						// TODO might be removed cause of handler pickup
						ui.helper.css('width', 250);
					},
					'stop': function (event, ui) {
						// TODO this needs refactoring, first should be ALL placeholders than all dragitems within a list
						// TODO otherwise this wont work
						//var dragitem = ui.item;

						//plugin.insertBefore(dragitem);

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

						// we pass the id to the updater which checks within the backend the correct place
						var id = ui.item.attr('id').replace('cms_dragholder-', '');
						var plugin = $('#cms_placeholder-' + id);
						plugin.trigger('cms.placeholder.update');
					}
				}).disableSelection();

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

		/*!
		 * Placeholder
		 * @version: 2.0.0
		 * @description: Adds individual handling
		 */
		CMS.Placeholder = new CMS.Class({

			options: {
				'type': '', // bar or plugin
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
					'remove_plugin': '' // TODO this might be depricated cause url is directly on the plugin itself?
				}
			},

			initialize: function (container, options) {
				this.container = $(container);
				this.options = $.extend(true, {}, this.options, options);

				this.body = $(document);
				this.csrf = CMS.API.Toolbar.options.csrf;

				// handler for placeholder bars
				if(this.options.type === 'bar') this._setBar();

				// handler for all generic plugins
				if(this.options.type === 'plugin') this._setPlugin();

				// handler for specific static items
				if(this.options.type === 'text') this._setText();
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
					that.addPlugin($(this).attr('href').replace('#', ''));
				});
			},

			_setPlugin: function () {
				var that = this;

				// add plugin edit event
				this.container.bind('dblclick', function (e) {
					e.preventDefault();
					e.stopPropagation();

					that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_breadcrumb);
				});

				var draggable = $('#cms_dragholder-' + this.options.plugin_id);
				var menu = draggable.find('.cms_dragmenu-dropdown');
				var speed = 200;

				// attach events
				draggable.find('.cms_dragmenu').bind('click', function () {
					(menu.is(':visible')) ? hide() : show();
				}).bind('mouseleave', function (e) {
					that.timer = setTimeout(hide, speed);
				}).end().find('.cms_dragmenu-dropdown').bind('mouseleave.cms.draggable mouseenter.cms.draggable', function (e) {
					clearTimeout(that.timer);
					if(e.type === 'mouseleave') that.timer = setTimeout(hide, speed);
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
				menu.find('a').bind('click', function (e) {
					e.preventDefault();
					var el = $(this);

					if(el.attr('rel') === 'custom') {
						that.addPlugin(el.attr('href').replace('#', ''), that._getId(el.closest('.cms_dragholder')))
					} else {
						that._delegate(el);
					}
				});

				// update plugin position
				this.container.bind('cms.placeholder.update', function () {
					that.updatePlugin();
				});
			},

			_setText: function () {
				var that = this;

				this.container.bind('dblclick', function () {
					that.editPlugin(that.options.urls.edit_plugin, []);
				});
			},

			addPlugin: function (type, parent) {
				var that = this;
				var data = {
					'placeholder_id': this.options.placeholder_id,
					'plugin_type': type,
					'plugin_parent': parent || '',
					'plugin_language': this.options.plugin_language,
					//'plugin_order': [], // TODO this is not implemented yet
					'csrfmiddlewaretoken': this.csrf
				};

				$.ajax({
					'type': 'POST',
					'url': this.options.urls.add_plugin,
					'data': data,
					'success': function (data) {
						that.editPlugin(data.url, data.breadcrumb);
					},
					'error': function (jqXHR) {
						var msg = 'The following error occured while adding a new plugin: ';
						// trigger error
						that._showError(msg + jqXHR.status + ' ' + jqXHR.statusText);
					}
				});
			},

			editPlugin: function (url, breadcrumb) {
				// trigger modal window
				this._openModal(url, breadcrumb);
			},

			updatePlugin: function () {
				var plugin = $('#cms_placeholder-' + this.options.plugin_id);
				var dragitem = $('#cms_dragholder-' + this.options.plugin_id);

				// insert new position
				plugin.insertBefore(dragitem);

				// get new poisition data
				var placeholder_id = this._getId(dragitem.prevAll('.cms_placeholder-bar').first());
				var plugin_order = dragitem.prevUntil('.cms_placeholder-bar').filter('[class*="cms_dragholder-draggable"]').length;
				var plugin_parent = this._getId(dragitem.parent());

				/*
				 'language': this.options.plugin_language,
				 // TODO this should be page_id, not required for new system
				 'placeholder_id': this.options.page_id,
				 // TODO this should be placeholder_id
				 'placeholder': this.options.placeholder_id,
				 'csrfmiddlewaretoken': CMS.API.Toolbar.options.csrf
				 */

				var data = {
					'placeholder_id': placeholder_id,
					'plugin_id': this.options.plugin_id,
					'plugin_parent': plugin_parent,
					'plugin_language': this.options.plugin_language,
					'plugin_order': plugin_order,
					'csrfmiddlewaretoken': CMS.API.Toolbar.options.csrf
				};

				$.ajax({
					'type': 'POST',
					'url': this.options.urls.move_plugin,
					'data': data,
					'success': function (response, status) {

						//console.log(data);
						//console.log(response);
					},
					'error': function (jqXHR) {
						var msg = 'An error occured during the update.';
						// trigger error
						that._showError(msg + jqXHR.status + ' ' + jqXHR.statusText);

						// TODO refresh browser?
					}
				})
			},

			// API helpers
			_getId: function (el) {
				return CMS.API.Placeholders.getId(el);
			},

			_openModal: function (url, breadcrumb) {
				return CMS.API.Toolbar.openModal(url, breadcrumb);
			},

			_showError: function (msg) {
				return CMS.API.Toolbar.showError(msg);
			},

			_delegate: function (el) {
				return CMS.API.Toolbar.delegate(el);
			}

		});

	});
})(CMS.$);

/*
 {
 'type': 'plugin', // bar or plugin
 'placeholder_id': 1,
 'plugin_type': 'TextPlugin',
 'plugin_id': 1,
 'plugin_language': 'en',
 'plugin_children': [
 { 'type': 'ColumnPlugin', title: 'Column' }
 ],
 'plugin_order': 2,
 'plugin_breadcrumb': [
 { 'url': '/en/admin/cms/page/1/edit-plugin/1/', 'title': 'Text plugin' }
 ]
 'plugin_restriction': ['TextPlugin', 'PicturePlugin', 'ColumnPlugin'],
 'urls': {
 'add_plugin': '',
 'edit_plugin': '',
 'move_plugin': ''
 }
 }
 */