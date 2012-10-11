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

		},

		_setHolder: function () {

		},

		_setLayer: function () {

		}

	});

});
})(CMS.$);