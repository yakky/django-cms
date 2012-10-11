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

		initialize: function (container, options) {
			this.container = $(container);
			this.options = $.extend(true, {}, this.options, options);

			// attach event handling to placeholder bar
			if(this.options.type === 'bar') this._setBar();

			// attach events to the placeholders itself
			if(this.options.type === 'holder') this._setHolder();

			// attach events to the placeholders itself
			if(this.options.type === 'layer') this._setLayer();
		},

		_setBar: function () {
			console.log('we got a bar');
		},

		_setHolder: function () {

		},

		_setLayer: function () {

		}

	});

	/*

	 // todo some prototyping
	 var that = this;
	 $('.cms_placeholder-bar').bind('click', function () {
	 that.openModal('/admin/cms/page/6/edit-plugin/2/', [
	 { 'title': 'Gallery', url: '/admin/cms/page/6/edit-plugin/2/' },
	 { 'title': 'Layout', url: '/admin/cms/page/6/edit-plugin/2/' },
	 { 'title': 'Item', url: '/admin/cms/page/6/edit-plugin/2/' },
	 { 'title': 'Text', url: '/admin/cms/page/6/edit-plugin/2/' }
	 ]);
	 });
	* */

});
})(CMS.$);