/**
 * cvi_sphere_lib.js 1.3 (10-Aug-2010) (c) by Christian Effenberger 
 * All Rights Reserved. Source: sphere.netzgesta.de
 * Distributed under Netzgestade Non-commercial Software License Agreement.
 * This license permits free of charge use on non-commercial 
 * and private web sites only under special conditions. 
 * Read more at... http://www.netzgesta.de/cvi/LICENSE.html

 * syntax:
	cvi_sphere.defaultSize=0;		//INT 32-n (px)
	cvi_sphere.defaultColor=0;		//STR '#000000'-'#ffffff' or 0
	cvi_sphere.defaultColor2=0;		//STR '#000000'-'#ffffff' or 0
	cvi_sphere.defaultAlpha=100;	//INT 0-100 (% opacity)
	cvi_sphere.defaultShine=100;	//INT 0-100 (% opacity)
	cvi_sphere.defaultShade=100;	//INT 0-100 (% opacity)
	cvi_sphere.defaultZoom=100;		//INT 100-200 (% zoom)
	cvi_sphere.defaultShift=50;		//INT 0-100 (% shift)
	
	depends on: cvi_filter_lib.js
		cvi_sphere.defaultFilter = null;//OBJ [{f='grayscale'},{f='emboss', s:1}...]
		
	cvi_sphere.remove( image );
	cvi_sphere.add( image, options );
	cvi_sphere.modify( image, options );
	cvi_sphere.add( image, { size: value, color: value, color2: value, alpha: value, shadow: value, shine: value, zoom: value, shift: value } );
	cvi_sphere.modify( image, { size: value, color: value, color2: value, alpha: value, shadow: value, shine: value, zoom: value, shift: value } );
FLT=cvi_sphere.version;
STR=cvi_sphere.released;
 *
**/

