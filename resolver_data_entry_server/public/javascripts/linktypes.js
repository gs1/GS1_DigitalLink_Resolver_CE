/**
 * Gets the list of LinkTypes accepted by this Resolver
 * @returns {Promise<[]>}
 */
const getLinkTypes = async () =>
{
    try
    {
        const fetchResponse = await fetch("/reference/linktypes");
        if (fetchResponse.status === 200)
        {
            return await fetchResponse.json();
        }
        else
        {
            return [];
        }
    }
    catch
    {
        return [];
    }
}


/**
 * Displays the downloaded linktypes in an HTML table
 * @param linkTypesArray
 */
const displayLinkTypesList = (linkTypesArray) =>
{
    let linkTypesTable = document.createElement('table');
    let thead = document.createElement('thead');

    let th1 = document.createElement('th');
    let th2 = document.createElement('th');
    let th3 = document.createElement('th');

    th1.scope = "col";
    th2.scope = "col";
    th3.scope = "col";

    th1.innerText = 'LinkType Title';
    th2.innerText = 'CURIE';
    th3.innerText = 'URI';

    thead.appendChild(th1);
    thead.appendChild(th2);
    thead.appendChild(th3);

    linkTypesTable.appendChild(thead);

    for (let linkType of linkTypesArray)
    {
        let row = document.createElement('tr');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        td1.innerHTML  = `<b>${linkType.title}</b>`;
        td2.innerText = linkType.curie;
        td3.innerText = linkType.url;
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        linkTypesTable.appendChild(row);

        let descRow = document.createElement('tr');
        let descTd = document.createElement('td');
        descTd.colSpan = 3;
        descTd.innerHTML = `<i>${linkType.description}</i><hr />`;
        descRow.appendChild(descTd);
        linkTypesTable.appendChild(descRow);

    }

    document.getElementById("divData").appendChild(linkTypesTable);
}

/**
 * Main function, set to run by the setTimeout timer
 * @returns {Promise<void>}
 */
const run = async () =>
{
    const linkTypesList = await getLinkTypes();
    displayLinkTypesList(linkTypesList);
}

setTimeout(run, 1000);