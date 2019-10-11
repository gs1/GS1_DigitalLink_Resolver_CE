/*

This document reuses (ahem, copies) the W3C Table of Contents styles. The code is taken from https://github.com/w3c/respec

It then does some stuff of its own:
- numbers figures
- recognises and makes links to those figures in the text
- creates sequential numbers for every paragraph (and adds an id)
- creates a toggle to show/hide those numbers

*/

// The initial code blocks are copied from respec
// Begin by working out the numbers and then calling the function actually write the ToC line. We'll only go to h3.
// Note that the numbers in the headings themselves are added using CSS, not this script.
var s = document.getElementsByTagName('section');
var toc = [];

var m = document.getElementsByTagName('main');
var topLevel = m[0].childNodes;
var h2 = 0;
var h3 = 0;
for (var i = 0; i < topLevel.length; i++) {
  if (topLevel[i].nodeName.toLowerCase() == 'section') {
    var c = topLevel[i].childNodes;
    for (var j = 0; j < c.length; j++) {
      if (c[j].nodeName.toLowerCase() == 'h2') { // We have a top level heading
        h2++;
        writeTocLine(1, c[j], h2, topLevel[i].id);
        h3 = 0;
      } else if (c[j].nodeName.toLowerCase() == 'section') { // We have a sub section
        var sub = c[j].childNodes;
        for (var k = 0; k < sub.length; k++) {
          if (sub[k].nodeName.toLowerCase() == 'h3') { //we have a level 2 heading
            h3++;
            var secno = h2 + '.' + h3;
            writeTocLine(2, sub[k], secno, c[j].id);
          }
        }
      }
    }
  }
}

// Generate the ToC
var tableOfContents = document.getElementById('toc');
var topOl = document.createElement('ol');
topOl.className='toc';
topOl.role='directory';
var ol = topOl;
for (var i = 0; i < toc.length; i++) {
  var li = document.createElement('li');
  li.className = 'tocline';
  var a = document.createElement('a');
  a.href = '#' + toc[i].id;
  a.className = 'tocxref';
  var span = document.createElement('span');
  span.className = 'secno';
  var sn = document.createTextNode(toc[i].secno);
  var title = document.createTextNode(toc[i].title);
  span.appendChild(sn);
  a.appendChild(span);
  a.appendChild(title);
  li.appendChild(a);
  if ((i+1 < toc.length) && (toc[i+1].level > toc[i].level)) {  // Need to set up a new ol
    ol.appendChild(li);
    ol = document.createElement('ol');
    ol.className = 'toc';
    li.appendChild(ol);
  } else if ((i+1 < toc.length) && (toc[i+1].level == toc[i].level)) {  // Stick with current ol
    ol.appendChild(li);
  } else { // Need to go back to the top
    ol.appendChild(li);
    ol = topOl;
  }
}
tableOfContents.appendChild(topOl);
// End copied code.


// Other functions at set up (these all created by Phil Archer, not W3C).
numberFigures();
writeLineNo();
setExternalLinks();

// End initialisation

// Supporting functions

function tocLine(level, title, secno, id) {
  this.level = level;
  this.title = title;
  this.secno = secno;
  this.id = id;
  return(this);
}

function writeTocLine(level,e,h,id) {
  var t = new tocLine(level,e.innerHTML,h,id);
  toc.push(t);
}

function numberFigures() { // (numbers all the figures. Inserts number before whatever is given as the caption)
  var f = document.getElementsByTagName('figure');
  for (var i = 0; i < f.length; i++) {
    var c = f[i].childNodes;
    for (var j = 0; j < c.length; j++) {
      if (c[j].nodeName.toLowerCase() == 'figcaption') {
        var caption = c[j].innerHTML;
        c[j].innerHTML = '';
        var s = document.createElement('span');
        s.classname = 'figNo';
        s.title = f[i].id;
        var figNo = i + 1;
        var t = document.createTextNode('Fig. ' + figNo.toString() + ' ');
        s.appendChild(t)
        c[j].appendChild(s);
        c[j].innerHTML += caption;
        writeFigRefs(figNo, f[i].id); // Calls function to write in the fig refs
      }
    }
  }
}

function writeFigRefs(figNo, id) { // Searches all paragraphs for references to figures and inserts accordingly.
  var re = new RegExp('\\[' + id + '\\]', 'g');
  var p = document.getElementsByTagName('p');
  for (var i = 0; i < p.length; i++) {
    if ((p[i].innerHTML.indexOf('[') != -1) && (p[i].innerHTML.search(re) != -1)) {
      p[i].innerHTML = p[i].innerHTML.replace(re, '<a href="#' + id + '">Fig. ' + figNo + '</a>');
    }
  }
}

function toggleLN() {
  var flag = document.getElementById('lineNoToggle').checked; // A boolean
  var s = document.getElementsByClassName('lineNo');
  for (var i = 0; i < s.length; i++) {
    s[i].className = flag ? 'lineNo' : 'lineNo lineNoHide';
  }
}


function writeLineNo() { // Sticks a sequential number in front of every paragraph and creates an anchor point.
  var lineNo = 1;
  var s = document.getElementsByTagName('section');
  for (var i = 0; i < s.length; i++) {
    var p = s[i].childNodes
    for (var j = 0; j < p.length; j++) {
      if (p[j].nodeName.toLowerCase() == 'p') {
        var id = 'line' + lineNo;
        p[j].innerHTML = '<span class="lineNo lineNoHide" id="' + id + '">' + lineNo + '</span>' + p[j].innerHTML;
        lineNo++;
      }
    }
  }

  // Now create the "show line numbers" checkbox immediately above the title. This assumes that the <header id="header" /> and
  // <h2 id="title" /> elements exist. Should probably code around their non-existence.

  var toggle = document.createElement('p');
  toggle.id = 'lineNoToggleP';
  var label = document.createElement('label');
  label.for = 'lineNoToggle';
  var t = document.createTextNode('Show line numbers');
  var input = document.createElement('input');
  input.id = 'lineNoToggle';
  input.type = 'checkbox';
  input.addEventListener("click", toggleLN, false);
  label.appendChild(t);
  toggle.appendChild(label);
  toggle.appendChild(input);
  var header = document.getElementById('header');
  var title = document.getElementById('title');
  header.insertBefore(toggle, title);

}

function setExternalLinks() { // hyperlinks with class="extnnal" get the Wikipedia external link icon and are set to spawn another window
  var a = document.getElementsByTagName('a');
  for (var i = 0; i < a.length; i++) {
    if (a[i].className.indexOf('external') != -1) {
      a[i].title = 'Opens in a new tab';
      a[i].target = '_blank';
    }
  }
}
