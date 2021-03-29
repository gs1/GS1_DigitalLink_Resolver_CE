/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
// The linksetViz function takes two arguments:
// 1. The linkset object
// 2. The element to which the visualization is to be appended
//
// Please note that this script does NOT constitute a validator for a linkset. That said, it does try to make minimal assumptions.

// We need a couple of constants
const RabinRegEx = /^((https?):)(\/\/((([^\/?#]*)@)?([^\/?#:]*)(:([^\/?#]*))?))?([^?#]*)(\?([^#]*))?(#(.*))?/;
const metaElementClass = 'metaElement';
const metaTitleClass = 'metaTitle'; // Used in CSS rules
const metaValueClass = 'metaValue'; // Used in CSS rules
const toTitleClass = 'toTitle';

function linksetViz(lsIn, displayElement) {
  // Let's start by clearing the content of the display element
  displayElement.innerHTML = null;
  if (typeof lsIn.linkset === 'object') {
    // If this isn't true, we don't have a linkset
    const { linkset } = lsIn; // So we're only looking at the linkset element within the object we were passed.
    // A linkset is an array of objects
    // Any objects can be included (e.g. as metadata) but the ones we're interested in are 'link context objects'
    // Each link context object MUST have an "anchor" member with a value that represents the link context.
    for (const context in linkset) {
      if (linkset[context].anchor !== undefined) {
        // We have a linkset that we'll present in an HTML section
        const section = document.createElement('section');
        section.classList.add('lsSection');
        // Let's record the anchor
        const sectionHead = document.createElement('h2');
        sectionHead.classList.add('lsSectionHead');
        let titleSpan = document.createElement('span');
        titleSpan.className = metaTitleClass;
        titleSpan.appendChild(document.createTextNode('GS1 Digital Link URI: '));
        sectionHead.appendChild(titleSpan);
        let valueSpan = document.createElement('span');
        valueSpan.className = metaValueClass;
        valueSpan.appendChild(document.createTextNode(linkset[context].anchor));
        sectionHead.appendChild(valueSpan);
        section.appendChild(sectionHead);

        // And output any other info
        // The GS1 resolver provides an item description

        if (linkset[context].itemDescription !== undefined) {
          const p = document.createElement('p');
          p.className = metaElementClass;
          p.classList.add('itemDescription');
          titleSpan = document.createElement('span');
          titleSpan.className = metaTitleClass;
          titleSpan.appendChild(document.createTextNode('Item: '));
          p.appendChild(titleSpan);
          valueSpan = document.createElement('span');
          valueSpan.className = metaValueClass;
          valueSpan.appendChild(document.createTextNode(linkset[context].itemDescription));
          p.appendChild(valueSpan);
          section.appendChild(p);
        }

        // GS1 also provides a timestamp for the record that we can show
        if (linkset[context].unixtime !== undefined) {
          const p = document.createElement('p');
          p.className = metaElementClass;
          p.classList.add('lastModified');
          titleSpan = document.createElement('span');
          titleSpan.className = metaTitleClass;
          titleSpan.appendChild(document.createTextNode('Last modified: '));
          p.appendChild(titleSpan);
          valueSpan = document.createElement('span');
          valueSpan.className = metaValueClass;
          const d = new Date(linkset[context].unixtime * 1000);
          valueSpan.appendChild(document.createTextNode(d.toISOString().replace('.000Z', 'Z')));
          p.appendChild(valueSpan);
          section.appendChild(p);
        }

        // Now we want to work through all the link types and display the links
        // So we'll loop through link context and look for URLs
        // Each link type will be a dt, and we'll make things below it dds.

        const dl = document.createElement('dl');
        dl.classList.add('linkList');

        for (linkType in linkset[context]) {
          // Ignore anythig that isn't a URL
          if (RabinRegEx.test(linkType)) {
            const dt = document.createElement('dt');
            dt.className = 'linkType';
            let a = document.createElement('a');
            a.href = linkType;
            a.appendChild(document.createTextNode(linkType));
            dt.appendChild(a);
            dl.appendChild(dt);

            // The value should be an array of link objects (even if there's only one)
            for (lo in linkset[context][linkType]) {
              // Let's simplify this a little
              const linkObject = linkset[context][linkType][lo];

              // Now we work through the various elements within the link object, starting with the href
              let dd = document.createElement('dd');
              dd.className = 'href';
              let span = document.createElement('span');
              span.className = toTitleClass;
              span.appendChild(document.createTextNode('Target URL: '));
              dd.appendChild(span);
              if (linkObject.href !== undefined) {
                // If this fails, there's something really quite wrong, as there is no link
                a = document.createElement('a');
                a.href = linkObject.href;
                a.appendChild(document.createTextNode(linkObject.href));
                dd.appendChild(a);
              } else {
                dd.appendChild(document.createTextNode('Error! There should be a link here.'));
                dd.classList.add('error');
              }
              dl.appendChild(dd);

              // Move on to the title

              dd = document.createElement('dd');
              dd.className = 'title';
              span = document.createElement('span');
              span.className = toTitleClass;
              span.appendChild(document.createTextNode('Title: '));
              dd.appendChild(span);
              if (linkObject.title !== undefined) {
                // We have a simple title
                dd.appendChild(document.createTextNode(linkObject.title));
              } else if (linkObject['title*'] !== undefined) {
                // We have a complex title
                let titleString = '';
                for (const i in linkObject['title*']) {
                  titleString += `${linkObject['title*'][i].value} (${linkObject['title*'][i].language}); `;
                }
                titleString = titleString.substring(0, titleString.lastIndexOf(';'));
                dd.appendChild(document.createTextNode(titleString));
              } else {
                dd.classList.add('error');
                dd.appendChild(document.createTextNode('Error! There should be a title here.'));
              }
              dl.appendChild(dd);

              // Move on to language(s)

              if (linkObject.hreflang !== undefined) {
                // We should have an array of one or more languages to display
                dd = document.createElement('dd');
                dd.className = 'hreflang';
                span = document.createElement('span');
                span.className = toTitleClass;
                span.appendChild(document.createTextNode('Language: '));
                dd.appendChild(span);
                if (typeof linkObject.hreflang === 'object' && linkObject.hreflang[0] !== undefined) {
                  // Hooray, we have an array of languages
                  let langString = '';
                  for (i in linkObject.hreflang) {
                    langString += `${linkObject.hreflang[i]}, `;
                  }
                  langString = langString.substring(0, langString.lastIndexOf(','));
                  dd.appendChild(document.createTextNode(langString));
                } else {
                  dd.appendChild(document.createTextNode('Error! Was expecting an array of languages'));
                  dd.classList.add('error');
                }
                dl.appendChild(dd);
              }

              // Media type
              if (linkObject.type !== undefined && linkObject.type !== '') {
                // We have a media type.
                dd = document.createElement('dd');
                dd.className = 'mediaType';
                span = document.createElement('span');
                span.className = toTitleClass;
                span.appendChild(document.createTextNode('Media type: '));
                dd.appendChild(span);
                dd.appendChild(document.createTextNode(linkObject.type));
                dl.appendChild(dd);
              }

              // Context
              if (linkObject.context !== undefined && linkObject.context !== '') {
                // We have a context.
                dd = document.createElement('dd');
                dd.className = 'context';
                span = document.createElement('span');
                span.className = toTitleClass;
                span.appendChild(document.createTextNode('Context: '));
                dd.appendChild(span);
                dd.appendChild(document.createTextNode(linkObject.context));
                dl.appendChild(dd);
              }

              // Forward Query String
              if (linkObject.fwqs !== undefined && (linkObject.fwqs === true || linkObject.fwqs === false)) {
                // We have a fwqs flag.
                dd = document.createElement('dd');
                dd.className = 'fwqs';
                span = document.createElement('span');
                span.className = toTitleClass;
                span.appendChild(document.createTextNode('Forward query: '));
                dd.appendChild(span);
                dd.appendChild(document.createTextNode(linkObject.fwqs));
                dl.appendChild(dd);
              }
            }
          }
        }
        section.appendChild(dl);
        displayElement.appendChild(section);
      } else {
        console.log('No anchor here');
      }
    }
  } else {
    const p = document.createElement('p');
    p.className = 'error';
    p.appendChild(document.createTextNode('Object cannot be parsed as a linkset'));
    displayElement.appendChild(p);
  }
}
