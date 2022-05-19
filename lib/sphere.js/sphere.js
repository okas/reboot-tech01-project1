/**
 * sphere.js 1.3 (10-Aug-2010) (c) by Christian Effenberger
 * All Rights Reserved. Source: sphere.netzgesta.de
 * Distributed under Netzgestade Non-commercial Software License Agreement.
 * This license permits free of charge use on non-commercial
 * and private web sites only under special conditions.
 * Read more at... http://www.netzgesta.de/cvi/LICENSE.html
 **/

function cviErrorLog(value) {
  if (window.console) {
    window.console.log(value);
  } else if (window.opera) {
    opera.postError(value);
  } else {
    window.document.title = value;
  }
}

function getImages(className) {
  var children = document.getElementsByTagName("img");
  var elements = new Array();
  var i = 0;
  var child;
  var classNames;
  var j = 0;
  for (i = 0; i < children.length; i++) {
    child = children[i];
    classNames = child.className.split(" ");
    for (var j = 0; j < classNames.length; j++) {
      if (classNames[j] == className) {
        elements.push(child);
        break;
      }
    }
  }
  return elements;
}

function getClasses(classes, string) {
  var temp = "";
  for (var j = 0; j < classes.length; j++) {
    if (classes[j] != string) {
      if (temp) {
        temp += " ";
      }
      temp += classes[j];
    }
  }
  return temp;
}

function getClassValue(classes, string) {
  var temp = 0;
  var pos = string.length;
  for (var j = 0; j < classes.length; j++) {
    if (classes[j].indexOf(string) == 0) {
      temp = Math.min(classes[j].substring(pos), 100);
      break;
    }
  }
  return Math.max(0, temp);
}

function getClassLimit(classes, string, def, min, max) {
  var temp = def;
  var pos = string.length;
  for (var j = 0; j < classes.length; j++) {
    if (classes[j].indexOf(string) == 0) {
      temp = parseInt(classes[j].substring(pos));
      break;
    }
  }
  return Math.min(Math.max(temp, min), max);
}

function getClassColor(classes, string) {
  var temp = 0;
  var str = "";
  var pos = string.length;
  for (var j = 0; j < classes.length; j++) {
    if (classes[j].indexOf(string) == 0) {
      temp = classes[j].substring(pos);
      str = "#" + temp.toLowerCase();
      break;
    }
  }
  if (str.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)) {
    return str;
  } else {
    return 0;
  }
}

function addSphere() {
  var cc = document.createElement("canvas");
  if (
    cc.getContext ||
    (document.all &&
      document.namespaces &&
      !window.opera &&
      (!document.documentMode || document.documentMode < 9))
  ) {
    if (typeof cvi_sphere != "undefined") {
      var i,
        cl = "",
        sz,
        st,
        zo,
        op,
        sh,
        sd,
        c1,
        c2,
        img = getImages("sphere");
      for (i = 0; i < img.length; i++) {
        if (img[i].width >= 32 || img[i].height >= 32) {
          sz = 0;
          st = 50;
          zo = 100;
          op = 100;
          sh = 100;
          sd = 100;
          c2 = 0;
          c1 = 0;
          cl = img[i].className.split(" ");
          sz = getClassValue(cl, "isize");
          zo = getClassLimit(cl, "izoom", 100, 100, 200);
          st = getClassLimit(cl, "ishift", 50, 0, 100);
          op = getClassValue(cl, "ialpha");
          sh = getClassValue(cl, "ishade");
          sd = getClassValue(cl, "ishine");
          c1 = getClassColor(cl, "icolor");
          c2 = getClassColor(cl, "igradient");
          cvi_sphere.add(img[i], {
            size: sz,
            zoom: zo,
            shift: st,
            alpha: op,
            shade: sh,
            shine: sd,
            color: c1,
            color2: c2,
            show: true,
          });
        }
      }
    } else {
      cviErrorLog('Error (missing library): "cvi_sphere_lib.js" is required!');
    }
  }
}

//var sphereOnload = window.onload;
//window.onload = function () { if(sphereOnload) sphereOnload(); addSphere();}

if (window.addEventListener) window.addEventListener("load", addSphere, false);
else window.attachEvent("onload", addSphere);
