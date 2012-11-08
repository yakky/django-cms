/*##################################################|*/
/* #CMS.TOOLBAR# */
(function($) {
// CMS.$ will be passed for $
$(document).ready(function () {
	/*!
	 * Toolbar
	 * @version: 2.0.0
	 * @description: Adds toolbar, sidebar, dialogue and modal
	 */
	CMS.Toolbar = new CMS.Class({

		implement: [CMS.API.Helpers],

		options: {
			'csrf': '',
			'debug': false, // not yet required
			'settings': {
				'toolbar': 'expanded', // expanded or collapsed
				'mode': 'edit' // live, draft, edit or layout
			},
			'sidebarDuration': 300,
			'sidebarWidth': 275,
			'dialogueDuration': 300,
			'modalDuration': 300,
			'modalWidth': 800,
			'modalHeight': 400,
			'urls': {
				'settings': '' // url to save settings
			},
			'lang': {
				'confirm': 'Yes',
				'cancel': 'No'
			}
		},

		initialize: function (container, options) {
			this.container = $(container);
			this.options = $.extend(true, {}, this.options, options);
			this.settings = this.options.settings;

			// class variables
			this.toolbar = this.container.find('.cms_toolbar');
			this.toolbar.hide();
			this.toolbarTrigger = this.container.find('.cms_toolbar-trigger');

			this.navigations = this.container.find('.cms_toolbar-item_navigation');
			this.buttons = this.container.find('.cms_toolbar-item_buttons');
			this.switcher = this.container.find('.cms_toolbar-item_switch');

			this.body = $('html');
			this.sideframe = this.container.find('.cms_sideframe');
			this.dialogue = this.container.find('.cms_dialogue');
			this.lockToolbar = false;
			this.modal = this.container.find('.cms_modal');

			this.tooltip = this.container.find('.cms_placeholders-tooltip');
			this.menu = this.container.find('.cms_placeholders-menu');
			this.bars = $('.cms_placeholder-bar');
			this.plugins = $('.cms_placeholder');
			this.dragholders = $('.cms_dragholder');

			// setup initial stuff
			this._setup();

			// setup events
			this._events();
		},

		_setup: function () {
			// set correct settings
			if(this.getSettings() === null) this.setSettings();
			this.settings = this.getSettings();

			// setup toolbar visibility, we need to reverse the options to set the correct state
			(this.settings.toolbar === 'expanded') ? this._showToolbar(0, true) : this._hideToolbar(0, true);
			// setup toolbar mode
			(this.settings.mode === 'drag') ? this._enableDragMode(300, true) : this._enableEditMode(300, true);
		},

		_events: function () {
			var that = this;

			// attach event to the trigger handler
			this.toolbarTrigger.bind('click', function (e) {
				e.preventDefault();
				that.toggleToolbar(200);
			});

			// attach event to the navigation elements
			this.navigations.each(function () {
				$(this).find('li ul a').bind('click', function (e) {
					e.preventDefault();
					that.delegate($(e.currentTarget));
				});
				$(this).find('li > a').bind('click', function (e) {
					e.preventDefault();
				});
				// handle active passive states
				var root = $(this).find('> li');
					root.bind('mouseenter mouseleave', function (e) {
						root.removeClass('active');
						if(e.type === 'mouseenter') $(this).addClass('active');
					});
			});

			// attach event to the switcher elements
			this.switcher.each(function () {
				$(this).bind('click', function (e) {
					e.preventDefault();
					that._setSwitcher($(e.currentTarget));
				});
			});

			// attach event to the sidebar
			this.sideframe.bind('dblclick', function () {
				that._hideSideframe();
			});
			this.sideframe.find('.cms_sideframe-resize').bind('mousedown', function (e) {
				e.preventDefault();
				that._startSideframeResize();
			});

			// attach events to the dialogue window
			this.dialogue.find('.cms_dialogue-confirm').bind('click', function (e) {
				e.preventDefault();
				that.openAjax(that.dialogue.data('url'));
			});
			this.dialogue.find('.cms_dialogue-cancel').bind('click', function (e) {
				e.preventDefault();
				that._hideDialogue();
			});
			this.dialogue.find('.cms_dialogue-accept').bind('click', function (e) {
				e.preventDefault();
				that._hideDialogue();
			});

			// attach events to window
			this.modal.find('.cms_modal-close').bind('click', function (e) {
				e.preventDefault();
				that._hideModal(100);
			});
			this.modal.find('.cms_modal-collapse').bind('click', function (e) {
				e.preventDefault();
				that._minimizeModal();
			});
			this.modal.find('.cms_modal-title').bind('mousedown.cms', function (e) {
				e.preventDefault();
				that._startModalMove(e);
			});
			this.modal.find('.cms_modal-resize').bind('mousedown.cms', function (e) {
				e.preventDefault();
				that._startModalResize(e);
			});
			this.modal.find('.cms_modal-breadcrumb-items a').live('click', function (e) {
				e.preventDefault();
				that._changeModalContent($(this));
			});

			// stopper events
			$(document).bind('mouseup.cms', function (e) {
				that._stopSideframeResize();
				that._endModalMove(e);
				that._endModalResize(e);
			});

			// event for switching between edit and layout mode
			this.menu.bind('click', function (e) {
				($(this).hasClass('cms_placeholders-menu-layout')) ? that._enableEditMode(300) : that._enableDragMode(300);
				// reset dragholders
				that.dragholders.removeClass('cms_dragholder-selected');
				// attach active class to current element
				var id = $(this).data('id');
				$('#cms_dragholder-' + id).addClass('cms_dragholder-selected');
			});
			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(0).bind('click', function (e) {
				e.preventDefault();
				that._enableEditMode(300);
			});
			this.toolbar.find('.cms_toolbar-item_buttons li a').eq(1).bind('click', function (e) {
				e.preventDefault();
				that._enableDragMode(300);
			});
		},

		toggleToolbar: function (speed) {
			(this.settings.toolbar === 'collapsed') ? this._showToolbar(speed) : this._hideToolbar(speed);
		},

		_showToolbar: function (speed, init) {
			this.toolbarTrigger.addClass('cms_toolbar-trigger-expanded');
			this.toolbar.slideDown(speed);
			this.settings.toolbar = 'expanded';
			if(!init) this.setSettings();
		},

		_hideToolbar: function (speed, init) {
			// cancel if dialogue is active
			if(this.lockToolbar) return false;

			this.toolbarTrigger.removeClass('cms_toolbar-trigger-expanded');
			this.toolbar.slideUp(speed);
			this.settings.toolbar = 'collapsed';
			if(!init) this.setSettings();
		},

		_enableEditMode: function (speed, init) {
			this.bars.hide();
			this.plugins.fadeIn(speed);
			this.dragholders.hide();
			this.menu.hide().removeClass('cms_placeholders-menu-layout');

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(0).addClass('active');
			this.settings.mode = 'edit';

			if(!init) this.setSettings();
		},

		_enableDragMode: function (speed, init) {
			this.bars.fadeIn(speed);
			this.plugins.hide();
			this.dragholders.fadeIn(speed);
			this.menu.hide().removeClass('cms_placeholders-menu-layout');

			// set active item
			this.toolbar.find('.cms_toolbar-item_buttons li').removeClass('active').eq(1).addClass('active');
			this.settings.mode = 'drag';

			if(!init) this.setSettings();
		},

		// this function is a placeholder and should update the backend with various toolbar states
		setSettings: function () {
			// TODO should be done different
			return localStorage.setItem('cms_cookie', JSON.stringify(this.settings));
		},

		getSettings: function () {
			// TODO should be done different (ie < 8)
			return JSON.parse(localStorage.getItem('cms_cookie'));
		},

		delegate: function (el) {
			// save local vars
			var target = el.attr('rel');

			switch(target) {
				case 'dialogue':
					this.openDialogue(el.attr('data-text'), el.attr('href'));
					break;
				case 'sideframe':
					this.openSideframe(el.attr('href'));
					break;
				case 'ajax':
					this.openAjax(el.attr('href'));
					break;
				default:
					this.openModal(el.attr('href'), el.attr('data-name'), [{
						'title': el.attr('data-name'),
						'url': el.attr('href')
					}]);
			}
		},

		_setSwitcher: function (el) {
			// save local vars
			var active = el.hasClass('cms_toolbar-item_switch-active');
			var anchor = el.find('a');
			var knob = el.find('.cms_toolbar-item_switch-knob');
			var duration = 300;

			if(active) {
				knob.animate({
					'right': anchor.outerWidth(true) - (knob.outerWidth(true) + 2)
				}, duration);
				// move anchor behind the knob
				anchor.css('z-index', 1).animate({
					'padding-top': 6,
					'padding-right': 14,
					'padding-bottom': 4,
					'padding-left': 28
				}, duration);
			} else {
				knob.animate({
					'left': anchor.outerWidth(true) - (knob.outerWidth(true) + 2)
				}, duration);
				// move anchor behind the knob
				anchor.css('z-index', 1).animate({
					'padding-top': 6,
					'padding-right': 28,
					'padding-bottom': 4,
					'padding-left': 14
				}, duration);
			}

			// reload
			setTimeout(function () {
				// TODO: this should only call reload insted of attaching new url
				window.location.href = anchor.attr('href');
			}, duration);
		},

		openSideframe: function (url) {
			// prepare iframe
			var that = this;
			var holder = this.sideframe.find('.cms_sideframe-frame');
			var iframe = $('<iframe src="'+url+'" class="" frameborder="0" />');
				iframe.hide();
			var width = this.options.sidebarWidth;

			// attach load event to iframe
			iframe.bind('load', function () {
				iframe.show();
			});

			// cancel animation if sidebar is already shown
			if(this.sideframe.is(':visible')) {
				// sidebar is already open
				insertHolder(iframe);
				// reanimate the frame
				if(parseInt(this.sideframe.css('width')) <= width) this._showSideframe(width);
			} else {
				// load iframe after frame animation is done
				setTimeout(function () {
					insertHolder(iframe);
				}, this.options.sidebarDuration);
				// display the frame
				this._showSideframe(width);
			}

			function insertHolder(iframe) {
				// show iframe after animation
				that.sideframe.find('.cms_sideframe-frame').addClass('cms_modal-loader');
				holder.html(iframe);
			}
		},

		openAjax: function (url) {
			var that = this;

			// TODO: the crsf token needs to be added through the backend or read from the options
			$.ajax({
				'type': 'POST',
				'url': url,
				'data': {
					'csrfmiddlewaretoken': this.options.csrf
				},
				'success': function () {
					window.location.reload();
				},
				'error': function (jqXHR) {
					that.showError(jqXHR.response + ' | ' + jqXHR.status + ' ' + jqXHR.statusText);
				}
			});
		},

		openDialogue: function (msg, url) {
			var field = this.dialogue.find('.cms_dialogue-text');
				field.html(msg);

			var confirm = this.dialogue.find('.cms_dialogue-confirm, .cms_dialogue-cancel');
			var alert = this.dialogue.find('.cms_dialogue-accept');

			// activate confirm dialogue
			if(url) {
				this.dialogue.data('url', url);
				confirm.show();
				alert.hide();
				// activate alert dialogue
			} else {
				confirm.hide();
				alert.show();
			}

			// show the dialogue
			this._showDialogue();
		},

		openModal: function (url, name, breadcrumb) {
			// TODO DOUBLE DBLCLICK OPEN
			// TODO DBL CLICK OPEN

			// prepare iframe
			var that = this;
			// TODO background style needs fixing
			var iframe = $('<iframe src="'+url+'" frameborder="0" style="background:#fff;" />');
				iframe.hide();
			var holder = this.modal.find('.cms_modal-frame');

			// insure previous iframe is hidden
			holder.find('iframe').hide();

			// attach load event for iframe to prevent flicker effects
			iframe.bind('load', function () {
				iframe.show();
			});

			// show iframe after animation
			setTimeout(function () {
				that.modal.find('.cms_modal-body').addClass('cms_modal-loader');
				holder.html(iframe);
			}, this.options.modalDuration);

			// set correct title
			var title = this.modal.find('.cms_modal-title');
				title.text(name);

			// insure modal is not maximized
			if(this.modal.find('.cms_modal-collapsed').length) this._minimizeModal();

			// reset styles
			this.modal.css({
				'left': '50%',
				'top': '50%',
				'mergin-left': 0,
				'margin-right': 0
			});
			this.modal.find('.cms_modal-body').css({
				'width': this.options.modalWidth,
				'height': this.options.modalHeight
			});
			this.modal.find('.cms_modal-body').removeClass('cms_modal-loader');

			// we need to render the breadcrumb
			var crumb = '';

			$.each(breadcrumb, function (index, item) {
				// check if the item is the last one
				var last = (index >= breadcrumb.length - 1) ? 'cms_modal-breadcrumb-last' : '';
				// render breadcrumb
				crumb += '<a href="' + item.url + '" class="' + last + '"><span>' + item.title + '</span></a>';
			});

			this.modal.find('.cms_modal-breadcrumb-items').html(crumb);

			// display modal
			this._showModal(this.options.modalDuration);
		},

		_showSideframe: function (width) {
			this.sideframe.animate({ 'width': width }, this.options.sidebarDuration);
			this.body.animate({ 'margin-left': width }, this.options.sidebarDuration);
			this.lockToolbar = true;
		},

		_hideSideframe: function () {
			this.sideframe.animate({ 'width': 0 }, this.options.sidebarDuration, function () { $(this).hide(); });
			this.body.animate({ 'margin-left': 0 }, this.options.sidebarDuration);
			this.sideframe.find('.cms_sideframe-frame').removeClass('cms_modal-loader');
			// remove the iframe
			this.sideframe.find('iframe').remove();
			this.lockToolbar = false;
		},

		_startSideframeResize: function () {
			var that = this;
			// this prevents the iframe from being focusable
			this.sideframe.find('.cms_sideframe-shim').css('z-index', 20);

			$(document).bind('mousemove.cms', function (e) {
				if(e.clientX <= 3) e.clientX = 3;

				that.sideframe.css('width', e.clientX);
				that.body.css('margin-left', e.clientX);
			});
		},

		_stopSideframeResize: function () {
			this.sideframe.find('.cms_sideframe-shim').css('z-index', 1);

			$(document).unbind('mousemove.cms');
		},

		_showDialogue: function () {
			var height = this.dialogue.outerHeight(true);
			this.dialogue.css('top', -height).show().animate({
				'top': 30
			}, this.options.dialogueDuration);

			this.lockToolbar = true;
		},

		_hideDialogue: function () {
			var height = this.dialogue.outerHeight(true);
			this.dialogue.show().animate({
				'top': -height
			}, this.options.dialogueDuration);

			this.lockToolbar = false;
		},

		_showModal: function (speed) {
			// we need to position the modal in the center
			var that = this;
			var width = this.modal.width();
			var height = this.modal.height();

			// animates and sets the modal
			this.modal.css({
				'width': 0,
				'height': 0,
				'margin-left': 0,
				'margin-top': 0
			}).stop(true, true).animate({
				'width': width,
				'height': height,
				'margin-left': -(width / 2),
				'margin-top': -(height / 2)
			}, speed, function () {
				$(this).removeAttr('style');

				that.modal.css({
					'margin-left': -(width / 2),
					'margin-top': -(height / 2)
				});

				// fade in modal window
				that.modal.show();
			});
		},

		_hideModal: function (speed) {
			this.modal.fadeOut(speed);
			this.modal.find('.cms_modal-frame iframe').remove();
			this.modal.find('.cms_modal-body').removeClass('cms_modal-loader');
		},

		_minimizeModal: function () {
			var trigger = this.modal.find('.cms_modal-collapse');
				trigger.toggleClass('cms_modal-collapsed');

			var contents = this.modal.find('.cms_modal-body, .cms_modal-foot');
				contents.toggle();
		},

		_startModalMove: function (initial) {
			var that = this;
			var position = that.modal.position();

			this.modal.find('.cms_modal-shim').show();

			$(document).bind('mousemove.cms', function (e) {
				var left = position.left - (initial.pageX - e.pageX) - $(window).scrollLeft();
				var top = position.top - (initial.pageY - e.pageY) - $(window).scrollTop();

				that.modal.css({
					'left': left,
					'top': top
				});
			});
		},

		_endModalMove: function () {
			this.modal.find('.cms_modal-shim').hide();

			$(document).unbind('mousemove.cms');
		},

		_startModalResize: function (initial) {
			var that = this;
			var container = this.modal.find('.cms_modal-body');
			var width = container.width();
			var height = container.height();

			this.modal.find('.cms_modal-shim').show();

			$(document).bind('mousemove.cms', function (e) {
				var w = width - (initial.pageX - e.pageX);
				var h = height - (initial.pageY - e.pageY);
				var b = that.modal.find('.cms_modal-breadcrumb').outerWidth(true);

				// add some limits
				if(w <= b) w = b;
				if(h <= 100) h = 100;

				container.css({'width': w, 'height': h });
			});
		},

		_endModalResize: function () {
			this.modal.find('.cms_modal-shim').hide();

			$(document).unbind('mousemove.cms');
		},

		_changeModalContent: function (el) {
			if(el.hasClass('cms_modal-breadcrumb-last')) return false;

			var parents = el.parent().find('a');
				parents.removeClass('cms_modal-breadcrumb-last');

			el.addClass('cms_modal-breadcrumb-last');

			// now refresh the content
			var iframe = $('<iframe src="'+el.attr('href')+'" class="" frameborder="0" />');
			var holder = this.modal.find('.cms_modal-frame');
				holder.html(iframe);
		},

		showError: function (msg) {
			this.openDialogue(msg);
		}

	});

});
})(CMS.$);