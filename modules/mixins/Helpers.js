"use strict";

var React = require('react');
var createReactClass = require('create-react-class');
var ReactDOM = require('react-dom');
var PropTypes = require('prop-types');

var animateScroll = require('./animate-scroll');
var scrollSpy = require('./scroll-spy');
var defaultScroller = require('./scroller');
var assign = require('object-assign');


var protoTypes = {
	to: PropTypes.string.isRequired,
	containerId: PropTypes.string,
	activeClass: PropTypes.string,
	spy: PropTypes.bool,
	smooth: PropTypes.bool,
	spyOffset: PropTypes.number,
	offset: PropTypes.number,
	delay: PropTypes.number,
	isDynamic: PropTypes.bool,
	onClick: PropTypes.func,
	duration: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	absolute: PropTypes.bool,
	onSetActive: PropTypes.func,
	ignoreCancelEvents: PropTypes.bool
};

var Helpers = {

	Scroll: function (Component, customScroller) {

		var scroller = customScroller || defaultScroller;

		return createReactClass({

			propTypes: protoTypes,

			getDefaultProps: function () {
				return { offset: 0, spyOffset: 0 };
			},

			scrollTo: function (to, props) {
				scroller.scrollTo(to, props);
			},

			handleClick: function (event) {

				/*
				 * give the posibility to override onClick
				 */

				if (this.props.onClick) {
					this.props.onClick(event);
				}

				/*
				 * dont bubble the navigation
				 */

				if (event.stopPropagation) event.stopPropagation();
				if (event.preventDefault) event.preventDefault();

				/*
				 * do the magic!
				 */
				this.scrollTo(this.props.to, this.props);

			},

			spyHandler: function (y) {
				var element = scroller.get(this.props.to);
				if (!element) return;
				var cords = element.getBoundingClientRect();
				var topBound = cords.top + y;
				var bottomBound = topBound + cords.height;
				var offsetY = y - this.props.offset;
				var to = this.props.to;
				var isInside = (offsetY >= topBound && offsetY <= bottomBound);
				var isOutside = (offsetY < topBound || offsetY > bottomBound);
				var activeLink = scroller.getActiveLink();

				if (isOutside && activeLink === to) {
					scroller.setActiveLink(void 0);
					this.setState({ active: false });

				} else if (isInside && activeLink != to) {
					scroller.setActiveLink(to);
					this.setState({ active: true });

					if (this.props.onSetActive) {
						this.props.onSetActive(to);
					}

					scrollSpy.updateStates();
				}
			},

			componentDidMount: function () {


				var containerId = this.props.containerId;

				var scrollSpyContainer = containerId ? document.getElementById(containerId) : document;

				if (!scrollSpy.isMounted(scrollSpyContainer)) {
					scrollSpy.mount(scrollSpyContainer);
				}


				if (this.props.spy) {
					var to = this.props.to;
					var element = null;
					var elemTopBound = 0;
					var elemBottomBound = 0;

					this._stateHandler = function () {
						if (scroller.getActiveLink() != to) {
							this.setState({ active: false });
						}
					}.bind(this)

					scrollSpy.addStateHandler(this._stateHandler);

					this._spyHandler = function (y) {

						var containerTop = 0;
						if (scrollSpyContainer.getBoundingClientRect) {
							var containerCords = scrollSpyContainer.getBoundingClientRect();
							containerTop = containerCords.top;
						}

						if (!element || this.props.isDynamic) {
							element = scroller.get(to);
							if (!element) {
								return;
							}

							var cords = element.getBoundingClientRect();
							elemTopBound = (cords.top - containerTop + y);
							elemBottomBound = elemTopBound + cords.height;
						}


						var offset = this.props.spyOffset != 0 ? this.props.spyOffset : this.props.offset;
						var offsetY = y - offset;
						var isInside = (offsetY >= Math.floor(elemTopBound) && offsetY <= Math.floor(elemBottomBound));
						var isOutside = (offsetY < Math.floor(elemTopBound) || offsetY > Math.floor(elemBottomBound));
						var activeLink = scroller.getActiveLink();

						if (isOutside && activeLink === to) {
							scroller.setActiveLink(void 0);
							this.setState({ active: false });

						} else if (isInside && activeLink != to) {
							scroller.setActiveLink(to);
							this.setState({ active: true });

							if (this.props.onSetActive) {
								this.props.onSetActive(to);
							}

							scrollSpy.updateStates();

						}
					}.bind(this);

					scrollSpy.addSpyHandler(this._spyHandler, scrollSpyContainer);
				}
			},
			componentWillUnmount: function () {
				scrollSpy.unmount(this._stateHandler, this._spyHandler);
			},
			render: function () {

				var className = "";
				if (this.state && this.state.active) {
					className = ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim();
				} else {
					className = this.props.className;
				}

				var props = assign({}, this.props);

				for (var prop in protoTypes) {
					if (props.hasOwnProperty(prop)) {
						delete props[prop];
					}
				}

				props.className = className;
				props.onClick = this.handleClick;

				return React.createElement(Component, props);
			}
		});
	},


	Element: function (Component) {
		return createReactClass({
			propTypes: {
				name: PropTypes.string,
				id: PropTypes.string
			},
			componentDidMount: function () {
				this.registerElems(this.props.name);
			},
			componentWillReceiveProps: function (nextProps) {
				if (this.props.name !== nextProps.name) {
					this.registerElems(nextProps.name);
				}
			},
			componentWillUnmount: function () {
				defaultScroller.unregister(this.props.name);
			},
			registerElems: function (name) {
				var domNode = ReactDOM.findDOMNode(this);
				defaultScroller.register(name, domNode);
			},
			render: function () {
				return React.createElement(Component, this.props);
			}
		});
	}
};

module.exports = Helpers;