var cvi_sphere = {
  version: 1.3,
  released: "2009-08-10 12:00:00",
  defaultSize: 0,
  defaultColor: 0,
  defaultColor2: 0,
  defaultAlpha: 100,
  defaultShine: 100,
  defaultShade: 100,
  defaultZoom: 100,
  defaultShift: 50,
  defaultFilter: null,
  defaultCallback: null,
  add: function (image, options) {
    if (image.tagName.toUpperCase() == "IMG") {
      var defopts = {
        size: cvi_sphere.defaultSize,
        color: cvi_sphere.defaultColor,
        color2: cvi_sphere.defaultColor2,
        alpha: cvi_sphere.defaultAlpha,
        shade: cvi_sphere.defaultShade,
        shine: cvi_sphere.defaultShine,
        zoom: cvi_sphere.defaultZoom,
        shift: cvi_sphere.defaultShift,
        filter: cvi_sphere.defaultFilter,
        callback: cvi_sphere.defaultCallback,
        show: false,
      };
      if (options) {
        for (var i in defopts) {
          if (!options[i]) {
            options[i] = defopts[i];
          }
        }
      } else {
        options = defopts;
      }
      if (image.naturalWidth && image.naturalHeight) {
        var nw = image.naturalWidth;
        var nh = image.naturalHeight;
      } else {
        var tmp = new Image();
        tmp.src = image.src;
        var nw = tmp.width;
        var nh = tmp.height;
        delete tmp;
      }
      var size =
        typeof options["size"] == "number"
          ? options["size"]
          : cvi_sphere.defaultSize;
      if (size <= 0) {
        size = Math.max(
          32,
          nw > nh ? image.height : nh > nw ? image.width : image.height
        );
      }
      if (size < 32) {
        size = 32;
      }
      try {
        var object = image.parentNode;
        if (
          document.all &&
          document.namespaces &&
          !window.opera &&
          (!document.documentMode || document.documentMode < 9)
        ) {
          if (document.namespaces["v"] == null) {
            var e = [
                "shape",
                "shapetype",
                "group",
                "background",
                "path",
                "formulas",
                "handles",
                "fill",
                "stroke",
                "shadow",
                "textbox",
                "textpath",
                "imagedata",
                "line",
                "polyline",
                "curve",
                "roundrect",
                "oval",
                "rect",
                "arc",
                "image",
              ],
              s = document.createStyleSheet();
            for (var i = 0; i < e.length; i++) {
              s.addRule("v\\:" + e[i], "behavior: url(#default#VML);");
            }
            document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
          }
          var display =
            image.currentStyle.display.toLowerCase() == "block"
              ? "block"
              : "inline-block";
          var canvas = document.createElement(
            [
              '<var style="zoom:1;overflow:hidden;display:' +
                display +
                ";width:" +
                size +
                "px;height:" +
                size +
                'px;padding:0;">',
            ].join("")
          );
          var flt = image.currentStyle.styleFloat.toLowerCase();
          canvas.dpl = flt == "left" || flt == "right" ? "inline" : display;
        } else {
          var canvas = document.createElement("canvas");
          canvas.isWK = navigator.appVersion.indexOf("WebKit") != -1 ? 1 : 0;
          canvas.isS4 = canvas.isWK && document.querySelectorAll ? 1 : 0;
        }
        if (canvas || canvas.getContext("2d")) {
          canvas.options = options;
          canvas.id = image.id;
          canvas.alt = image.alt;
          canvas.title = image.title;
          canvas.source = image.src;
          canvas.className = image.className;
          canvas.style.cssText = image.style.cssText;
          canvas.style.height = size + "px";
          canvas.style.width = size + "px";
          canvas.height = size;
          canvas.width = size;
          canvas.naturalWidth = nw;
          canvas.naturalHeight = nh;
          canvas.onclick = image.onclick;
          canvas.ondblclick = image.ondblclick;
          object.replaceChild(canvas, image);
          cvi_sphere.modify(canvas, options);
        }
      } catch (e) {}
    }
  },

  modify: function (canvas, options) {
    function drawEllipse(ctx, x1, y1, x2, y2) {
      var kp = 4 * ((Math.sqrt(2) - 1) / 3),
        rx = (x2 - x1) / 2,
        ry = (y2 - y1) / 2,
        cx = x1 + rx,
        cy = y1 + ry;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry);
      ctx.bezierCurveTo(
        cx + kp * rx,
        cy - ry,
        cx + rx,
        cy - kp * ry,
        cx + rx,
        cy
      );
      ctx.bezierCurveTo(
        cx + rx,
        cy + kp * ry,
        cx + kp * rx,
        cy + ry,
        cx,
        cy + ry
      );
      ctx.bezierCurveTo(
        cx - kp * rx,
        cy + ry,
        cx - rx,
        cy + kp * ry,
        cx - rx,
        cy
      );
      ctx.bezierCurveTo(
        cx - rx,
        cy - kp * ry,
        cx - kp * rx,
        cy - ry,
        cx,
        cy - ry
      );
      ctx.closePath();
      return false;
    }
    function hex2rgb(val, f, isIE) {
      function h2d(v) {
        return Math.max(0, Math.min(parseInt(v, 16), 255));
      }
      function d2h(v) {
        v = Math.round(Math.min(Math.max(0, v), 255));
        return (
          "0123456789ABCDEF".charAt((v - (v % 16)) / 16) +
          "0123456789ABCDEF".charAt(v % 16)
        );
      }
      var cr = h2d(val.substr(1, 2)),
        cg = h2d(val.substr(3, 2)),
        cb = h2d(val.substr(5, 2));
      if (isIE) {
        return "#" + d2h(cr * f) + "" + d2h(cg * f) + "" + d2h(cb * f);
      } else {
        return (
          Math.floor(cr * f) +
          "," +
          Math.floor(cg * f) +
          "," +
          Math.floor(cb * f)
        );
      }
    }
    try {
      var alpha =
        typeof options["alpha"] == "number"
          ? options["alpha"]
          : canvas.options["alpha"];
      canvas.options["alpha"] = alpha;
      var shade =
        typeof options["shade"] == "number"
          ? options["shade"]
          : canvas.options["shade"];
      canvas.options["shade"] = shade;
      var shine =
        typeof options["shine"] == "number"
          ? options["shine"]
          : canvas.options["shine"];
      canvas.options["shine"] = shine;
      var zoom =
        typeof options["zoom"] == "number"
          ? options["zoom"]
          : canvas.options["zoom"];
      canvas.options["zoom"] = zoom;
      var shift =
        typeof options["shift"] == "number"
          ? options["shift"]
          : canvas.options["shift"];
      canvas.options["shift"] = shift;
      var filter =
        typeof options["filter"] == "object"
          ? options["filter"]
          : canvas.options["filter"];
      canvas.options["filter"] = filter;
      var callback =
        typeof options["callback"] == "string"
          ? options["callback"]
          : canvas.options["callback"];
      canvas.options["callback"] = callback;
      var color =
        typeof options["color"] == "string"
          ? options["color"]
          : canvas.options["color"];
      canvas.options["color"] = color;
      var color2 =
        typeof options["color2"] == "string"
          ? options["color2"]
          : canvas.options["color2"];
      canvas.options["color2"] = color2;
      var c1 = 0;
      if (isNaN(color))
        c1 = color.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)
          ? color
          : 0;
      var c2 = 0;
      if (isNaN(color2))
        c2 = color2.match(
          /^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i
        )
          ? color2
          : 0;
      var sz = canvas.width,
        nw = canvas.naturalWidth,
        nh = canvas.naturalHeight,
        nx = 0,
        ny = 0,
        xx = 0,
        yy = 0,
        xo = 0.5,
        yo = 0.5;
      var sf = shift <= 0.01 ? 0 : shift >= 100 ? 1 : shift / 100,
        zz = zoom < 100 ? 1 : zoom > 200 ? 2 : zoom / 100,
        zo = (zz - 1) * 0.5,
        lw = 0.4,
        st = "";
      if (nw > nh) {
        nx = (nw - nh) * sf;
        xo = 1 - sz / nw;
        xx = xo * -0.5 + sf * xo;
        xo = sf;
        nw = nh;
      } else if (nh > nw) {
        ny = (nh - nw) * sf;
        yo = 1 - sz / nh;
        yy = yo * -0.5 + sf * yo;
        yo = sf;
        nh = nw;
      }
      var fc = 0.85,
        iw = Math.round(sz * fc),
        ih = iw,
        ic = ih / 2,
        os = (sz - iw) / 2,
        op = alpha == 0 ? 0.0 : alpha / 100;
      var sh = shade == 0 ? 0.0 : shade / 100,
        sd = shine == 0 ? 0.0 : shine / 100,
        gc = hex2rgb(isNaN(c2) ? c2 : isNaN(c1) ? c1 : "#000000", 1 - op);
      if (
        document.all &&
        document.namespaces &&
        !window.opera &&
        (!document.documentMode || document.documentMode < 9)
      ) {
        var head,
          foot,
          shadow,
          border,
          shades,
          shines,
          frame,
          fill = "";
        gc = hex2rgb(isNaN(c2) ? c2 : isNaN(c1) ? c1 : "#000000", 0.3, true);
        if (canvas.tagName.toUpperCase() == "VAR") {
          head =
            '<v:group style="zoom:1;display:' +
            canvas.dpl +
            ";margin:0;padding:0;position:relative;width:" +
            sz +
            "px;height:" +
            sz +
            'px;" coordsize="' +
            sz +
            "," +
            sz +
            '"><v:rect strokeweight="0" filled="f" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:0px;left:0px;width:' +
            sz +
            "px;height:" +
            sz +
            'px;"></v:rect>';
          foot = "</v:group>";
          if (isNaN(c1)) {
            fill =
              '<v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
              os +
              "px;width:" +
              iw +
              "px;height:" +
              ih +
              'px;"><v:fill color2="' +
              c1 +
              '" color="' +
              (isNaN(c2) ? c2 : c1) +
              '" type="gradient" method="sigma" angle="20" focus="0" focussize="0,0" focusposition="1,1" on="t" /></v:oval>';
          }
          shades =
            '<v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
            os +
            "px;width:" +
            iw +
            "px;height:" +
            ih +
            'px;"><v:fill opacity="0" color="black" color2="black" o:opacity2="' +
            sh * 0.5 +
            '" type="gradient" method="any" angle="0" focus="0" focussize="0.2,0.2" focusposition="0.4,0.4" on="t" /></v:oval><v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
            os +
            "px;width:" +
            iw +
            "px;height:" +
            ih +
            'px;"><v:fill opacity="' +
            sh * 0.5 +
            '" color="black" color2="black" o:opacity2="0" type="gradientradial" method="linear" focus="0" focussize="0.75,0.75" focusposition="0.125,0.125" on="t" /></v:oval>';
          shines =
            '<v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
            os +
            "px;width:" +
            iw +
            "px;height:" +
            ih +
            'px;"><v:fill opacity="0" color="white" color2="white" o:opacity2="' +
            sd * 0.66 +
            '" type="gradientradial" method="sigma" focus="0" focussize="0,0" focusposition="0.8,0.8" on="t" /></v:oval><v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:' +
            sz * 0.48 +
            "px;left:" +
            sz * 0.51 +
            "px;width:" +
            sz * 0.3125 +
            "px;height:" +
            sz * 0.3125 +
            'px;"><v:fill opacity="0" color="white" color2="white" o:opacity2="' +
            sd +
            '" type="gradientradial" method="sigma" focus="0" focussize="0,0" focusposition="0.5,0.5" on="t" /></v:oval><v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:' +
            sz * 0.04 +
            "px;left:" +
            sz * 0.24 +
            "px;width:" +
            sz * 0.52 +
            "px;height:" +
            sz * 0.36 +
            'px;"><v:fill opacity="0" color="white" color2="white" o:opacity2="' +
            sd +
            '" type="gradient" method="any" angle="20" focus="0" focussize="0.2,0.2" focusposition="0.4,0.4" on="t" /></v:oval>';
          border =
            '<v:oval filled="f" fillcolor="transparent" stroked="t" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
            os +
            "px;width:" +
            iw +
            "px;height:" +
            ih +
            'px;"><v:stroke weight="1" style="single" color="' +
            gc +
            '" opacity="' +
            Math.max(0.5, op) +
            '" /></v:oval>';
          shadow =
            '<v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:' +
            sz * 0.7 +
            "px;left:" +
            sz * 0.1 +
            "px;width:" +
            sz * 0.8 +
            "px;height:" +
            sz * 0.3 +
            'px;"><v:fill opacity="' +
            sh +
            '" color="' +
            (isNaN(c2) ? c2 : isNaN(c1) ? c1 : "black") +
            '" color2="black" colors="' +
            (10 - op * 10) +
            "% " +
            (isNaN(c2) ? c2 : isNaN(c1) ? c1 : "black") +
            '" o:opacity2="0" type="gradientradial" method="linear" focus="0" focussize="0,0" focusposition="0.5,0.5" on="t" /></v:oval>';
          frame =
            '<v:oval filled="t" stroked="f" strokeweight="0" style="zoom:1;margin:0;padding:0;display:block;position:absolute;top:1px;left:' +
            os +
            "px;width:" +
            iw +
            "px;height:" +
            ih +
            'px;"><v:fill opacity="' +
            op +
            '" src="' +
            canvas.source +
            '" type="frame" aspect="atleast" size="' +
            zz +
            "," +
            zz +
            '" origin="' +
            xx +
            "," +
            yy +
            '" position="0,0" /></v:oval>';
          canvas.innerHTML =
            head + shadow + fill + frame + shades + shines + border + foot;
          if (typeof window[callback] === "function") {
            window[callback](canvas.id, "cvi_sphere");
          }
        }
      } else {
        if (
          canvas.tagName.toUpperCase() == "CANVAS" &&
          canvas.getContext("2d")
        ) {
          var context = canvas.getContext("2d"),
            prepared = context.getImageData ? true : false,
            alternate = false;
          var img = new Image();
          img.onload = function () {
            if (
              prepared &&
              typeof cvi_filter != "undefined" &&
              filter != null &&
              filter.length > 0
            ) {
              iw = Math.round(iw);
              ih = Math.round(ih);
              var source = document.createElement("canvas");
              source.height = ih + 4;
              source.width = iw + 4;
              var src = source.getContext("2d");
              var buffer = document.createElement("canvas");
              buffer.height = ih;
              buffer.width = iw;
              var ctx = buffer.getContext("2d");
              if (src && ctx) {
                alternate = true;
                ctx.clearRect(0, 0, iw, ih);
                src.clearRect(0, 0, iw + 4, ih + 4);
                src.drawImage(
                  img,
                  Math.round(nx + nw * (zo * xo)),
                  Math.round(ny + nh * (zo * yo)),
                  Math.round(nw * (1 - zo)),
                  Math.round(nh * (1 - zo)),
                  0,
                  0,
                  iw + 4,
                  ih + 4
                );
                src.drawImage(
                  img,
                  Math.round(nx + nw * (zo * xo)),
                  Math.round(ny + nh * (zo * yo)),
                  Math.round(nw * (1 - zo)),
                  Math.round(nh * (1 - zo)),
                  2,
                  2,
                  iw,
                  ih
                );
                ctx.drawImage(source, 2, 2, iw, ih, 0, 0, iw, ih);
                for (var i in filter) {
                  cvi_filter.add(source, buffer, filter[i], iw, ih);
                }
              }
            }
            context.clearRect(0, 0, sz, sz);
            context.save();
            context.translate(0, sz * 0.64);
            context.scale(1, 0.425);
            st = context.createRadialGradient(os + ic, ic, 1, os + ic, ic, ic);
            st.addColorStop(0, "rgba(0,0,0," + sh + ")");
            st.addColorStop(0.8, "rgba(" + gc + "," + sh * 0.125 + ")");
            st.addColorStop(1, "rgba(" + gc + ",0)");
            context.fillStyle = st;
            if (canvas.isWK && !canvas.isS4) {
              context.fill();
            } else {
              context.fillRect(0, 0, sz, sz);
            }
            context.restore();
            context.save();
            context.beginPath();
            context.arc(os + ic, ic + lw, ic, 0, (Math.PI / 180) * 360, true);
            context.closePath();
            context.clip();
            context.clearRect(0, 0, sz, sz);
            if (isNaN(c1)) {
              if (isNaN(c2)) {
                st = context.createLinearGradient(ic, 0, ic + 3 * os, ih);
                st.addColorStop(0, c1);
                st.addColorStop(1, c2);
                context.fillStyle = st;
                if (canvas.isWK) {
                  context.fill();
                } else {
                  context.fillRect(os, 0, iw, ih);
                }
              } else {
                context.fillStyle = c1;
                context.fillRect(os, 0, iw, ih);
              }
            }
            context.globalAlpha = op;
            if (alternate) {
              context.drawImage(source, 2, 2, iw, ih, os, 0, iw, ih);
            } else {
              context.drawImage(
                img,
                nx + nw * (zo * xo),
                ny + nh * (zo * yo),
                nw * (1 - zo),
                nh * (1 - zo),
                os,
                0,
                iw,
                ih
              );
            }
            context.globalAlpha = 1.0;
            st = context.createLinearGradient(ic, 0, ic + 3 * os, ih);
            st.addColorStop(0, "rgba(0,0,0," + sh * 0.5 + ")");
            st.addColorStop(1, "rgba(0,0,0,0)");
            context.fillStyle = st;
            if (canvas.isWK) {
              context.fill();
            } else {
              context.fillRect(0, 0, sz, sz);
            }
            st = context.createRadialGradient(
              os + ic,
              ic,
              ic - 1.5 * os,
              os + ic,
              ic,
              ic
            );
            st.addColorStop(0, "rgba(0,0,0,0)");
            st.addColorStop(1, "rgba(0,0,0," + sh * 0.5 + ")");
            context.fillStyle = st;
            if (canvas.isWK) {
              context.fill();
            } else {
              context.fillRect(0, 0, sz, sz);
            }
            st = context.createRadialGradient(
              3 * os + ic,
              3.5 * os + ic,
              os * 0.5,
              2.5 * os + ic,
              3 * os + ic,
              ic - os
            );
            st.addColorStop(0, "rgba(255,255,255," + sd + ")");
            st.addColorStop(0.25, "rgba(255,255,255," + sd * 0.666666 + ")");
            st.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = st;
            if (canvas.isWK) {
              context.fill();
            } else {
              context.fillRect(0, 0, sz, sz);
            }
            context.restore();
            context.save();
            st = context.createLinearGradient(
              iw / 2 - os,
              os * 0.5,
              iw / 2 + os,
              os * 0.5 + ic
            );
            st.addColorStop(0, "rgba(255,255,255," + sd + ")");
            st.addColorStop(1, "rgba(255,255,255,0)");
            drawEllipse(
              context,
              os + ic / 2.5,
              os * 0.5,
              os + ic / 2.5 + ic * 1.2,
              os * 0.5 + ic * 0.9
            );
            context.fillStyle = st;
            context.fill();
            context.restore();
            context.save();
            context.beginPath();
            context.arc(os + ic, ic + lw, ic, 0, (Math.PI / 180) * 360, true);
            context.closePath();
            context.strokeStyle = "rgba(" + gc + "," + op + ")";
            context.lineWidth = lw;
            context.stroke();
            context.restore();
            if (typeof window[callback] === "function") {
              window[callback](canvas.id, "cvi_sphere");
            }
          };
          img.src = canvas.source;
        }
      }
      if (options["show"]) {
        canvas.style.visibility = "visible";
      }
    } catch (e) {}
  },

  replace: function (canvas) {
    var object = canvas.parentNode;
    var img = document.createElement("img");
    img.id = canvas.id;
    img.alt = canvas.alt;
    img.title = canvas.title;
    img.src = canvas.source;
    img.className = canvas.className;
    img.height = canvas.height;
    img.width = canvas.width;
    img.style.cssText = canvas.style.cssText;
    img.style.height = canvas.height + "px";
    img.style.width = canvas.width + "px";
    img.onclick = canvas.onclick;
    img.ondblclick = canvas.ondblclick;
    object.replaceChild(img, canvas);
  },

  remove: function (canvas) {
    if (
      document.all &&
      document.namespaces &&
      !window.opera &&
      (!document.documentMode || document.documentMode < 9)
    ) {
      if (canvas.tagName.toUpperCase() == "VAR") {
        cvi_sphere.replace(canvas);
      }
    } else {
      if (canvas.tagName.toUpperCase() == "CANVAS") {
        cvi_sphere.replace(canvas);
      }
    }
  },
};
