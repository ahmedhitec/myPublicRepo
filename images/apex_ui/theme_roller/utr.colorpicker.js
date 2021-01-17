/**
 *
 * Color picker
 * Author: Stefan Petre www.eyecon.ro
 * 
 * Dual licensed under the MIT and GPL licenses
 * 
 */
(function ($) {
    var sequenceId = 0,
	    ColorPicker = function () {
		var skipOnChangeEvent = true;
		var
			charMin = 65,
			tpl = '<div class="colorpicker utr-cp"> <div class="colorpicker_color"> <div> <div></div> </div> </div> <div class="colorpicker_hue"> <div></div> </div> <div class="colorpicker_alpha-wrapper"> <div class="colorpicker_alpha"> <div></div> </div> </div> <div class="colorpicker_new_color-wrapper"> <div class="colorpicker_new_color"></div> </div> <div class="colorpicker_current_color"></div> <div class="colorpicker_hex utr-cp"><input type="text" maxlength="25" /></div> <div class="colorpicker_rgb_r colorpicker_field cp-fixbg utr-cp-button"> <label>R:</label> <input type="text" maxlength="3" size="3" data-step="1" data-min="0" data-max="255" /> <button class="btn-down" data-step="-1"> <i class="fa fa-caret-down"></i> </button> <button class="btn-up" data-step="1"> <i class="fa fa-caret-up"></i> </button> </div> <div class="colorpicker_rgb_g colorpicker_field cp-fixbg utr-cp-button"> <label>G:</label> <input type="text" maxlength="3" size="3" data-step="1" data-min="0" data-max="255" /> <button class="btn-down" data-step="-1"> <i class="fa fa-caret-down"></i> </button> <button class="btn-up" data-step="1"> <i class="fa fa-caret-up"></i> </button> </div> <div class="colorpicker_rgb_b colorpicker_field cp-fixbg utr-cp-button"> <label>B:</label> <input type="text" maxlength="3" size="3" data-step="1" data-min="0" data-max="255" /> <button class="btn-down" data-step="-1"> <i class="fa fa-caret-down"></i> </button> <button class="btn-up" data-step="1"> <i class="fa fa-caret-up"></i> </button> </div> <div class="colorpicker_hsb_h colorpicker_field"> <input type="text" maxlength="3" size="3" /> </div> <div class="colorpicker_hsb_s colorpicker_field"> <input type="text" maxlength="3" size="3" /> </div> <div class="colorpicker_hsb_b colorpicker_field"> <input type="text" maxlength="3" size="3" /> </div> <div class="colorpicker_rgb_a colorpicker_field utr-cp-button"> <label>A:</label> <input type="text" maxlength="3" size="3" data-step="0.05" data-min="0" data-max="1" /> <button class="btn-down" data-step="-0.05"> <i class="fa fa-caret-down"></i> </button> <button class="btn-up" data-step="0.05"> <i class="fa fa-caret-up"></i> </button> </div> <div class="colorpicker_submit"></div></div>',
			defaults = {
				eventName: 'click',
				onMouseColorChanged: function () {

				},
				onShow: function () { },
				onBeforeShow: function () { },
				onHide: function () { },
				onChange: function () { },
				onSubmit: function () { },
				color: 'ff0000',
				livePreview: true,
				flat: false
			},
			fillRGBAFields = function (rgba, cal) {
				$(cal).data('colorpicker').fields
					.eq(1).val(rgba.r).end()
					.eq(2).val(rgba.g).end()
					.eq(3).val(rgba.b).end()
					.eq(7).val(rgba.a).end();
			},
			fillRGBFields = function (hsb, cal) {
				var rgb = HSBToRGB(hsb);
				$(cal).data('colorpicker').fields
					.eq(1).val(rgb.r).end()
					.eq(2).val(rgb.g).end()
					.eq(3).val(rgb.b).end()
					.eq(7).val(rgb.a).end();
			},
			fillHSBFields = function (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(4).val(hsb.h).end()
					.eq(5).val(hsb.s).end()
					.eq(6).val(hsb.b).end();
			},
			fillHexFieldsWithRGBA = function (rgba, cal) {
				var value;
				if (typeof rgba.a == "undefined" || rgba.a == 1) {
					value = "#" + RGBToHex(rgba);
				} else {
					value = formatRGBA(rgba);
				}
				$(cal).data('colorpicker').fields
					.eq(0).val(value).end();
			},
			fillHexFields = function (hsb, cal) {
				var hex;
				if (typeof hsb.a == "undefined" || hsb.a == 1) {
					hex = "#" + HSBToHex(hsb);
				} else {
					hex = formatRGBA(HSBToRGB(hsb));
				}
				$(cal).data('colorpicker').fields
					.eq(0).val(hex).end();
			},
			setSelector = function (hsb, cal) {
				$(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({ h: hsb.h, s: 100, b: 100 }));
				$(cal).data('colorpicker').selectorIndic.css({
					left: parseInt(150 * hsb.s / 100, 10) - 2,
					top: parseInt(150 * (100 - hsb.b) / 100, 10) - 2
				});
			},
			setHue = function (hsb, cal) {
				$(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h / 360, 10));
			},
			setCurrentColor = function (hsb, cal) {
				$(cal).data('colorpicker').currentColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			setNewColor = function (hsb, cal) {
				var rgba = HSBToRGB(hsb);
				$(cal).data('colorpicker').newColor.css('backgroundColor', formatRGBA(rgba));
			},
			limitValue = function (value, min, max) {
				return Math.max(min, Math.min(value, max));
			},
			increaseInput = function (el, step, min, max) {
				var currentVal = parseFloatOrDefault(el.val(), 0);
				var newVal = currentVal + step;
				newVal = newVal.toFixed(2);
				el.val(limitValue(newVal, min, max));
				change.apply(el[0], [true]);
			},
			updateValue = function (el, ev) {
				var step = el.data("step");
				if (typeof step != "undefined") {
					var up = 38;
					var down = 40;
					var pressedKey = ev.charCode || ev.keyCode || -1;
					if (pressedKey == up || pressedKey == down) {
						if (pressedKey == down) {
							step = step * -1;
						}
						increaseInput(el, step, el.data("min"), el.data("max"));
					}
				}
			},
			keyUp = function (ev) {
				var el = $(this);
			},
			keyDown = function (ev) {
				var el = $(this);
				updateValue(el, ev);
			},
			parseFloatOrDefault = function (string) {
				var result = parseFloat(string);
				return isNaN(result) ? 0 : result;
			},
			parseIntOrDefault = function (string) {
				var result = parseFloat(string);
				return isNaN(result) ? 0 : result;
			},
			alphaLinearColor = function (endColor) {
				//var alphaBackgroundColor = col.a && col.a != 1 ? HSBToHex(col): "#" + HSBToHex(col);
				var rgba = HSBToRGB(endColor);
				var color = "linear-gradient(to right, rgba(r1,g1,b1,a1), rgba(r2,g2,b2,a2))";
				color = color.replace("r1", rgba.r);
				color = color.replace("g1", rgba.g);
				color = color.replace("b1", rgba.b);
				color = color.replace("a1", 0);

				color = color.replace("r2", rgba.r);
				color = color.replace("g2", rgba.g);
				color = color.replace("b2", rgba.b);
				color = color.replace("a2", 1);

				return color;
			},
			// set alpha
			getAlphaWidth = function (cal) {
				var alphaEl = $(cal).find(".colorpicker_alpha");
				var alphaWidth = parseInt(alphaEl.css("width"));
				return alphaWidth;
			},
			setAlpha = function (col, cal) {
				var alphaEl = $(cal).find(".colorpicker_alpha");
				alphaEl.css('background', alphaLinearColor(col));
				var alphaWidth = getAlphaWidth(cal);
				var leftOffset = -17 + (alphaWidth * col.a);
				var alphaPicker = $(cal).find(".colorpicker_alpha div");
				alphaPicker.css('left', leftOffset);
			},
			setRGBALimits = function (rgba) {
				rgba.r = limitValue(rgba.r, 0, 255);
				rgba.g = limitValue(rgba.g, 0, 255);
				rgba.b = limitValue(rgba.b, 0, 255);
				rgba.a = limitValue(rgba.a, 0, 1);
			},
			parseRGBAOrDefault = function (hex) {
				var rgba;
				if (hex.indexOf("rgba") >= 0) {
					rgba = parseRGBA(hex);
				} else {
					var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
					if (isNaN(hex)) {
						hex = 0;
					}
					rgba = { r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF), a: 1 };
				}
				return rgba;
			},
			change = function (ev, skipOnChangeEvent) {
				var cal = $(this).parent().parent(), col;
				var rgba = null;
				var alpha = parseFloatOrDefault(cal.data('colorpicker').fields.eq(7).val());
				if (this.parentNode.className.indexOf('_hex') > 0) {
					rgba = parseRGBAOrDefault(this.value.indexOf("rgba") >= 0 ? this.value : fixHex(this.value));
					cal.data('colorpicker').color = col = RGBToHSB(rgba);
				} else if (this.parentNode.className.indexOf('_hsb') > 0) {
					cal.data('colorpicker').color = col = fixHSB({
						h: parseIntOrDefault(cal.data('colorpicker').fields.eq(4).val(), 10),
						s: parseIntOrDefault(cal.data('colorpicker').fields.eq(5).val(), 10),
						b: parseIntOrDefault(cal.data('colorpicker').fields.eq(6).val(), 10),
					});
					col.a = alpha;
				} else {
					rgba = fixRGB({
						r: parseIntOrDefault(cal.data('colorpicker').fields.eq(1).val(), 10),
						g: parseIntOrDefault(cal.data('colorpicker').fields.eq(2).val(), 10),
						b: parseIntOrDefault(cal.data('colorpicker').fields.eq(3).val(), 10),
					});
					rgba.a = alpha;
					cal.data('colorpicker').color = col = RGBToHSB(rgba);
					col.a = alpha;
				}

				if (ev) {
					if (rgba == null) {
						fillRGBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
					} else {
						setRGBALimits(rgba);
						fillRGBAFields(rgba, cal.get(0));
						fillHexFieldsWithRGBA(rgba, cal.get(0));
						fillHSBFields(col, cal.get(0));
					}
				}
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
				setAlpha(col, cal);
				if (skipOnChangeEvent === true) {
					return;
				}
				cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
			},
			blur = function (ev) {
				var cal = $(this).parent().parent();
				cal.data('colorpicker').fields.parent().removeClass('colorpicker_focus');
			},
			focus = function () {
				charMin = this.parentNode && this.parentNode.className.indexOf('_hex') > 0 ? 70 : 65;
				if ($(this) && $(this).parent() && $(this).parent().parent() && $(this).parent().parent().fields &&
					$(this).parent().parent().fields.parent()) {
					$(this).parent().parent().data('colorpicker').fields.parent().removeClass('colorpicker_focus');
					$(this).parent().addClass('colorpicker_focus');
				}
			},
			downIncrement = function (ev) {
				var field = $(this).parent().find('input').focus();
				var current = {
					el: $(this).parent().addClass('colorpicker_slider'),
					max: this.parentNode.className.indexOf('_hsb_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsb') > 0 ? 100 : 255),
					y: ev.pageY,
					field: field,
					val: parseInt(field.val(), 10),
					preview: $(this).parent().parent().data('colorpicker').livePreview
				};
				$(document).bind('mouseup', current, upIncrement);
				$(document).bind('mousemove', current, moveIncrement);
			},
			moveIncrement = function (ev) {
				ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10))));
				if (ev.data.preview) {
					change.apply(ev.data.field.get(0), [true]);
				}
				return false;
			},
			upIncrement = function (ev) {
				change.apply(ev.data.field.get(0), [true]);
				ev.data.el.removeClass('colorpicker_slider').find('input').focus();
				$(document).unbind('mouseup', upIncrement);
				$(document).unbind('mousemove', moveIncrement);
				return false;
			},
			downHue = function (ev) {
				var current = {
					cal: $(this).parent(),
					y: $(this).offset().top
				};
				ev.data = current;
				ev.data.preview = true;
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360 * (150 - Math.max(0, Math.min(150, (ev.pageY - ev.data.y)))) / 150, 10))
						.get(0),
					[ev.data.preview, skipOnChangeEvent]
				);
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upHue);
				$(document).bind('mousemove', current, moveHue);
			},
			moveHue = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360 * (150 - Math.max(0, Math.min(150, (ev.pageY - ev.data.y)))) / 150, 10))
						.get(0),
					[ev.data.preview, skipOnChangeEvent]
				);
				return false;
			},
			upHue = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360 * (150 - Math.max(0, Math.min(150, (ev.pageY - ev.data.y)))) / 150, 10))
						.get(0),
					[ev.data.preview]
				);
				$(document).unbind('mouseup', upHue);
				$(document).unbind('mousemove', moveHue);
				return false;
			},
			downAlpha = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};

				var alphaWidth = getAlphaWidth(current.cal);
				var diff = ev.pageX - current.pos.left;
				var alphaValue = diff / alphaWidth;
				var value = Math.max(0, Math.min(1, alphaValue));

				var alphaField = current.cal.data('colorpicker')
					.fields
					.eq(7).val(value.toFixed(2)).get(0);
				change.apply(alphaField, [true, skipOnChangeEvent]);
				$(document).bind('mouseup', current, upAlpha);
				$(document).bind('mousemove', current, moveAlpha);
			},
			upAlpha = function (ev) {
				var alphaWidth = getAlphaWidth(ev.data.cal);
				var diff = ev.pageX - ev.data.pos.left;
				var alphaValue = diff / alphaWidth;
				var value = Math.max(0, Math.min(1, alphaValue));
				var alphaField = ev.data.cal.data('colorpicker')
					.fields
					.eq(7).val(value.toFixed(2)).get(0);
				change.apply(alphaField,
					[true]
				);
				$(document).unbind('mouseup', upAlpha);
				$(document).unbind('mousemove', moveAlpha);
				return false;
			},
			moveAlpha = function (ev) {
				var alphaWidth = getAlphaWidth(ev.data.cal);
				var diff = ev.pageX - ev.data.pos.left;
				var alphaValue = diff / alphaWidth;
				var value = Math.max(0, Math.min(1, alphaValue));
				var alphaField = ev.data.cal.data('colorpicker')
					.fields
					.eq(7).val(value.toFixed(2)).get(0);
				change.apply(alphaField,
					[true, skipOnChangeEvent]
				);
				return false;
			},
			downSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				change.apply(
					current.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100 * (150 - Math.max(0, Math.min(150, (ev.pageY - current.pos.top)))) / 150, 10))
						.end()
						.eq(5)
						.val(parseInt(100 * (Math.max(0, Math.min(150, (ev.pageX - current.pos.left)))) / 150, 10))
						.get(0),
					[current.preview, skipOnChangeEvent]
				);
				$(document).bind('mouseup', current, upSelector);
				$(document).bind('mousemove', current, moveSelector);
			},
			moveSelector = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100 * (150 - Math.max(0, Math.min(150, (ev.pageY - ev.data.pos.top)))) / 150, 10))
						.end()
						.eq(5)
						.val(parseInt(100 * (Math.max(0, Math.min(150, (ev.pageX - ev.data.pos.left)))) / 150, 10))
						.get(0),
					[ev.data.preview, skipOnChangeEvent]
				);
				return false;
			},
			upSelector = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upSelector);
				$(document).unbind('mousemove', moveSelector);
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100 * (150 - Math.max(0, Math.min(150, (ev.pageY - ev.data.pos.top)))) / 150, 10))
						.end()
						.eq(5)
						.val(parseInt(100 * (Math.max(0, Math.min(150, (ev.pageX - ev.data.pos.left)))) / 150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			enterSubmit = function (ev) {
				$(this).addClass('colorpicker_focus');
			},
			leaveSubmit = function (ev) {
				$(this).removeClass('colorpicker_focus');
			},
			clickSubmit = function (ev) {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').color;
				cal.data('colorpicker').origColor = col;
				setCurrentColor(col, cal.get(0));
				cal.data('colorpicker').onSubmit(col, HSBToHex(col), HSBToRGB(col), cal.data('colorpicker').el);
			},
			show = function (ev) {
				var cal = $('#' + $(this).data('colorpickerId'));
				cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
				var pos = $(this).offset();
				var viewPort = getViewport();
				var top = pos.top + this.offsetHeight;
				var left = pos.left;
				if (top + 176 > viewPort.t + viewPort.h) {
					top -= this.offsetHeight + 176;
				}
				if (left + 326 > viewPort.l + viewPort.w) {
					left -= 326;
				}
				cal.css({ left: left + 'px', top: top + 'px' });
				if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
					cal.show();
				}
				$(document).bind('mousedown', { cal: cal }, hide);
				return false;
			},
			hide = function (ev) {
				if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (typeof ev.data.cal.data('colorpicker') !== 'undefined' &&
						ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$(document).unbind('mousedown', hide);
				}
			},
			isChildOf = function (parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if (parentEl.compareDocumentPosition) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while (prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},
			getViewport = function () {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l: window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t: window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w: window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h: window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},
			fixHSB = function (hsb) {
				return {
					h: Math.min(360, Math.max(0, hsb.h)),
					s: Math.min(100, Math.max(0, hsb.s)),
					b: Math.min(100, Math.max(0, hsb.b)),
					a: Math.min(1, Math.max(0, hsb.a))
				};
			},
			fixRGB = function (rgb) {
				return {
					r: Math.min(255, Math.max(0, rgb.r)),
					g: Math.min(255, Math.max(0, rgb.g)),
					b: Math.min(255, Math.max(0, rgb.b)),
					a: Math.min(1, Math.max(0, rgb.a))
				};
			},
			fixHex = function (hex) {
				var len = 6 - hex.length;
				if (len > 0) {
					var o = [];
					for (var i = 0; i < len; i++) {
						o.push('0');
					}
					o.push(hex);
					hex = o.join('');
				}
				return hex;
			},
			parseRGBA = function (string) {
				var rgba = {
					r: 0,
					g: 0,
					b: 0,
					a: 0
				};
				string = string.replace(/\s/g, "");
				string = string.replace("rgba", "");
				string = string.replace("(", "");
				string = string.replace(")", "");
				var values = string.split(",");
				rgba.r = parseIntOrDefault(values[0], 10);
				rgba.g = parseIntOrDefault(values[1], 10);
				rgba.b = parseIntOrDefault(values[2], 10);
				rgba.a = parseFloatOrDefault(values[3]);
				return rgba;
			},
			HexToRGB = function (hex) {
				if (hex.indexOf("rgba") >= 0) {
					return parseRGBA(hex);
				}
				var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
				return { r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF), a: 1 };
			},
			HexToHSB = function (hex) {
				return RGBToHSB(HexToRGB(hex));
			},
			RGBToHSB = function (rgb) {
				var hsb = {
					h: 0,
					s: 0,
					b: 0,
					a: rgb.a
				};
				var min = Math.min(rgb.r, rgb.g, rgb.b);
				var max = Math.max(rgb.r, rgb.g, rgb.b);
				var delta = max - min;
				hsb.b = max;
				if (max != 0) {

				}
				hsb.s = max != 0 ? 255 * delta / max : 0;
				if (hsb.s != 0) {
					if (rgb.r == max) {
						hsb.h = (rgb.g - rgb.b) / delta;
					} else if (rgb.g == max) {
						hsb.h = 2 + (rgb.b - rgb.r) / delta;
					} else {
						hsb.h = 4 + (rgb.r - rgb.g) / delta;
					}
				} else {
					hsb.h = -1;
				}
				hsb.h *= 60;
				if (hsb.h < 0) {
					hsb.h += 360;
				}
				hsb.s *= 100 / 255;
				hsb.b *= 100 / 255;
				return hsb;
			},
			HSBToRGB = function (hsb) {
				var rgb = {};
				var h = Math.round(hsb.h);
				var s = Math.round(hsb.s * 255 / 100);
				var v = Math.round(hsb.b * 255 / 100);
				if (s == 0) {
					rgb.r = rgb.g = rgb.b = v;
				} else {
					var t1 = v;
					var t2 = (255 - s) * v / 255;
					var t3 = (t1 - t2) * (h % 60) / 60;
					if (h == 360) h = 0;
					if (h < 60) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3 }
					else if (h < 120) { rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3 }
					else if (h < 180) { rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3 }
					else if (h < 240) { rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3 }
					else if (h < 300) { rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3 }
					else if (h < 360) { rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3 }
					else { rgb.r = 0; rgb.g = 0; rgb.b = 0 }
				}
				return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), a: hsb.a };
			},
			formatRGBA = function (rgba) {
				var format = "rgba(red,green,blue,alpha)";
				format = format.replace("red", rgba.r);
				format = format.replace("green", rgba.g);
				format = format.replace("blue", rgba.b);
				format = format.replace("alpha", rgba.a);
				return format;
			},
			RGBToHex = function (rgb) {
				var hex = [
					rgb.r.toString(16),
					rgb.g.toString(16),
					rgb.b.toString(16)
				];
				$.each(hex, function (nr, val) {
					if (val.length == 1) {
						hex[nr] = '0' + val;
					}
				});
				return hex.join('');
			},
			HSBToHex = function (hsb) {
				return RGBToHex(HSBToRGB(hsb));
			},
			restoreOriginal = function () {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').origColor;
				cal.data('colorpicker').color = col;
				fillRGBFields(col, cal.get(0));
				fillHexFields(col, cal.get(0));
				fillHSBFields(col, cal.get(0));
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
			},
			increaseInterval = 0,
			initialIncreaseInterval = 0,
			buttonMouseUp = function () {
				clearInterval(increaseInterval);
				clearInterval(initialIncreaseInterval);
				$(document).unbind("mouseup", buttonMouseUp);
			},
			initBindings = function (cal, colorSelector, btnSelector) {
				var elems = cal.find(colorSelector + " " + btnSelector);
				elems.click(function () {
					var input = cal.find(colorSelector + "	input");
					increaseInput(input, $(this).data("step"), input.data("min"), input.data("max"));
				});
				elems.bind("mousedown", function () {
					var input = cal.find(colorSelector + "	input");
					increaseInput(input, $(this).data("step"), input.data("min"), input.data("max"));
					$(document).bind("mouseup", buttonMouseUp);
					var button = $(this);
					initialIncreaseInterval = setTimeout(function () {
						increaseInterval = setInterval(function () {
							increaseInput(input, button.data("step"), input.data("min"), input.data("max"));
						}, 75);
					}, 400);
				});
			},
			initButtons = function (cal, buttonSelector) {
				initBindings(cal, buttonSelector, ".btn-up");
				initBindings(cal, buttonSelector, ".btn-down");
			};
		return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt || {});
				if (typeof opt.color == 'string') {
					opt.color = HexToHSB(opt.color);
				} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
					opt.color = RGBToHSB(opt.color);
				} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
					opt.color = fixHSB(opt.color);
				} else {
					return this;
				}
				return this.each(function () {
					if (!$(this).data('colorpickerId')) {
						var options = $.extend({}, opt);
						options.origColor = opt.color;
						var id = 'collorpicker_' + sequenceId++;
						$(this).data('colorpickerId', id);
						var cal = $(tpl).attr('id', id);
						if (options.flat) {
							cal.appendTo(this).show();
						} else {
							cal.appendTo(document.body);
						}
						options.fields = cal
							.find('input')
							.bind('keydown', keyDown)
							.bind('keyup', keyUp)
							.bind('change', change)
							.bind('blur', blur)
							.bind('focus', focus);
						cal
							.find('span').bind('mousedown', downIncrement).end()
							.find('>div.colorpicker_current_color').bind('click', restoreOriginal);
						initButtons(cal, ".colorpicker_rgb_r");
						initButtons(cal, ".colorpicker_rgb_g");
						initButtons(cal, ".colorpicker_rgb_b");
						initButtons(cal, ".colorpicker_rgb_a");
						options.selector = cal.find('div.colorpicker_color').bind('mousedown', downSelector);
						options.selectorIndic = options.selector.find('div div');
						options.el = this;
						options.hue = cal.find('div.colorpicker_hue div');
						cal.find('div.colorpicker_hue').bind('mousedown', downHue);
						cal.find('div.colorpicker_alpha-wrapper').bind('mousedown', downAlpha);
						options.newColor = cal.find('div.colorpicker_new_color');
						options.currentColor = cal.find('div.colorpicker_current_color');
						cal.data('colorpicker', options);
						cal.find('div.colorpicker_submit')
							.bind('mouseenter', enterSubmit)
							.bind('mouseleave', leaveSubmit)
							.bind('click', clickSubmit);
						fillRGBFields(options.color, cal.get(0));
						fillHSBFields(options.color, cal.get(0));
						fillHexFields(options.color, cal.get(0));
						setHue(options.color, cal.get(0));
						setSelector(options.color, cal.get(0));
						setCurrentColor(options.color, cal.get(0));
						setNewColor(options.color, cal.get(0));
						setAlpha(options.color, cal);
						if (options.flat) {
							cal.css({
								position: 'relative',
								display: 'block'
							});
						} else {
							$(this).bind(options.eventName, show);
						}

						// utr styles
						var addClassTo = [
							".colorpicker_hex",
							".colorpicker_submit",
							".colorpicker_submit",
							".colorpicker_current_color",
							".colorpicker_hsb_h",
							".colorpicker_hsb_s",
							".colorpicker_hsb_b"
						];
						for (var i = 0; i < addClassTo.length; i++) {
							cal.find(addClassTo[i]).addClass("utr-cp");
						}
					}
				});
			},
			showPicker: function () {
				return this.each(function () {
					if ($(this).data('colorpickerId')) {
						show.apply(this);
					}
				});
			},
			hidePicker: function () {
				return this.each(function () {
					if ($(this).data('colorpickerId')) {
						$('#' + $(this).data('colorpickerId')).hide();
					}
				});
			},
			setColor: function (col) {
				if (typeof col == 'string') {
					col = HexToHSB(col);
				} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
					col = RGBToHSB(col);
				} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
					col = fixHSB(col);
				} else {
					return this;
				}
				return this.each(function () {
					if ($(this).data('colorpickerId')) {
						var cal = $('#' + $(this).data('colorpickerId'));
						cal.data('colorpicker').color = col;
						cal.data('colorpicker').origColor = col;
						fillRGBFields(col, cal.get(0));
						fillHSBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
						setHue(col, cal.get(0));
						setSelector(col, cal.get(0));
						setCurrentColor(col, cal.get(0));
						setNewColor(col, cal.get(0));
						setAlpha(col, cal);
					}
				});
			}
		};
	}();
	$.fn.extend({
		UTRColorPicker: ColorPicker.init,
		UTRColorPickerHide: ColorPicker.hidePicker,
		UTRColorPickerShow: ColorPicker.showPicker,
		UTRColorPickerSetColor: ColorPicker.setColor
	});
})(jQuery);
