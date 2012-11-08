/*##################################################|*/
/* #CMS.PLACEHOLDERS# */
(function($) {
// CMS.$ will be passed for $
	$(document).ready(function () {
		/*!
		 * Placeholders
		 * @version: 2.0.0
		 * @description: Adds one-time placeholder handling
		 */
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

				// handling placeholder and dragholders one-time initialization
				this.containers.each(function () {
					that._setupPlaceholder($(this));
					that._setupDragholder($('#cms_dragholder-' + that.getId($(this))));
				});

				// this sets the correct position for the edit tooltip
				$(document.body).bind('mousemove.cms.placeholder', function (e) {
					that.tooltip.css({
						'left': e.pageX + 20,
						'top': e.pageY - 12
					});
				});

				// bind menu specific events so its not hidden when hovered
				this.menu.bind('mouseover.cms.placeholder mouseout.cms.placeholder', function (e) {
					e.stopPropagation();
					(e.type === 'mouseover') ? that._showMenu($(this)) : that._hideMenu($(this));
				});
			},

			_setupPlaceholder: function (placeholder) {
				var that = this;

				placeholder.bind('mouseover.cms.placeholder mouseout.cms.placeholder', function (e) {
					e.stopPropagation();
					// add events to placeholder
					(e.type === 'mouseover') ? that.tooltip.show() : that.tooltip.hide();
					(e.type === 'mouseover') ? that._showMenu($(this)) : that._hideMenu($(this));
				});
			},

			_setupDragholder: function (dragholder) {
				var that = this;

				dragholder.bind('mouseover.cms.placeholder mouseout.cms.placeholder', function (e) {
					e.stopPropagation();
					// add events to dragholder
					(e.type === 'mouseover') ? that._showMenu($(this)) : that._hideMenu($(this));
				});
			},

			_showMenu: function (el) {
				var that = this;
				var speed = 50;

				clearTimeout(this.timer);

				// handle class handling
				if(el.hasClass('cms_dragholder')) this.menu.addClass('cms_placeholders-menu-layout');

				// sets the timer to switch elements
				this.timer = setTimeout(function () {
					// exclude if hovering menu itself
					if(!el.hasClass('cms_placeholders-menu')) {
						that.menu.css({
							'left': el.offset().left,
							'top': el.offset().top
						});
						// show element and attach id to CMS.Toolbar
						that.menu.fadeIn(speed).data('id', that.getId(el));
					}
				}, speed);
			},

			_hideMenu: function (el) {
				var that = this;
				var speed = 50;

				clearTimeout(this.timer);

				// sets the timer for closing
				this.timer = setTimeout(function () {
					that.menu.fadeOut(speed, function () {
						that.menu.removeClass('cms_placeholders-menu-layout');
					});
				}, speed);
			},

			getId: function (el) {
				// cancel if no element is defined
				if(el === undefined || el.length <= 0) return false;

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
				//console.log(this.dragitems);

				this.sortareas.sortable({
					'items': this.dragitems,
					'cursor': 'move',
					'connectWith': this.sortareas,
					'tolerance': 'pointer',
					// creates a cline thats over everything else
					'helper': 'clone',
					'appendTo': 'body',
					'dropOnEmpty': true,
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
				'type': '', // bar, plugin or generic
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
				if(this.options.type === 'generic') this._setGeneric();
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
				// CONTENT
				this.container.bind('dblclick', function (e) {
					e.preventDefault();
					e.stopPropagation();

					that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_breadcrumb);
				});

				this._setPluginMenu();

				// update plugin position
				this.container.bind('cms.placeholder.update', function () {
					that.movePlugin();
				});
			},

			_setPluginMenu: function () {
				// DRAGGABLE
				var that = this;
				var draggable = $('#cms_dragholder-' + this.options.plugin_id);
				var menu = draggable.find('> .cms_dragmenu-dropdown');
				var speed = 200;

				// attach events
				draggable.find('> .cms_dragmenu').bind('click', function () {
					(menu.is(':visible')) ? hide() : show();
				}).bind('mouseleave', function (e) {
						that.timer = setTimeout(hide, speed);
					});
				menu.bind('mouseleave.cms.draggable mouseenter.cms.draggable', function (e) {
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
			},

			_setGeneric: function () {
				var that = this;

				this.container.bind('dblclick', function () {
					that.editPlugin(that.options.urls.edit_plugin, []);
				});

				this.container.bind('mouseenter.cms.placeholder mouseleave.cms.placeholder', function (e) {
					// add tooltip event to every placeholder
					(e.type === 'mouseenter') ? CMS.API.Placeholders.tooltip.show() : CMS.API.Placeholders.tooltip.hide();
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

			movePlugin: function () {
				var that = this;

				var plugin = $('#cms_placeholder-' + this.options.plugin_id);
				var dragitem = $('#cms_dragholder-' + this.options.plugin_id);

				// insert new position
				var id = this._getId(dragitem.prev('.cms_dragholder-draggable'));
				if(id) {
					plugin.insertAfter($('#cms_placeholder-' + id));
				} else {
					dragitem.parent().prepend(plugin);
				}

				// get new poisition data
				var placeholder_id = this._getId(dragitem.closest('.cms_sortarea').prevAll('.cms_placeholder-bar').first());
				var plugin_parent = this._getId(dragitem.parent().closest('.cms_dragholder'));
				var plugin_order = this._getIds(dragitem.siblings('.cms_dragholder-draggable').andSelf());

				// gather the data for ajax request
				var data = {
					'placeholder_id': placeholder_id,
					'plugin_id': this.options.plugin_id,
					'plugin_parent': plugin_parent || '',
					'plugin_language': this.options.plugin_language,
					'plugin_order': plugin_order,
					'csrfmiddlewaretoken': CMS.API.Toolbar.options.csrf
				};

				$.ajax({
					'type': 'POST',
					'url': this.options.urls.move_plugin,
					'data': data,
					'success': function (response, status) {
						if(response === 'success') {}
						//console.log(data);
						//console.log(response);
					},
					'error': function (jqXHR) {
						var msg = 'An error occured during the update.';
						// trigger error
						that._showError(msg + jqXHR.status + ' ' + jqXHR.statusText);
					}
				})
			},

			// API helpers
			_getId: function (el) {
				return CMS.API.Placeholders.getId(el);
			},

			_getIds: function (els) {
				var array = [];
				els.each(function () {
					array.push(CMS.API.Placeholders.getId($(this)));
				});
				return array;
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