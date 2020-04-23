const getLinksArray = (resolverDocV1) =>
{
    let linksArray = [];
    const docResponses = resolverDocV1.responses;
    const itemName = resolverDocV1.item_name;
    const defLinkType = docResponses.default_linktype;
    const linkTypes = Object.keys(docResponses.linktype);
    linkTypes.forEach((linkType) =>
    {
        const defLang = docResponses.linktype[linkType].default_lang;
        const langs = Object.keys(docResponses.linktype[linkType].lang);
        langs.forEach((lang) =>
        {
            const defContext = docResponses.linktype[linkType].lang[lang].default_context;
            const contexts = Object.keys(docResponses.linktype[linkType].lang[lang].context);
            contexts.forEach((context) =>
            {
                const defMedia = docResponses.linktype[linkType].lang[lang].context[context].default_mime_type;
                const mediaTypes = Object.keys(docResponses.linktype[linkType].lang[lang].context[context].mime_type);
                mediaTypes.forEach((media) =>
                {
                    linksArray.push({'link':docResponses.linktype[linkType].lang[lang].context[context].mime_type[media].link,
                        'fwqs':docResponses.linktype[linkType].lang[lang].context[context].mime_type[media].fwqs,
                        'title':docResponses.linktype[linkType].lang[lang].context[context].mime_type[media].title,
                        'itemName':itemName,
                        'linkType':linkType,
                        'defLinkType':defLinkType,
                        'lang':lang,
                        'defLang':defLang,
                        'context':context,
                        'defContext':defContext,
                        'media':media,
                        'defMedia':defMedia});
                });
            });
        });
    });
    return linksArray;
};

const convertResolverDocV1ToV2 = (doc) =>
{
    let docV2 = {};
    Object.getOwnPropertyNames(doc).forEach((docElement) =>
    {
        if (docElement.includes("/"))
        {
            docV2[docElement] = getLinksArray(doc[docElement]);
        }
        else
        {
            docV2[docElement] = doc[docElement];
        }
    });
    return docV2;
};

module.exports.convertResolverDocV1ToV2 = convertResolverDocV1ToV2;
