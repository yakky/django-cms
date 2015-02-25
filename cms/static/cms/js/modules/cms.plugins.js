/*##################################################|*/
/* #CMS# */
(function($) {
// CMS.$ will be passed for $
$(document).ready(function () {
	/*!
	 * Plugins
	 * for created plugins or generics (static content)
	 */
	CMS.Plugin = new CMS.Class({

		implement: [CMS.API.Helpers],

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
				'copy_plugin': '',
				'delete_plugin': ''
			}
		},

		initialize: function (container, options) {
			this.container = $('.' + container);
			this.options = $.extend(true, {}, this.options, options);

			// elements
			this.body = $(document);

			// states
			this.csrf = CMS.config.csrf;
			this.timer = function () {};
			this.timeout = 250;
			this.focused = false;
			this.click = (document.ontouchstart !== null) ? 'click.cms' : 'tap.cms';

			// bind data element to the container
			this.container.data('settings', this.options);

			// determine type of plugin
			switch(this.options.type) {
				case 'placeholder': // handler for placeholder bars
					this._setPlaceholder();
					this._collapsables();
					break;
				case 'plugin': // handler for all plugins
					this._setPlugin();
					this._collapsables();
					break;
				default: // handler for static content
					this._setGeneric();
			}
		},

		// initial methods
		_setPlaceholder: function () {
			var that = this;
			var title = '.cms_dragbar-title';
			var expanded = 'cms_dragbar-title-expanded';
			var dragbar = $('.cms_dragbar-' + this.options.placeholder_id);

			// register the subnav on the placeholder
			this._setSubnav(dragbar.find('.cms_submenu'));

			var items = dragbar.find(title).closest('.cms_dragarea').find('.cms_dragitem-collapsable');
			if(items.length)  {
				dragbar.find(title).addClass('cms_dragbar-arrow');
			}

			// enable expanding/collapsing globally within the placeholder
			dragbar.find(title).bind(this.click, function () {
				($(this).hasClass(expanded)) ? that._collapseAll($(this)) : that._expandAll($(this));
			});

            dragbar.find('.cms_submenu a').on('click', function(e){
                e.preventDefault();
                e.stopPropagation();

                switch($(this).attr('data-rel')) {
                    case 'edit-menu':
                        $('.cms_draggable-' + that.options.plugin_id + ' > .cms_dragitem > .cms_child-plugins').toggleClass('active');
                        $(this).toggleClass('active');
                        $(this).next().toggleClass('active');
                        break;
                    default:
                        break;
                }
            });
		},

		_setPlugin: function () {
			var that = this;
			var timer = function () {};

			// adds double click to edit
			this.container.bind('dblclick', function (e) {
				e.preventDefault();
				e.stopPropagation();
				that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_name, that.options.plugin_breadcrumb);
			});

			// adds edit tooltip
			this.container.bind('mouseover.cms mouseout.cms', function (e) {
				e.stopPropagation();
				var name = that.options.plugin_name;
				var id = that.options.plugin_id;
				(e.type === 'mouseover') ? that.showTooltip(name, id) : that.hideTooltip();
			});

			// adds listener for all plugin updates
			this.container.bind('cms.plugins.update', function (e) {
				e.stopPropagation();
				that.movePlugin();
			});
			// adds listener for copy/paste updates
			this.container.bind('cms.plugin.update', function (e) {
				e.stopPropagation();

				var el = $(e.delegateTarget);
				var dragitem = $('.cms_draggable-' + el.data('settings').plugin_id);
				var placeholder_id = that._getId(dragitem.parents('.cms_draggables').last().prevAll('.cms_dragbar').first());

				// if placeholder_id is empty, cancel
				if(!placeholder_id) return false;

				var data = el.data('settings');
					data.target = placeholder_id;
					data.parent= that._getId(dragitem.parent().closest('.cms_draggable'));

				that.copyPlugin(data);
			});

			// variables for dragitems
			var draggable = $('.cms_draggable-' + this.options.plugin_id);
			var dragitem = draggable.find('> .cms_dragitem');
			var submenu = draggable.find('.cms_submenu:eq(0)');
			var submenus = $('.cms_draggables').find('.cms_submenu');

			// attach event to the plugin menu
			this._setSubnav(draggable.find('> .cms_dragitem .cms_submenu'));

			// adds event for hiding the subnav
			draggable.bind('mouseenter mouseleave mouseover', function (e) {
				e.preventDefault();
				e.stopPropagation();

				if(that.focused) return false;

				if(e.type === 'mouseenter' || e.type === 'mouseover') $(this).data('active', true);
				if(e.type === 'mouseleave') {
					$(this).data('active', false);
				}
			});

			// adds event for showing the subnav
			dragitem.bind('mouseenter', function (e) {
				e.preventDefault();
				e.stopPropagation();
				submenu.show();
			});

			submenus.show();
		},

		_setGeneric: function () {
			var that = this;

			// adds double click to edit
			this.container.bind('dblclick', function (e) {
				e.preventDefault();
				e.stopPropagation();
				that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_name, []);
			});

			// adds edit tooltip
			this.container.bind('mouseover.cms mouseout.cms', function (e) {
				e.stopPropagation();
				var name = that.options.plugin_name;
				var id = that.options.plugin_id;
				(e.type === 'mouseover') ? that.showTooltip(name, id) : that.hideTooltip();
			});
		},

		// public methods
		addPlugin: function (type, name, parent) {
			// cancel request if already in progress
			if(CMS.API.locked) return false;
			CMS.API.locked = true;

			var that = this;
			var data = {
				'placeholder_id': this.options.placeholder_id,
				'plugin_type': type,
				'plugin_parent': parent || '',
				'plugin_language': this.options.plugin_language,
				'csrfmiddlewaretoken': this.csrf
			};

			$.ajax({
				'type': 'POST',
				'url': this.options.urls.add_plugin,
				'data': data,
				'success': function (data) {
					CMS.API.locked = false;
					that.newPlugin = data;
					that.editPlugin(data.url, name, data.breadcrumb);
				},
				'error': function (jqXHR) {
					CMS.API.locked = false;
					var msg = CMS.config.lang.error;
					// trigger error
					that._showError(msg + jqXHR.responseText || jqXHR.status + ' ' + jqXHR.statusText);
				}
			});
		},

		editPlugin: function (url, name, breadcrumb) {
			// trigger modal window
			var modal = new CMS.Modal({
				'newPlugin': this.newPlugin || false,
				'onClose': this.options.onClose || false,
				'redirectOnClose': this.options.redirectOnClose || false
			});
			modal.open(url, name, breadcrumb);
		},

		copyPlugin: function (options, source_language) {
			// cancel request if already in progress
			if(CMS.API.locked) return false;
			CMS.API.locked = true;

			var that = this;
			var move = (options || source_language) ? true : false;
			// set correct options
			options = options || this.options;
			if(source_language) {
				options.target = options.placeholder_id;
				options.plugin_id = '';
				options.parent = '';
			}
			else {
				source_language = options.plugin_language
			}

			var data = {
				'source_placeholder_id': options.placeholder_id,
				'source_plugin_id': options.plugin_id || '',
				'source_language': source_language,
				'target_plugin_id': options.parent || '',
				'target_placeholder_id': options.target || CMS.config.clipboard.id,
				'target_language': options.page_language || source_language,
				'csrfmiddlewaretoken': this.csrf
			};
			var request = {
				'type': 'POST',
				'url': options.urls.copy_plugin,
				'data': data,
				'success': function () {
					CMS.API.Toolbar.openMessage(CMS.config.lang.success);
					// reload
					CMS.API.Helpers.reloadBrowser();
				},
				'error': function (jqXHR) {
					CMS.API.locked = false;
					var msg = CMS.config.lang.error;
					// trigger error
					that._showError(msg + jqXHR.responseText || jqXHR.status + ' ' + jqXHR.statusText);
				}
			};

			if(move) {
				$.ajax(request);
			} else {
				// ensure clipboard is cleaned
				CMS.API.Clipboard.clear(function () {
					$.ajax(request);
				});
			}
		},

		cutPlugin: function () {
			// if cut is once triggered, prevent additional actions
			if(CMS.API.locked) return false;
			CMS.API.locked = true;

			var that = this;
			var data = {
				'placeholder_id': CMS.config.clipboard.id,
				'plugin_id': this.options.plugin_id,
				'plugin_parent': '',
				'plugin_language': this.options.page_language,
				'plugin_order': [this.options.plugin_id],
				'csrfmiddlewaretoken': this.csrf
			};

			// ensure clipboard is cleaned
			CMS.API.Clipboard.clear(function () {
				// cancel request if already in progress
				if(CMS.API.locked) return false;
				CMS.API.locked = true;

				// move plugin
				$.ajax({
					'type': 'POST',
					'url': that.options.urls.move_plugin,
					'data': data,
					'success': function (response) {
						CMS.API.Toolbar.openMessage(CMS.config.lang.success);
						// if response is reload
						CMS.API.Helpers.reloadBrowser();
					},
					'error': function (jqXHR) {
						CMS.API.locked = false;
						var msg = CMS.config.lang.error;
						// trigger error
						that._showError(msg + jqXHR.responseText || jqXHR.status + ' ' + jqXHR.statusText);
					}
				});
			});
		},

		pastePlugin: function () {
			if(!CMS.API.StructureBoard.isAllowed($('.cms_draggable-' + this.options.plugin_id + ' > .cms_draggable_toolbar'), $(CMS.API.Clipboard.containers[0]))) {
				return false;
			}
			if(CMS.API.locked) return false;
			CMS.API.locked = true;

			var that = this;
			var plugin_id = -1;
			var containerClasses = CMS.API.Clipboard.containers[0].className.split(/\s+/);
			for (var i = 0 ; i < containerClasses.length ; i++) {
				matches = /^cms_draggable-(.*)/.exec(containerClasses[i]);
				if (matches) {
					plugin_id = matches[1];
					break;
				}
			}

			var data = {
				'source_placeholder_id': CMS.config.clipboard.id,
				'source_plugin_id': plugin_id || '',
				'source_language': this.options.page_language || '',
				'target_plugin_id': this.options.plugin_id || '',
				'target_placeholder_id': this.options.placeholder_id || '',
				'target_language': this.options.page_language,
				'csrfmiddlewaretoken': this.csrf
			};
			var request = {
				'type': 'POST',
				'url': this.options.urls.copy_plugin,
				'data': data,
				'success': function () {
					CMS.API.Clipboard.clear(function () {
						CMS.API.Toolbar.openMessage(CMS.config.lang.success);
						// reload
						CMS.API.Helpers.reloadBrowser();
					});
				},
				'error': function (jqXHR) {
					CMS.API.locked = false;
					var msg = CMS.config.lang.error;
					// trigger error
					that._showError(msg + jqXHR.responseText || jqXHR.status + ' ' + jqXHR.statusText);
				}
			};
			$.ajax(request);
		},

		movePlugin: function (options) {
			// cancel request if already in progress
			if(CMS.API.locked) return false;
			CMS.API.locked = true;

			var that = this;
			// set correct options
			options = options || this.options;

			var plugin = $('.cms_plugin-' + options.plugin_id);
			var dragitem = $('.cms_draggable-' + options.plugin_id);

			// SETTING POSITION
			this._setPosition(options.plugin_id, plugin, dragitem);

			// SAVING POSITION
			var placeholder_id = this._getId(dragitem.parents('.cms_draggables').last().prevAll('.cms_dragbar').first());
			var plugin_parent = this._getId(dragitem.parent().closest('.cms_draggable'));
			var plugin_order = this._getIds(dragitem.siblings('.cms_draggable').andSelf());

			// cancel here if we have no placeholder id
			if(placeholder_id === false) return false;

			// gather the data for ajax request
			var data = {
				'placeholder_id': placeholder_id,
				'plugin_id': options.plugin_id,
				'plugin_parent': plugin_parent || '',
				 // this is a hack: when moving to different languages use the global language
				'plugin_language': options.page_language,
				'plugin_order': plugin_order,
				'csrfmiddlewaretoken': this.csrf
			};

			$.ajax({
				'type': 'POST',
				'url': options.urls.move_plugin,
				'data': data,
				'success': function (response) {
					// if response is reload
					if(response.reload) CMS.API.Helpers.reloadBrowser();

					// enable actions again
					CMS.API.locked = false;

					// TODO: show only if(response.status)
					that._showSuccess(dragitem);
				},
				'error': function (jqXHR) {
					CMS.API.locked = false;
					var msg = CMS.config.lang.error;
					// trigger error
					that._showError(msg + jqXHR.responseText || jqXHR.status + ' ' + jqXHR.statusText);
				}
			});

			// show publish button
			$('.cms_btn-publish').addClass('cms_btn-publish-active').parent().show();
		},

		deletePlugin: function (url, name, breadcrumb) {
			// trigger modal window
			var modal = new CMS.Modal({
				'newPlugin': this.newPlugin || false,
				'onClose': this.options.onClose || false,
				'redirectOnClose': this.options.redirectOnClose || false
			});
			modal.open(url, name, breadcrumb);
		},

		// private methods
		_setPosition: function (id, plugin, dragitem) {
			// after we insert the plugin onto its new place, we need to figure out where to position it
			var prevItem = dragitem.prev('.cms_draggable');
			var nextItem = dragitem.next('.cms_draggable');
			var parent = dragitem.parent().closest('.cms_draggable');
			var child = $('.cms_plugin-' + this._getId(parent));
			var placeholder = dragitem.closest('.cms_dragarea');

			// determine if there are other plugins within the same level, this makes the move easier
			if(prevItem.length) {
				plugin.insertAfter($('.cms_plugin-' + this._getId(prevItem)));
			} else if(nextItem.length) {
				plugin.insertBefore($('.cms_plugin-' + this._getId(nextItem)));
			} else if(parent.length) {
				// if we can't find a plugin on the same level, we need to travel higher
				// for this we need to find the deepest child
				while(child.children().length) {
					child = child.children();
				}
				child.append(plugin);
			} else if(placeholder.length) {
				// we also need to cover the case if we move the plugin to an empty placeholder
				plugin.append($('.cms_plugin-' + this._getId(placeholder)));
			} else {
				// if we did not found a match, reload
				CMS.API.Helpers.reloadBrowser();
			}
		},

		_setSubnav: function (nav) {
			var that = this;
			nav.bind('mousedown', function (e) { e.stopPropagation(); });  // avoid starting the longclick event when using the drag bar

			$('.cms_draggable-' + this.options.plugin_id).mouseleave(function() {
				$('.cms_edit-menu-dropdown').removeClass('active');
				$('a[data-rel=edit-menu]').removeClass('active');
			});

			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem .cms_draggable_toolbar')
                .on('mouseenter', function(){
                $('.cms_draggable-' + that.options.plugin_id)
                    .css('z-index', '999999999')
                    .parents('.cms_draggable')
                    .css('z-index', '999999999');
            });
			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem .cms_draggable_toolbar')
                .on('mouseleave', function(){
                $('.cms_draggable-' + that.options.plugin_id).css('z-index', '');
            });

			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem .cms_draggable_toolbar a').bind('click.cms tap.cms', function (e) {
				e.preventDefault();
				e.stopPropagation();

				// show loader and make sure scroll doesn't jump
				CMS.API.Toolbar._loader(true);
				CMS.API.Helpers.preventScroll(false);

				var el = $(this);
				// set switch for subnav entries
				switch(el.attr('data-rel')) {
					case 'add':
						var el = $('.cms_draggable-' + that.options.plugin_id + ' > .cms_dragitem > .cms_child-plugins').toggleClass('active');
						$('.cms_draggable-' + that.options.plugin_id + ' .quicksearch').focus();
						break;
					case 'edit':
						that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_name, that.options.plugin_breadcrumb);
						break;
					case 'copy':
						that.copyPlugin();
						break;
					case 'cut':
						that.cutPlugin();
						break;
					case 'paste':
						that.pastePlugin();
						break;
					case 'delete':
						that.deletePlugin(that.options.urls.delete_plugin, that.options.plugin_name, that.options.plugin_breadcrumb);
						break;
					case 'edit-menu':
                        var was_active ;
                        el.hasClass('active') ? was_active = true : was_active = false ;
                        $('.cms_edit-menu-dropdown').removeClass('active');
                        $('a[data-rel=edit-menu]').removeClass('active');
                        $('.cms_draggable').removeClass('cms_draggable-submenu-open');
                        if(!was_active)
						    el.addClass('active').next().addClass('active').closest('.cms_draggable').addClass('cms_draggable-submenu-open');
						break;
					default:
						CMS.API.Toolbar._loader(false);
						CMS.API.Toolbar._delegate(el);
						break;
				}
			});

			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem > .cms_child-plugins a').bind('click.cms tap.cms', function (e) {
				e.preventDefault();
				e.stopPropagation();

				// show loader and make sure scroll doesn't jump
				CMS.API.Toolbar._loader(true);
				CMS.API.Helpers.preventScroll(false);

				var el = $(this);
				// set switch for subnav entries
				switch(el.attr('data-rel')) {
					case 'add':
						that.addPlugin(el.attr('href').replace('#', ''), el.text(), that._getId(el.closest('.cms_draggable')));
						break;
                    case 'close':
                        el.parents('.cms_child-plugins').removeClass('active');
                        break;
					default:
						CMS.API.Toolbar._loader(false);
						CMS.API.Toolbar._delegate(el);
						break;
				}
			});

			var dragbar = $('.cms_dragbar-' + this.options.placeholder_id);

			$('.cms_dragbar-' + this.options.placeholder_id + ' > .cms_child-plugins a').bind('click.cms tap.cms', function (e) {
				e.preventDefault();
				e.stopPropagation();

				// show loader and make sure scroll doesn't jump
				CMS.API.Toolbar._loader(true);
				CMS.API.Helpers.preventScroll(false);

				var el = $(this);
				// set switch for subnav entries
				switch(el.attr('data-rel')) {
                    case 'close':
                        el.parents('.cms_child-plugins').removeClass('active');
                        break;
					case 'add':
						that.addPlugin(el.attr('href').replace('#', ''), el.text(), that._getId(el.closest('.cms_draggable')));
						break;
					default:
						CMS.API.Toolbar._loader(false);
						CMS.API.Toolbar._delegate(el);
						break;
				}
			});

			nav.find('a').bind('click.cms tap.cms', function (e) {
				e.preventDefault();
				e.stopPropagation();

				// show loader and make sure scroll doesn't jump
				CMS.API.Toolbar._loader(true);
				CMS.API.Helpers.preventScroll(false);

				var el = $(this);

				// set switch for subnav entries
				switch(el.attr('data-rel')) {
					case 'add':
						var child_plugins_el = el.closest('.cms_dragbar').find('.cms_child-plugins').toggleClass('active');
						$(child_plugins_el).find('.quicksearch').focus();
						break;
					case 'edit':
						that.editPlugin(that.options.urls.edit_plugin, that.options.plugin_name, that.options.plugin_breadcrumb);
						break;
					case 'copy-lang':
						that.copyPlugin(this.options, el.attr('data-language'));
						break;
					case 'copy':
						that.copyPlugin();
						break;
					case 'cut':
						that.cutPlugin();
						break;
					case 'delete':
						that.deletePlugin(that.options.urls.delete_plugin, that.options.plugin_name, that.options.plugin_breadcrumb);
						break;
					default:
						CMS.API.Toolbar._loader(false);
						CMS.API.Toolbar._delegate(el);
				}
			});

			$('.cms_dragbar-' + that.options.placeholder_id + ' > .cms_child-plugins input').unbind('keyup');
			$('.cms_dragbar-' + that.options.placeholder_id + ' > .cms_child-plugins input').bind('keyup', function (e) {
				if (!that._keyCommand(this, nav, e)) {
					that._startSearch(this, nav, e);
				}
			});

			$('.cms_dragbar-' + that.options.placeholder_id + ' .cms_submenu-item a').unbind('keyup');
			$('.cms_dragbar-' + that.options.placeholder_id + ' .cms_submenu-item a').bind('keyup', function (e) {
				that._keyCommand(this, nav, e);
			});

			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem > .cms_child-plugins input').bind('keyup', function (e) {
				if (!that._keyCommand(this, nav, e)) {
					that._startSearch(this, nav, e);
				}
			});

			$('.cms_draggable-' + this.options.plugin_id + ' > .cms_dragitem > .cms_child-plugins .cms_submenu-item a').bind('keyup', function (e) {
				that._keyCommand(this, nav, e);
			});

			// set data attributes for original top positioning
			nav.find('.cms_submenu-dropdown').each(function () {
				$(this).data('top', $(this).css('top'));
			});

			// prevent propagnation
			nav.bind(this.click, function (e) {
				e.stopPropagation();
			});
		},

		_keyCommand: function (el, nav, e) {
			var anchors = $(el).parent().parent().find('.cms_submenu-item:visible a');
			var index = anchors.index(anchors.filter(':focus'));
			if(e.type === 'keyup') {
				if (e.keyCode === 27) {
					$(el).parents('.cms_child-plugins').removeClass('active');
					return true;
				}
				if (e.keyCode === 38) {
					if (index == 0) {
						$(el).parent().parent().find('input').focus();
					} else if (index == -1) {
						anchors.eq(anchors.length - 1).focus();
					} else {
						anchors.eq(index - 1).focus();
					}
					return true;
				}
				if(e.keyCode === 40) {
					if (index == anchors.length - 1) {
						$(el).parent().parent().find('input').focus();
					} else {
						anchors.eq(index + 1).focus();
					}
					return true;
				}
			}
			return false;
		},

		_startSearch: function (el, nav, e) {
			if(e.type === 'keyup') {
				if (e.keyCode === 13) {
					var anchors = $(el).parent().parent().find('.cms_submenu-item:visible a');
					if (anchors.length == 1) {
						anchors.eq(0).click();
					}
				} else {
					this._searchPlugin($(el).parent(), $(e.currentTarget).val());
				}
			}
		},

		_showSubnav: function (nav) {
			var that = this;
			var dropdown = nav.find('.cms_submenu-dropdown');
			var offset = parseInt(dropdown.data('top'));

			if(!dropdown.is(':visible')) {
				// clearing
				clearTimeout(this.timer);

				// add small delay before showing submenu
				// reset z indexes
				var reset = $('.cms_submenu').parentsUntil('.cms_dragarea');
				var scrollHint = nav.find('.cms_submenu-scroll-hint');

				reset.css('z-index', 0);

				var parents = nav.parentsUntil('.cms_dragarea');
					parents.css('z-index', 999);

				// show subnav
				nav.find('.cms_submenu-quicksearch').show();

				// set visible states
				nav.find('> .cms_submenu-dropdown').show().on('scroll', function () {
					scrollHint.fadeOut(100);
					$(this).off('scroll');
				});

				// show scrollHint for FF on OSX
				if(nav[0].scrollHeight > 230) scrollHint.show();

			}

			// add key events
			$(document).unbind('keydown.cms');
			$(document).bind('keydown.cms', function (e) {
				var anchors = nav.find('.cms_submenu-item:visible a');
				var index = anchors.index(anchors.filter(':focus'));

				// bind arrow down and tab keys
				if(e.keyCode === 40 || e.keyCode === 9) {
					that.traverse = true;
					e.preventDefault();
					if(index >= 0 && index < anchors.length - 1) {
						anchors.eq(index + 1).focus();
					} else {
						anchors.eq(0).focus();
					}
				}

				// bind arrow up keys
				if(e.keyCode === 38) {
					e.preventDefault();
					if(anchors.is(':focus')) {
						anchors.eq(index - 1).focus();
					} else {
						anchors.eq(anchors.length).focus();
					}
				}

				// hide subnav when hitting enter or escape
				if(e.keyCode === 13 || e.keyCode === 27) {
					that.traverse = false;
					nav.find('input').blur();
					that._hideSubnav(nav);
				}
			});

			// calculate subnav bounds
			if($(window).height() + $(window).scrollTop() - nav.offset().top - dropdown.height() <= 10 && nav.offset().top - dropdown.height() >= 0) {
				dropdown.css('top', 'auto');
				dropdown.css('bottom', offset);
				// if parent is within a plugin, add additional offset
				if(dropdown.closest('.cms_draggable').length) dropdown.css('bottom', offset - 1);
			} else {
				dropdown.css('top', offset);
				dropdown.css('bottom', 'auto');
			}

			// enable scroll
			this.preventScroll(true);
		},

		_hideSubnav: function (nav) {
			clearTimeout(this.timer);

			var that = this;

			// set correct active state
			nav.closest('.cms_draggable').data('active', false);

			nav.find('> .cms_submenu-dropdown').hide();
			// enable scroll
			this.preventScroll(false);
			nav.find('input').val('');
			// reset relativity
			$('.cms_dragbar').css('position', '');
		},

		_searchPlugin: function (plugin_container, value) {
			var items = plugin_container.find('.cms_submenu-item');
			var titles = plugin_container.find('.cms_submenu-item-title');

			items.find('a, span').each(function (index, item) {
				item = $(item);
				var text = item.text().toLowerCase();
				var search = value.toLowerCase();
				(text.indexOf(search) >= 0) ? item.parent().show() : item.parent().hide();
			});
		},

		_collapsables: function () {
			// one time setup
			var that = this;
			var settings = CMS.settings;
			var draggable = $('.cms_draggable-' + this.options.plugin_id);
			// check which button should be shown for collapsemenu
			this.container.each(function (index, item) {
				var els = $(item).find('.cms_dragitem-collapsable');
				var open = els.filter('.cms_dragitem-expanded');
				if(els.length === open.length && (els.length + open.length !== 0)) {
					$(item).find('.cms_dragbar-title').addClass('cms_dragbar-title-expanded');
				}
			});
			// cancel here if its not a draggable
			if(!draggable.length) return false;

			// attach events to draggable
			draggable.find('> .cms_dragitem-collapsable').bind(this.click, function () {
				var el = $(this);
				var id = that._getId($(this).parent());

				var settings = CMS.settings;
					settings.states = settings.states || [];

				// collapsable function and save states
				if(el.hasClass('cms_dragitem-expanded')) {
					settings.states.splice($.inArray(id, settings.states), 1);
					el.removeClass('cms_dragitem-expanded').parent().find('> .cms_draggables').hide();
				} else {
					settings.states.push(id);
					el.addClass('cms_dragitem-expanded').parent().find('> .cms_draggables').show();
				}

				// save settings
				CMS.API.Toolbar.setSettings(settings);
			});

			// only needs to be excecuted once
			if(CMS.Toolbar.ready) return false;

			// removing dublicate entries
			var sortedArr = settings.states.sort();
			var filteredArray = [];
			for(var i = 0; i < sortedArr.length; i++) {
				if(sortedArr[i] !== sortedArr[i + 1]) {
					filteredArray.push(sortedArr[i]);
				}
			}
			settings.states = filteredArray;

			// loop through the items
			$.each(CMS.settings.states, function (index, id) {
				var el = $('.cms_draggable-' + id);
				// only add this class to elements which have a draggable area
				if(el.find('.cms_draggables').length) {
					el.find('> .cms_draggables').show();
					el.find('> .cms_dragitem').addClass('cms_dragitem-expanded');
				}
			});

			// set global setup
			CMS.Toolbar.ready = true;
		},

		_expandAll: function (el) {
			var items = el.closest('.cms_dragarea').find('.cms_dragitem-collapsable');
			// cancel if there are no items
			if(!items.length) return false;
			items.each(function () {
				if(!$(this).hasClass('cms_dragitem-expanded')) $(this).trigger('click.cms');
			});

			el.addClass('cms_dragbar-title-expanded');
		},

		_collapseAll: function (el) {
			var items = el.closest('.cms_dragarea').find('.cms_dragitem-collapsable');
			items.each(function () {
				if($(this).hasClass('cms_dragitem-expanded')) $(this).trigger('click.cms');
			});

			el.removeClass('cms_dragbar-title-expanded');
		},

		_getId: function (el) {
			return CMS.API.StructureBoard.getId(el);
		},

		_getIds: function (els) {
			return CMS.API.StructureBoard.getIds(els);
		},

		_showError: function (msg) {
			return CMS.API.Toolbar.showError(msg, true);
		},

		_showSuccess: function (el) {
			var tpl = $('<div class="cms_dragitem-success"></div>');
			el.append(tpl);
			// start animation
			tpl.fadeOut(function () {
				$(this).remove()
			});
		}

	});

});
})(CMS.$);
