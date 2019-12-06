//constant values which can be altered to suit any particular implementation
const welcome_message = "Welcome to the GS1 Resolver Data Entry Application";
const api_url = "/api/api.php";

//page variables available to all functions
let page_resolverEndpointURL = "";
let page_linkTypesList = null;
let page_ContextsList = null;
let page_MimeTypesList = null;
let page_GS1KeyCodesList = null;
let page_componentsList = null;
let page_ianaLanguagesList = null;
let page_unsaved_changes = false;
let page_active_A_suspended_S = "S"; //just an initialising value until the actual record is loaded.
let page_session = null;
let page_firstLineNumber = 0;
let page_maxNumberOfLines = 20;

class GS1URI_DASHBOARD
{
    static GetGS1KeyCodesList()
    {
        let jsonGS1KeyCodesListFromStorage = sessionStorage.getItem("gs1_key_codes");
        if (jsonGS1KeyCodesListFromStorage !== null)
        {
            page_GS1KeyCodesList = JSON.parse(jsonGS1KeyCodesListFromStorage);
            if (!Array.isArray(page_GS1KeyCodesList))
            {
                page_GS1KeyCodesList = page_GS1KeyCodesList.data_list;
            }
            GS1URI_DASHBOARD.PopulateGS1KeyCodesListSelectControl()
        }
        else
        {
            let apiRequest = {
                command: "get_gs1_key_codes_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_DASHBOARD.GetGS1KeyCodesList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static GetGS1KeyCodesList_Response(evt)
    {
        sessionStorage.setItem("gs1_key_codes", evt.target.responseText);
        let gs1KeyCodesObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_GS1KeyCodesList = gs1KeyCodesObj.data_list;
        GS1URI_DASHBOARD.PopulateGS1KeyCodesListSelectControl()
    }


    static PopulateGS1KeyCodesListSelectControl()
    {
        let selectSearchGS1KeyCode = document.getElementById("select_search_gs1_key_code");

        // delete existing SELECT options if they are there
        while (selectSearchGS1KeyCode.firstChild)
        {
            selectSearchGS1KeyCode.removeChild(selectSearchGS1KeyCode.firstChild);
        }

        //Start with an 'ANY' option
        let thisOption = document.createElement("option");
        thisOption.value = "Search all GS1 Key Codes";
        thisOption.label = "Search all GS1 Key Codes";
        thisOption.text = "Search all GS1 Key Codes";
        selectSearchGS1KeyCode.appendChild(thisOption);

        //Add in the new SELECT options in the correct order (that has been decided by the API)
        page_GS1KeyCodesList.forEach(
            function (obj)
            {
                let thisOption = document.createElement("option");
                thisOption.value = obj.gs1_key_code;
                thisOption.label = obj.code_name;
                thisOption.text = obj.gs1_key_code;
                selectSearchGS1KeyCode.appendChild(thisOption);
            });
    }

    static ShowInfoInHeader()
    {
        let h3CompanyHeader = document.getElementById("h3_company_header");
        h3CompanyHeader.innerHTML = "Resolver Dashboard - ";
        h3CompanyHeader.innerHTML += page_session.firstname + "&nbsp;" + page_session.surname + "&nbsp;-&nbsp;";
        h3CompanyHeader.innerHTML += page_session.member_name;

        if (page_session.member_logo_url !== "X")
        {
            let imgCompanyLogo = document.getElementById("img_company_logo");
            imgCompanyLogo.src = page_session.member_logo_url;
            imgCompanyLogo.alt = "Logo for " + page_session.member_name;
        }
    }


    static NewURIRequest()
    {
        let fd = new FormData();
        let apiRequest = {
            command: "new_uri_request",
            session_id: page_session.session_id
        };
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_DASHBOARD.NewURIRequest_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static NewURIRequest_Response(evt)
    {
        let result = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let newURIRequestID = result.new_uri_request_id;
        window.location.href = "edituri.html?uri=" + newURIRequestID;
    }


    static GetURIList()
    {
        document.getElementById("wait_animation").style.visibility = "visible";
        let fd = new FormData();
        let apiRequest = {
            command: "get_uri_list",
            session_id: page_session.session_id,
            first_line_number: page_firstLineNumber,
            max_number_of_lines: page_maxNumberOfLines
        };
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_DASHBOARD.GetURIList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static GetURIList_Response(evt)
    {
        document.getElementById("wait_animation").style.visibility = "hidden";
        let uriList = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let tableURIList = document.getElementById("table_uri_list");
        tableURIList.innerHTML = "<tr><th>GS1 Key Code</th><th>GS1 Key Value</th><th>Item Description</th><th>Date/Times</th><th>status</th><th>task</th></tr>";

        uriList.forEach(
            function (uriListEntry)
            {
                let tr = document.createElement("tr");

                let tdGS1KeyCode = document.createElement("td");
                tdGS1KeyCode.innerText = uriListEntry.gs1_key_code;
                tr.appendChild(tdGS1KeyCode);

                let tdGS1KeyValue = document.createElement("td");
                tdGS1KeyValue.innerText = uriListEntry.gs1_key_value;
                tr.appendChild(tdGS1KeyValue);

                let tdItemDescription = document.createElement("td");
                tdItemDescription.innerText = uriListEntry.item_description;
                tr.appendChild(tdItemDescription);

                let tdDates = document.createElement("td");
                tdDates.innerHTML = "C: " + uriListEntry.date_inserted + "<br />U: " + uriListEntry.date_last_updated;
                tr.appendChild(tdDates);

                let tdActive = document.createElement("td");
                if(uriListEntry.flagged_for_deletion === 1)
                {
                    tdActive.innerText = "Deleted";
                }
                else if (uriListEntry.active === 1)
                {
                    if (uriListEntry.api_builder_processed === 0)
                    {
                        tdActive.innerText = "Activating";
                    }
                    else
                    {
                        tdActive.innerText = "Active";
                    }
                }
                else
                {
                    if (uriListEntry.api_builder_processed === 0)
                    {
                        tdActive.innerText = "Suspending";
                    }
                    else
                    {
                        tdActive.innerText = "Suspended";
                    }
                }
                tr.appendChild(tdActive);

                let tdEdit = document.createElement("td");

                //DEPRECATED: Simple mechanism to prevent two or more people saving the same record
                //            unless 120 seconds have passed since the previous update.
                //let currentDate = new Date();
                //let lastEditDate = new Date(uriListEntry.date_last_updated);
                //let secondsSinceLastEdit = (currentDate.getTime() - lastEditDate.getTime()) / 1000;
                //if (secondsSinceLastEdit < 120)
                //{
                //    tdEdit.innerHTML = "<i>Being edited</i>";
                //}
                //else
                //{
                tdEdit.innerHTML = "<a href=\"edituri.html?uri=" + uriListEntry.uri_request_id + "\">EDIT</a>";
                //}
                tr.appendChild(tdEdit);

                tableURIList.appendChild(tr);
            });
    }

    static GetPreviousListGroup()
    {
        if (page_firstLineNumber >= page_maxNumberOfLines)
        {
            page_firstLineNumber = page_firstLineNumber - page_maxNumberOfLines;
            GS1URI_DASHBOARD.GetURIList();
        }
    }

    static GetNextListGroup()
    {
        page_firstLineNumber = page_firstLineNumber + page_maxNumberOfLines;
        GS1URI_DASHBOARD.GetURIList();
    }


    static Search()
    {
        document.getElementById("wait_animation").style.visibility = "visible";
        let apiRequest = {
            command: "search_uri_requests",
            session_id: page_session.session_id,
            gs1_key_code: document.getElementById("select_search_gs1_key_code").value,
            gs1_key_value: document.getElementById("text_search_gs1_key_value").value
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_DASHBOARD.GetURIList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static ClearSearchBoxesAndRestoreDefaultResults()
    {
        document.getElementById("text_search_gs1_key_value").value = "";
        GS1URI_DASHBOARD.GetURIList();
    }

}


class GS1URI_ADMIN
{
    static GetAdminData()
    {
        let dataType = GS1URI_COMMON.getQueryStringValue('data');
        let h3_admin_header = document.getElementById('h3_admin_header');

        if (dataType === "keys")
        {
            GS1URI_ADMIN.GetAdminList('get_gs1_key_codes_list');
            h3_admin_header.innerText = "GS1 Key Codes";
        }
        else if (dataType === "attr")
        {
            GS1URI_ADMIN.GetAdminList('get_linktypes_list');
            h3_admin_header.innerText = "Link Types";
        }
        else if (dataType === "acc5")
        {
            GS1URI_ADMIN.GetAdminList('get_accounts_list');
            h3_admin_header.innerText = "Accounts";
        }
        else if (dataType === "comp")
        {
            GS1URI_ADMIN.GetAdminList('get_gs1_key_components_list');
            h3_admin_header.innerText = "GS1 Key Components";
        }
        else if (dataType === "cnxt")
        {
            GS1URI_ADMIN.GetAdminList('get_contexts_list');
            h3_admin_header.innerText = "Contexts List";
        }
        else if (dataType === "mime")
        {
            GS1URI_ADMIN.GetAdminList('get_mime_types_list');
            h3_admin_header.innerText = "MIME Types";
        }


    }


    static GetAdminList(dataListName)
    {
        let apiRequest = {};
        apiRequest.command = dataListName;
        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ADMIN.GetAdminList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static GetAdminList_Response(evt)
    {
        page_GS1KeyCodesList = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        GS1URI_ADMIN.DisplayData(page_GS1KeyCodesList);
    }

    static DisplayData(listObj)
    {
        let headerFlag = true;
        let keyNames = {};
        let table_admin = document.getElementById('table_admin');

        let trNewRow = document.createElement("tr");

        //Create a single header row for the table, and also a single new row to insert fresh data
        listObj.data_list.forEach(
            function (item)
            {
                if (headerFlag)
                {
                    //Display key names as header row
                    let trItemLine = document.createElement('tr');
                    Object.keys(item)
                        .forEach(function (key)
                        {
                            if (item.hasOwnProperty(key))
                            {
                                let thPropItem = document.createElement('th');
                                thPropItem.innerText = key;
                                trItemLine.appendChild(thPropItem);

                                let tdNewColumn = document.createElement("td");
                                if (key === listObj.primary_key.key_name)
                                {
                                    tdNewColumn.innerText = "NEW Item";
                                }
                                else
                                {
                                    let textNewColumn = document.createElement("input");
                                    textNewColumn.type = "text";
                                    textNewColumn.id = key + "_NEW";
                                    tdNewColumn.appendChild(textNewColumn);
                                }
                                trNewRow.appendChild(tdNewColumn);

                                keyNames[key] = ""; //This will be sent to update function by update button so we know
                                                    // what the column names are called for update.
                            }
                        });
                    table_admin.appendChild(trItemLine);

                    //Create a 'NEW' button for use in the New row.
                    let tdNewButton = document.createElement("td");
                    let buttonNew = document.createElement("button");
                    buttonNew.value = "NEW";
                    buttonNew.innerText = "NEW";
                    buttonNew.setAttribute("onclick", "GS1URI_ADMIN.UpdateList('NEW', '" + JSON.stringify(keyNames) + "', '" + listObj.api_update_command + "')");

                    tdNewButton.appendChild(buttonNew);
                    trNewRow.appendChild(tdNewButton);
                    //This new row will be added at the very end of this function, thus to the bottom of the table.


                    headerFlag = false;
                }

                let trItemLine = document.createElement('tr');
                let primaryKeyId = null;

                Object.keys(item)
                    .forEach(function (key)
                    {
                        if (item.hasOwnProperty(key))
                        {
                            let tdPropItem = document.createElement('td');
                            let fieldUpdateable = true;

                            //Primary keys cannot be edited as they will wreck the database otherwise!
                            //The API will prevent this happening anyway, so the client is just enforcing it
                            //by not creating a text box with which to edit it!
                            if (key === listObj.primary_key.key_name)
                            {
                                primaryKeyId = item[key];
                                fieldUpdateable = false;
                            }

                            if (fieldUpdateable)
                            {
                                if (key.includes("flag"))
                                {
                                    //This is a 1 or 0 value flag variable, so we'll use a radio button instead
                                    let radioPropItem = document.createElement('input');
                                    radioPropItem.type = "checkbox";
                                    radioPropItem.name = "flag_radio_group";
                                    radioPropItem.id = key + "_" + primaryKeyId;
                                    if (item[key] === 1)
                                    {
                                        radioPropItem.checked = true;
                                    }
                                    else
                                    {
                                        radioPropItem.checked = false;
                                    }
                                    tdPropItem.appendChild(radioPropItem);
                                }
                                else
                                {
                                    let textPropItem = document.createElement('input');
                                    textPropItem.type = "text";
                                    textPropItem.id = key + "_" + primaryKeyId;
                                    textPropItem.value = item[key];
                                    tdPropItem.appendChild(textPropItem);
                                }
                            }
                            else
                            {
                                //Otherwise just display primary key value (read-only):
                                tdPropItem.innerText = item[key];
                            }

                            trItemLine.appendChild(tdPropItem);
                        }
                    });
                //Finally an update button
                let buttonUpdate = document.createElement('button');
                buttonUpdate.value = "Update";
                buttonUpdate.innerText = "Update";
                buttonUpdate.setAttribute("onclick", "GS1URI_ADMIN.UpdateList('" + primaryKeyId + "', '" + JSON.stringify(keyNames) + "', '" + listObj.api_update_command + "')");
                let tdButton = document.createElement("td");
                tdButton.appendChild(buttonUpdate);
                trItemLine.appendChild(tdButton);

                //Add the newly created row to the table
                table_admin.appendChild(trItemLine);
            }
        );

        //Finally add the new row to the botom of the table
        table_admin.appendChild(trNewRow);

    }

    //This function appears unused but is actually used programmatically as its name
    //is added to an attribute of a button in the function GS1URI_ADMIN.DisplayData()
    static UpdateList(primaryKeyValue, jsonKeyNames, apiUpdateCommand)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            command: apiUpdateCommand,
            primary_key_value: primaryKeyValue
        };

        let keyNames = JSON.parse(jsonKeyNames);
        Object.keys(keyNames)
            .forEach(function (keyName)
            {
                if (keyNames.hasOwnProperty(keyName))
                {
                    try
                    {
                        let textObjectName = keyName + "_" + primaryKeyValue;
                        if (textObjectName.includes("flag"))
                        {
                            if (document.getElementById(textObjectName).checked)
                            {
                                apiCommand[keyName] = 1;
                            }
                            else
                            {
                                apiCommand[keyName] = 0;
                            }
                        }
                        else
                        {
                            apiCommand[keyName] = document.getElementById(textObjectName).value;
                        }
                    }
                    catch (err)
                    {
                        //do nothing
                    }
                }
            });

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ADMIN.UpdateList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static UpdateList_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerText = serviceResponse.STATUS;
        if (serviceResponse.STATUS.toUpperCase()
            .includes("INSERTED"))
        {
            //Clear the table then rebuild it to show the new inserted row:
            document.getElementById("table_admin").innerHTML = null;
            GS1URI_ADMIN.GetAdminData();
        }
    }

    static BackToMainMenu()
    {
        //Clears any attributes and GS1 key codes from session storage so that they will be
        //reloaded woth any changes from this admin screen.
        sessionStorage.removeItem("linktypes");
        sessionStorage.removeItem("gs1_key_code");
        window.history.go(-1);
    }


}


class GS1URI_HOMEPAGE
{
    static Login()
    {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        let fd = new FormData();
        let apiRequest = {
            command: "login",
            email: email,
            password: password
        };
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_HOMEPAGE.Login_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
        document.getElementById("wait_animation").style.visibility = "visible";
    }


    static Login_Response(evt)
    {
        document.getElementById("wait_animation").style.visibility = "hidden";
        let accountSession = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let td_message_text = document.getElementById("td_message");
        if (accountSession.session_id === "LOGIN FAILED")
        {
            td_message_text.innerHTML = "Sorry, we could not log you in.<br />Please check your account details and try again";
        }
        else if (accountSession.session_id === "DB CONN FAILED")
        {
            td_message_text.innerHTML = "Sorry, we can't get a connection to the SQL database at this time.<br />Please try again later or contact your administrator for this service";
        }
        else if (accountSession.firstname === undefined)
        {
            td_message_text.innerHTML = "Sorry, we could not log you in.<br />Please check your account details and try again";
        }
        else
        {
            td_message_text.innerHTML = "<b>Welcome, " + accountSession.firstname + " " + accountSession.surname + "</b>";
            td_message_text.innerHTML += "<br />You last logged into this system at " + accountSession.last_login_datetime;
            sessionStorage.setItem("session", JSON.stringify(accountSession));
            page_resolverEndpointURL = accountSession.resolver_endpoint_url;
            GS1URI_HOMEPAGE.SetUpMenu(accountSession);
        }
    }

    static SetUpMenu(accountSession)
    {
        //First let's lose the login details:
        let tablelogin = document.getElementById("table_login");
        tablelogin.innerHTML = "";


        let tableMenu = document.getElementById("table_menu");
        tableMenu.innerHTML = '<tr><td style="background-color: #f26334; color: white">MAIN MENU</td></tr>';

        //Link to the product dashboard
        let tr0 = document.createElement("tr");
        let td0 = document.createElement("td");
        td0.innerHTML = '<A HREF="dashboard.html">Product Dashboard</A>';
        tr0.appendChild(td0);
        tableMenu.appendChild(tr0);


        //if global administrator, list the global code categories. Note that the server will
        //actually check the admin level to see if the user can view or change data. Hacking this
        //code to make unauthorised menu options appear is thusly futile!
        if (accountSession.administrator === "G")
        {
            let tr1 = document.createElement("tr");
            let td1 = document.createElement("td");
            td1.innerHTML = '<A HREF="admin.html?data=keys">Edit Global GS1 Key Codes</A>';
            tr1.appendChild(td1);
            tableMenu.appendChild(tr1);

            let tr2 = document.createElement("tr");
            let td2 = document.createElement("td");
            td2.innerHTML = '<A HREF="admin.html?data=comp">Edit Global GS1 Key Code Components</A>';
            tr2.appendChild(td2);
            tableMenu.appendChild(tr2);

            let tr3 = document.createElement("tr");
            let td3 = document.createElement("td");
            td3.innerHTML = '<A HREF="admin.html?data=attr">Edit Global Destination Linktypes</A>';
            tr3.appendChild(td3);
            tableMenu.appendChild(tr3);

            let tr4 = document.createElement("tr");
            let td4 = document.createElement("td");
            td4.innerHTML = '<A HREF="admin.html?data=cnxt">Edit Contexts</A>';
            tr4.appendChild(td4);
            tableMenu.appendChild(tr4);

            let tr5 = document.createElement("tr");
            let td5 = document.createElement("td");
            td5.innerHTML = '<A HREF="admin.html?data=mime">Edit MIME Types</A>';
            tr5.appendChild(td5);
            tableMenu.appendChild(tr5);
        }

        //This code sets up the link to accounts and describes the scope of the user's privilege.
        //Note that all privileges are checked by the service API so don't waste time hacking this code!
        let tr4 = document.createElement("tr");
        let td4 = document.createElement("td");
        if (accountSession.administrator === "N")
        {
            td4.innerHTML = '<A HREF="accounts.html">Edit Your Account</A>';
        }
        else if (accountSession.administrator === "M")
        {
            td4.innerHTML = '<A HREF="accounts.html">Edit Your Account, and Administrate accounts for your organisation</A>';
        }
        else if (accountSession.administrator === "O")
        {
            td4.innerHTML = '<A HREF="accounts.html">Edit Your Account, and Administrate accounts for your members</A>';
        }
        else if (accountSession.administrator === "G")
        {
            td4.innerHTML = '<A HREF="accounts.html">Edit Your Account, and Administrate accounts for MOs and their members</A>';
        }
        tr4.appendChild(td4);
        tableMenu.appendChild(tr4);
    }

    static ShowAppVersion()
    {
        document.getElementById("resolver_ui_app_version").innerText = welcome_message;
    }
}


class GS1URI_EDITURI
{
    //A set of static methods and variables removed from the JS Global Context
    //so as not to clutter it up!
    static SetUnsavedChangesToTrue()
    {
        page_unsaved_changes = true;
    }

    static AddURI(uriType, componentOrderId)
    {
        let uriPrefix = document.getElementById("td_uri_prefix_" + componentOrderId);
        let uriSuffix = document.getElementById("td_uri_suffix_" + componentOrderId);
        let callingButton = document.getElementById("button_" + uriType);


        if (callingButton.value.includes("Add"))
        {
            let textInput = document.createElement("input");

            textInput.type = "text";
            textInput.size = 10;
            textInput.placeholder = callingButton.value.replace("Add ", "");
            textInput.id = "uri_value_" + componentOrderId;
            uriSuffix.innerHTML = null;
            uriSuffix.appendChild(textInput);

            callingButton.value = callingButton.value.replace("Add", "Remove");

            uriPrefix.innerText = "/" + uriType + "/";

            uriPrefix.style.visibility = "visible";
            uriSuffix.style.visibility = "visible";
        }
        else
        {
            uriPrefix.style.visibility = "hidden";
            uriSuffix.style.visibility = "hidden";
            uriSuffix.innerHTML = null;
            callingButton.value = callingButton.value.replace("Remove", "Add");
        }
    }


    static CheckGS1KeyValueIntegrity()
    {
        let gs1_key_code = document.getElementById("select_gs1_key_code").value;
        let gs1_key_value = document.getElementById("text_gs1_key_value").value;

        if (gs1_key_code === "gtin")
        {
            let apiRequest = {
                command: "check_gs1_key_value_integrity",
                session_id: page_session.session_id,
                gs1_key_code: gs1_key_code,
                gs1_key_value: gs1_key_value
            };

            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.CheckGS1KeyValueIntegrity_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }

    }

    static CheckGS1KeyValueIntegrity_Response(evt)
    {
        let testResults = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerHTML = testResults.result_message; //Sometimes the status has HTML                                                                                  // within it.
        let gs1_key_value = document.getElementById("text_gs1_key_value");
        if (testResults.result_code === 0)
        {
            GS1URI_EDITURI.SetUnsavedChangesToTrue();

            //If the format is different from the default version, replace with the API-calculated default version:
            if (testResults.default_format !== gs1_key_value.value)
            {
                gs1_key_value.value = testResults.default_format;
            }
        }
    }

    static SaveRequestURI()
    {
        let text_item_description = document.getElementById("text_item_description");
        let select_gs1_key_code = document.getElementById("select_gs1_key_code");
        let text_gs1_key_value = document.getElementById("text_gs1_key_value");
        let checkbox_include_in_sitemap = document.getElementById("checkbox_include_in_sitemap");

        let apiRequest = {
            command: "save_existing_uri_request",
            session_id: page_session.session_id,
            uri_request_id: GS1URI_COMMON.getQueryStringValue("uri"),
            gs1_key_code: select_gs1_key_code.value,
            gs1_key_value: text_gs1_key_value.value,
            item_description: text_item_description.value
        };

        if (checkbox_include_in_sitemap.checked)
        {
            apiRequest.include_in_sitemap = "1";
        }
        else
        {
            apiRequest.include_in_sitemap = "0";
        }

        if (page_active_A_suspended_S === "A")
        {
            apiRequest.active = "1";
        }
        else
        {
            apiRequest.active = "0";
        }


        for (let uriElement = 1;
             uriElement <= 4;
             uriElement++)
        {
            let uriPrefix = document.getElementById("td_uri_prefix_" + uriElement);
            let uriSuffix = document.getElementById("uri_value_" + uriElement);

            if (uriPrefix !== null && uriPrefix.innerText.length > 0)
            {
                apiRequest["uri_prefix_" + uriElement] = uriPrefix.innerText;
            }
            else
            {
                apiRequest["uri_prefix_" + uriElement] = "";
            }

            if (uriSuffix !== null && uriSuffix.value.length > 0)
            {
                apiRequest["uri_suffix_" + uriElement] = uriSuffix.value;
            }
            else
            {
                apiRequest["uri_suffix_" + uriElement] = "";
            }

        }

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.SaveRequestURI_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static SaveRequestURI_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerHTML = serviceResponse.STATUS; //Sometimes the status has HTML within it.
        page_unsaved_changes = false;
    }


    static SuspendURI()
    {
        let button_activate_or_suspend_uri = document.getElementById("button_activate_or_suspend_uri");

        if (page_active_A_suspended_S === "A")
        {
            if (confirm("Are you sure you wish to suspend this URI?"))
            {
                page_active_A_suspended_S = "S";

                //Update the button to have it ready to do the opposite next time
                button_activate_or_suspend_uri.value = "Activate this URI";
                button_activate_or_suspend_uri.innerText = "Activate this URI";
            }
        }
        else
        {
            if (confirm("Are you sure you wish to activate this URI?"))
            {
                page_active_A_suspended_S = "A";

                //Update the button to have it ready to do the opposite next time
                button_activate_or_suspend_uri.value = "Suspend this URI";
                button_activate_or_suspend_uri.innerText = "Suspend this URI";
            }
        }

        //Now save the change
        GS1URI_EDITURI.SaveRequestURI();
    }


    static GetURIRequestIdStatus()
    {
        let apiRequest = {
            command: "get_uri_status",
            session_id: page_session.session_id,
            uri_request_id: GS1URI_COMMON.getQueryStringValue("uri")
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.GetURIRequestIdStatus_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static GetURIRequestIdStatus_Response(evt)
    {
        let statusDisplay = document.getElementById("text_status");
        let status = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        if (statusDisplay.innerHTML !== status.STATUS)
        {
            statusDisplay.innerHTML = status.STATUS;
            statusDisplay.style.backgroundColor = "red";
            statusDisplay.style.color = "white";
        }
        else
        {
            statusDisplay.style.backgroundColor = "lightpink";
            statusDisplay.style.color = "black";
        }
    }


    static SetGS1KeyComponentsButtons()
    {
        let gs1KeyCode = document.getElementById("select_gs1_key_code").value;
        let apiRequest = {
            command: "get_gs1_key_components_list",
            gs1_key_code: gs1KeyCode
        };
        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.SetGS1KeyComponentsButtons_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static SetGS1KeyComponentsButtons_Response(evt)
    {
        let componentsListObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_componentsList = componentsListObj.data_list;

        let trUriButtons = document.getElementById("tr_uri_buttons");

        // delete existing buttons
        while (trUriButtons.firstChild)
        {
            trUriButtons.removeChild(trUriButtons.firstChild);
        }

        //Add in the new buttons in the correct order (that has been decided by the API)
        page_componentsList.forEach(
            function (obj)
            {
                let uriGroupElements = {};
                let thisTD = document.createElement("td");
                let thisButton = document.createElement("input");

                uriGroupElements["tdPrefix" + obj.component_order] = document.getElementById("td_uri_prefix_" + obj.component_order);

                thisButton.type = "button";
                if (uriGroupElements["tdPrefix" + obj.component_order].style.visibility === "hidden")
                {
                    thisButton.value = "Add " + obj.component_name;
                }
                else
                {
                    thisButton.value = "Remove " + obj.component_name;
                }

                thisButton.id = "button_" + obj.component_uri_id;
                thisButton.onclick = function ()
                {
                    GS1URI_EDITURI.AddURI(obj.component_uri_id, obj.component_order);
                };
                thisTD.appendChild(thisButton);
                trUriButtons.appendChild(thisTD);

            });
    }


    static GetGS1KeyCodesList()
    {
        let jsonGS1KeyCodesListFromStorage = sessionStorage.getItem("gs1_key_codes");
        if (jsonGS1KeyCodesListFromStorage !== null)
        {
            page_GS1KeyCodesList = JSON.parse(jsonGS1KeyCodesListFromStorage);
            if (!Array.isArray(page_GS1KeyCodesList))
            {
                page_GS1KeyCodesList = page_GS1KeyCodesList.data_list;
            }
            GS1URI_EDITURI.CreateGS1KeyCodesListSelectControl();
            GS1URI_EDITURI.GetRequestUriData();
        }
        else
        {
            let apiRequest = {
                command: "get_gs1_key_codes_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.GetGS1KeyCodesList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static GetGS1KeyCodesList_Response(evt)
    {
        sessionStorage.setItem("gs1_key_codes", evt.target.responseText);
        let gs1KeyCodesObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_GS1KeyCodesList = gs1KeyCodesObj.data_list;

        GS1URI_EDITURI.CreateGS1KeyCodesListSelectControl();
        GS1URI_EDITURI.GetRequestUriData();
    }


    static CreateGS1KeyCodesListSelectControl()
    {
        let selectGS1KeyCodes = document.getElementById("select_gs1_key_code");

        // delete existing SELECT options if they are there
        while (selectGS1KeyCodes.firstChild)
        {
            selectGS1KeyCodes.removeChild(selectGS1KeyCodes.firstChild);
            GS1URI_EDITURI.GetResponseUriData();
        }

        //Add in the new SELECT options in the correct order (that has been decided by the API)
        page_GS1KeyCodesList.forEach(
            function (obj)
            {
                let thisOption = document.createElement("option");
                thisOption.value = obj.gs1_key_code;
                thisOption.label = obj.code_name;
                thisOption.text = obj.gs1_key_code;
                selectGS1KeyCodes.appendChild(thisOption);
            });
    }


    static GetIanaLanguagesList()
    {
        let jsonIanaLanguagesListFromStorage = sessionStorage.getItem("iana_languages");
        if (jsonIanaLanguagesListFromStorage !== null)
        {
            page_ianaLanguagesList = JSON.parse(jsonIanaLanguagesListFromStorage);
            if (!Array.isArray(page_ianaLanguagesList))
            {
                page_ianaLanguagesList = page_ianaLanguagesList.data_list;
            }
        }
        else
        {
            let apiRequest = {
                command: "get_iana_languages_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.GetIanaLanguagesList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }


    static GetIanaLanguagesList_Response(evt)
    {
        sessionStorage.setItem("iana_languages", evt.target.responseText);
        let ianaLanguagesObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_ianaLanguagesList = ianaLanguagesObj.data_list;
    }


    static GetLinkTypesList()
    {
        let jsonLinkTypesListFromStorage = sessionStorage.getItem("linktypes");
        if (jsonLinkTypesListFromStorage !== null)
        {
            page_linkTypesList = JSON.parse(jsonLinkTypesListFromStorage);
            if (!Array.isArray(page_linkTypesList))
            {
                page_linkTypesList = page_linkTypesList.data_list;
            }
        }
        else
        {
            let apiRequest = {
                command: "get_linktypes_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.GetLinkTypesList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static GetLinkTypesList_Response(evt)
    {
        sessionStorage.setItem("linktypes", evt.target.responseText);
        let linkTypesObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_linkTypesList = linkTypesObj.data_list;
    }


    static GetContextsList()
    {
        let jsonContextsListFromStorage = sessionStorage.getItem("contexts");
        if (jsonContextsListFromStorage !== null)
        {
            page_ContextsList = JSON.parse(jsonContextsListFromStorage);
            if (!Array.isArray(page_ContextsList))
            {
                page_ContextsList = page_ContextsList.data_list;
            }
            GS1URI_EDITURI.GetResponseUriData();
        }
        else
        {
            let apiRequest = {
                command: "get_contexts_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.GetContextsList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static GetContextsList_Response(evt)
    {
        sessionStorage.setItem("contexts", evt.target.responseText);
        let ContextsObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_ContextsList = ContextsObj.data_list;
        GS1URI_EDITURI.GetResponseUriData();
    }


    static GetMimeTypesList()
    {
        let jsonMimeTypesListFromStorage = sessionStorage.getItem("mimetypes");
        if (jsonMimeTypesListFromStorage !== null)
        {
            page_MimeTypesList = JSON.parse(jsonMimeTypesListFromStorage);
            if (!Array.isArray(page_MimeTypesList))
            {
                page_MimeTypesList = page_MimeTypesList.data_list;
            }
        }
        else
        {
            let apiRequest = {
                command: "get_mime_types_list"
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.GetMimeTypesList_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static GetMimeTypesList_Response(evt)
    {
        sessionStorage.setItem("mimetypes", evt.target.responseText);
        let MimeTypesObj = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        page_MimeTypesList = MimeTypesObj.data_list;
    }


    static GetRequestUriData()
    {
        let apiRequest = {
            command: "get_request_uri_data",
            session_id: page_session.session_id,
            uri_request_id: GS1URI_COMMON.getQueryStringValue("uri")
        };
        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.GetRequestUriData_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static GetRequestUriData_Response(evt)
    {
        let requestUriData = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let requestUriEntry = requestUriData[0];

        GS1URI_EDITURI.SetRequestURIControls(requestUriEntry);
        GS1URI_EDITURI.SetGS1KeyComponentsButtons();
    }


    static SetRequestURIControls(requestUriEntry)
    {
        GS1URI_EDITURI.setupGS1KeyControls(requestUriEntry);
        GS1URI_EDITURI.setupButtons(requestUriEntry);
        GS1URI_EDITURI.setupStatus(requestUriEntry);
        GS1URI_EDITURI.setupMainURIControls(requestUriEntry);
        document.getElementById("checkbox_include_in_sitemap").checked = requestUriEntry.include_in_sitemap === 1;
    }


    static setupStatus(requestUriEntry)
    {
        let spanStatus = document.getElementById("text_status");

        if (requestUriEntry.flagged_for_deletion === 1)
        {
            spanStatus.innerText = "Flagged for deletion";
        }
        else if (requestUriEntry.active === 1)
        {
            page_active_A_suspended_S = "A";
            if (requestUriEntry.api_builder_processed === 0)
            {
                spanStatus.innerText = "Queued for activation";
            }
            else
            {
                spanStatus.innerText = "Active";
            }
        }
        else
        {
            page_active_A_suspended_S = "S";
            if (requestUriEntry.api_builder_processed === 0)
            {
                spanStatus.innerText = "Queued for suspension";
            }
            else
            {
                spanStatus.innerText = "Suspended";
            }
        }
    }

    static setupButtons(requestUriEntry)
    {
        //Set whether the suspend button will be activating or suspending if clicked:
        let button_activate_or_suspend_uri = document.getElementById("button_activate_or_suspend_uri");
        if (requestUriEntry.active === 1)
        {
            page_active_A_suspended_S = "A";
            button_activate_or_suspend_uri.innerText = "Suspend this URI";
            button_activate_or_suspend_uri.value = "Suspend This URI";
        }
        else
        {
            page_active_A_suspended_S = "S";
            button_activate_or_suspend_uri.innerText = "Make this URI Active";
            button_activate_or_suspend_uri.value = "Make This URI Active";
        }
    }

    static setupGS1KeyControls(requestUriEntry)
    {
        let selectGS1KeyCodes = document.getElementById("select_gs1_key_code");
        selectGS1KeyCodes.value = requestUriEntry.gs1_key_code;

        let textGS1KeyValue = document.getElementById("text_gs1_key_value");
        textGS1KeyValue.value = requestUriEntry.gs1_key_value;

        let spanDateCreated = document.getElementById("text_date_created");
        spanDateCreated.innerText = requestUriEntry.date_inserted;

        let spanDateLastUpdated = document.getElementById("text_date_last_updated");
        spanDateLastUpdated.innerText = requestUriEntry.date_last_updated;

        let textItemDescription = document.getElementById("text_item_description");
        textItemDescription.value = requestUriEntry.item_description;
    }

    static setupMainURIControls(requestUriEntry)
    {
        //build the 4 sets of URI elements
        let uriGroupElements = {};
        for (let uriCounter = 1;
             uriCounter < 4;
             uriCounter++)
        {

            uriGroupElements["tdPrefix" + uriCounter] = document.getElementById("td_uri_prefix_" + uriCounter);
            uriGroupElements["tdSuffix" + uriCounter] = document.getElementById("td_uri_suffix_" + uriCounter);

            uriGroupElements["textSuffix" + uriCounter] = document.createElement("input");
            uriGroupElements["textSuffix" + uriCounter].type = "text";
            uriGroupElements["textSuffix" + uriCounter].size = 10;
            uriGroupElements["textSuffix" + uriCounter].id = "uri_value_" + uriCounter;
            uriGroupElements["textSuffix" + uriCounter].value = requestUriEntry["web_uri_suffix_" + uriCounter];
            uriGroupElements["textSuffix" + uriCounter].onblur = function ()
            {
                GS1URI_EDITURI.SetUnsavedChangesToTrue();
            };
            uriGroupElements["tdPrefix" + uriCounter].innerText = requestUriEntry["web_uri_prefix_" + uriCounter];
            uriGroupElements["tdSuffix" + uriCounter].appendChild(uriGroupElements["textSuffix" + uriCounter]);

            if (requestUriEntry["web_uri_prefix_" + uriCounter] !== null && requestUriEntry["web_uri_prefix_" + uriCounter].length > 0)
            {
                uriGroupElements["tdPrefix" + uriCounter].style.visibility = "visible";
                uriGroupElements["tdSuffix" + uriCounter].style.visibility = "visible";
            }
            else
            {
                uriGroupElements["tdPrefix" + uriCounter].style.visibility = "hidden";
                uriGroupElements["tdSuffix" + uriCounter].style.visibility = "hidden";

            }
        }
    }

    static BackToDashboard()
    {
        if(document.getElementById("select_gs1_key_code") !== null)
        {
            GS1URI_EDITURI.SaveRequestURI();
        }
        window.location = "dashboard.html";
    }

    static GetResponseUriData()
    {
        let apiRequest = {
            command: "get_response_uri_data",
            session_id: page_session.session_id,
            uri_request_id: GS1URI_COMMON.getQueryStringValue("uri")
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.GetResponseUriData_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static GetResponseUriData_Response(evt)
    {
        let currentLinkType = "";
        let currentLanguage = "";
        let currentContext = "";

        let responseUriData = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let tableResponse = document.getElementById("full_uri_response_table");
        //The following line clears the table down and rebuilds it - useful when conforming the addition
        //of a new entry line destination uri:
        tableResponse.innerHTML = "<tr><th colspan='2'>Response Destinations</th><th>Default</th></tr>";

        responseUriData.forEach(
            function (responseUriEntry)
            {
                //if there is a change in any of the three attributes 'linktype', 'language' or 'context', create a new header which acts to
                //display the destinations in nested groups of context within language within linktype:
                if (responseUriEntry.linktype !== currentLinkType)
                {
                    let trHeadLinkType = document.createElement("tr");
                    let tdHeadLinkType = document.createElement("td");
                    tdHeadLinkType.innerHTML = "<b>LinkType: '" + responseUriEntry.linktype + "'</b>";
                    tdHeadLinkType.colSpan = 3;
                    trHeadLinkType.appendChild(tdHeadLinkType);
                    tableResponse.appendChild(trHeadLinkType);
                    currentLinkType = responseUriEntry.linktype;
                }

                if (responseUriEntry.language !== currentLanguage)
                {
                    let trHeadLanguage = document.createElement("tr");
                    let tdHeadLanguage = document.createElement("td");
                    tdHeadLanguage.innerHTML = "<b>&nbsp;&nbsp;&nbsp;&nbsp;- Language: '" + responseUriEntry.iana_language + "'</b>";
                    tdHeadLanguage.colSpan = 3;
                    trHeadLanguage.appendChild(tdHeadLanguage);
                    tableResponse.appendChild(trHeadLanguage);
                    currentLanguage = responseUriEntry.language;
                }

                if (responseUriEntry.context !== currentContext)
                {
                    let trHeadContext = document.createElement("tr");
                    let tdHeadContext = document.createElement("td");
                    tdHeadContext.innerHTML = "<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Context: '" + responseUriEntry.context + "'</b>";
                    tdHeadContext.colSpan = 3;
                    trHeadContext.appendChild(tdHeadContext);
                    tableResponse.appendChild(trHeadContext);
                    currentContext = responseUriEntry.context;
                }

                let tr = document.createElement("tr");

                let tdLinkType = document.createElement("td");
                let tdFriendlyName = document.createElement("td");
                let tdLanguage = document.createElement("td");
                let tdDestinationURI = document.createElement("td");
                let tdMIMEType = document.createElement("td");
                let tdContext = document.createElement("td");
                let tdFRQS = document.createElement("td");
                let tdActive = document.createElement("td");
                let tdTasks = document.createElement("td");

                let tdDefaultLinkType = document.createElement("td");
                let tdDefaultLanguage = document.createElement("td");
                let tdDefaultMIMEType = document.createElement("td");
                let tdDefaultContext = document.createElement("td");


                //First display the list of available attributes and set the 'selected'
                //name to the one being used by this response uri entry.
                let selectLinkType = document.createElement("select");
                selectLinkType.id = "selectLinkType_" + responseUriEntry.uri_response_id;
                selectLinkType.setAttribute("uri_response_id", responseUriEntry.uri_response_id);

                page_linkTypesList.forEach(
                    function (linkTypeEntry)
                    {
                        let thisOption = document.createElement("option");
                        thisOption.value = linkTypeEntry.linktype_reference_url;
                        thisOption.text = "(" + linkTypeEntry.applicable_gs1_key_code + ") " + linkTypeEntry.linktype_name;
                        thisOption.label = "(" + linkTypeEntry.applicable_gs1_key_code + ") " + linkTypeEntry.linktype_reference_url;
                        selectLinkType.appendChild(thisOption);
                    });
                selectLinkType.value = responseUriEntry.linktype;
                tdLinkType.appendChild(selectLinkType);

                //Set up the default linktype checkbox button
                let checkboxDefaultLinkType = document.createElement("input");
                checkboxDefaultLinkType.id = "checkboxDefaultLinkType_" + responseUriEntry.uri_response_id;
                checkboxDefaultLinkType.type = "checkbox";
                checkboxDefaultLinkType.name = "group_default_linktype_" + responseUriEntry.uri_request_id;
                checkboxDefaultLinkType.checked = responseUriEntry.default_linktype === 1;
                checkboxDefaultLinkType.onchange = function ()
                {
                    GS1URI_EDITURI.CheckLinkTypeDefaultsIntegrity(this);
                };
                tdDefaultLinkType.appendChild(checkboxDefaultLinkType);

                //Now display the friendly link name
                let textFriendlyName = document.createElement("input");
                textFriendlyName.type = "text";
                textFriendlyName.id = "textFriendlyName_" + responseUriEntry.uri_response_id;
                textFriendlyName.size = 40;
                textFriendlyName.value = responseUriEntry.friendly_link_name;
                textFriendlyName.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                tdFriendlyName.appendChild(textFriendlyName);
                tr.appendChild(tdFriendlyName);

                //Now set up the MIME types select box
                let selectMimeType = document.createElement("select");
                selectMimeType.id = "selectMimeType_" + responseUriEntry.uri_response_id;
                selectMimeType.setAttribute("uri_response_id", responseUriEntry.uri_response_id);

                page_MimeTypesList.forEach(
                    function (mimeTypeEntry)
                    {
                        let thisOption = document.createElement("option");
                        thisOption.value = mimeTypeEntry.mime_type_value;
                        thisOption.text = "(" + mimeTypeEntry.description + ") " + mimeTypeEntry.mime_type_value;
                        thisOption.label = "(" + mimeTypeEntry.description + ") " + mimeTypeEntry.mime_type_value;
                        selectMimeType.appendChild(thisOption);
                    });
                selectMimeType.value = responseUriEntry.mime_type;
                tdMIMEType.appendChild(selectMimeType);


                let checkboxDefaultMIMEType = document.createElement("input");
                checkboxDefaultMIMEType.id = "checkboxDefaultMIMEType_" + responseUriEntry.uri_response_id;
                checkboxDefaultMIMEType.type = "radio";
                checkboxDefaultMIMEType.name = "group_default_" + window.btoa(responseUriEntry.linktype) +
                    window.btoa(responseUriEntry.language) +
                    window.btoa(responseUriEntry.context);
                checkboxDefaultMIMEType.checked = responseUriEntry.default_mime_type === 1;
                tdDefaultMIMEType.appendChild(checkboxDefaultMIMEType);


                //Now display the destination URL
                let textDestinationURI = document.createElement("input");
                textDestinationURI.type = "text";
                textDestinationURI.id = "textDestinationURI_" + responseUriEntry.uri_response_id;
                textDestinationURI.size = 80;
                textDestinationURI.value = responseUriEntry.destination_uri;
                textDestinationURI.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                tdDestinationURI.appendChild(textDestinationURI);


                //Now set up the Language select box
                let selectLanguage = document.createElement("select");
                selectLanguage.id = "selectLanguage_" + responseUriEntry.uri_response_id;
                selectLanguage.setAttribute("uri_response_id", responseUriEntry.uri_response_id);

                for (let lang in
                    page_ianaLanguagesList)
                {
                    if (page_ianaLanguagesList.hasOwnProperty(lang))
                    {
                        let thisOption = document.createElement("option");
                        thisOption.value = lang;
                        if (page_ianaLanguagesList[lang].name === page_ianaLanguagesList[lang].nativeName)
                        {
                            thisOption.text = lang + " - " + page_ianaLanguagesList[lang].name;
                            thisOption.label = lang + " - " + page_ianaLanguagesList[lang].name
                        }
                        else
                        {
                            thisOption.text = lang + " - " + page_ianaLanguagesList[lang].name + " (" + page_ianaLanguagesList[lang].nativeName + ")";
                            thisOption.label = lang + " - " + page_ianaLanguagesList[lang].name + " (" + page_ianaLanguagesList[lang].nativeName + ")";
                        }
                        selectLanguage.appendChild(thisOption);
                    }
                }
                selectLanguage.value = responseUriEntry.iana_language;
                tdLanguage.appendChild(selectLanguage);

                let radioDefaultLanguage = document.createElement("input");
                radioDefaultLanguage.id = "radioDefaultLanguage_" + responseUriEntry.uri_response_id;
                radioDefaultLanguage.type = "radio";
                radioDefaultLanguage.name = "group_default_" + window.btoa(responseUriEntry.linktype);
                radioDefaultLanguage.checked = responseUriEntry.default_iana_language === 1;
                tdDefaultLanguage.appendChild(radioDefaultLanguage);


                //Now set up the Contexts select box
                let selectContext = document.createElement("select");
                selectContext.id = "selectContext_" + responseUriEntry.uri_response_id;
                selectContext.setAttribute("uri_response_id", responseUriEntry.uri_response_id);

                page_ContextsList.forEach(
                    function (contextEntry)
                    {
                        let thisOption = document.createElement("option");
                        thisOption.value = contextEntry.context_value;
                        thisOption.text = "(" + contextEntry.description + ") " + contextEntry.context_value;
                        thisOption.label = "(" + contextEntry.description + ") " + contextEntry.context_value;
                        selectContext.appendChild(thisOption);
                    });
                selectContext.value = responseUriEntry.context;
                tdContext.appendChild(selectContext);

                let checkboxDefaultContext = document.createElement("input");
                checkboxDefaultContext.id = "checkboxDefaultContext_" + responseUriEntry.uri_response_id;
                checkboxDefaultContext.type = "radio";
                checkboxDefaultContext.name = "group_default_" + window.btoa(responseUriEntry.linktype) +
                    window.btoa(responseUriEntry.language);
                checkboxDefaultContext.checked = responseUriEntry.default_context === 1;
                tdDefaultContext.appendChild(checkboxDefaultContext);

                //Now set a check button to denote whether querystings in the request are to be forwarded in the response
                let checkBoxFRQS = document.createElement("input");
                checkBoxFRQS.id = "checkboxFRQS_" + responseUriEntry.uri_response_id;
                checkBoxFRQS.type = "checkbox";
                checkBoxFRQS.checked = responseUriEntry.forward_request_querystrings === 1;
                checkBoxFRQS.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                tdFRQS.appendChild(checkBoxFRQS);

                //Now set a check button to denote if entry is active or not
                let checkBoxActive = document.createElement("input");
                checkBoxActive.id = "checkboxActive_" + responseUriEntry.uri_response_id;
                checkBoxActive.type = "checkbox";
                checkBoxActive.checked = responseUriEntry.active === 1;
                checkBoxActive.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                tdActive.appendChild(checkBoxActive);

                //Now set the savebutton
                let saveButton = document.createElement("button");
                saveButton.value = "Save";
                saveButton.innerText = "Save";
                saveButton.id = "save_button_" + responseUriEntry.uri_response_id;
                saveButton.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                saveButton.onclick = function ()
                {
                    GS1URI_EDITURI.SaveChangesToResponse(this.getAttribute("uri_response_id"));
                };
                tdTasks.appendChild(saveButton);

                //Now set the delete button
                let deleteButton = document.createElement("button");
                deleteButton.value = "Delete";
                deleteButton.id = "delete_button_" + responseUriEntry.uri_response_id;
                deleteButton.innerText = "Delete";
                deleteButton.setAttribute("uri_response_id", responseUriEntry.uri_response_id);
                deleteButton.onclick = function ()
                {
                    GS1URI_EDITURI.DeleteDestinationURI(deleteButton.getAttribute("uri_response_id"));
                };
                tdTasks.appendChild(deleteButton);

                //build the table row in the desired order
                let tr1 = document.createElement('tr');
                tr1.setAttribute('style', "background-color: #ffffff;");
                let tdTitle1 = document.createElement('td');
                tdTitle1.innerText = "Link Type";
                tr1.appendChild(tdTitle1);
                tr1.appendChild(tdLinkType);
                tr1.appendChild(tdDefaultLinkType);
                tableResponse.appendChild(tr1);

                let tr2 = document.createElement('tr');
                tr2.setAttribute('style', "background-color: #ffffff;");
                let tdTitle2 = document.createElement('td');
                tdTitle2.innerText = "Friendly Name";
                tdFriendlyName.setAttribute("colspan", "2");
                tr2.appendChild(tdTitle2);
                tr2.appendChild(tdFriendlyName);
                tableResponse.appendChild(tr2);

                let tr3 = document.createElement('tr');
                tr3.setAttribute('style', "background-color: #ffffff;");
                let tdTitle3 = document.createElement('td');
                tdTitle3.innerText = "Destination URL";
                tdDestinationURI.setAttribute("colspan", "2");
                tr3.appendChild(tdTitle3);
                tr3.appendChild(tdDestinationURI);
                tableResponse.appendChild(tr3);

                let tr3Lang = document.createElement('tr');
                tr3Lang.setAttribute('style', "background-color: #ffffff;");
                let tdTitle3a = document.createElement('td');
                tdTitle3a.innerText = "Language";
                tr3Lang.appendChild(tdTitle3a);
                tr3Lang.appendChild(tdLanguage);
                tr3Lang.appendChild(tdDefaultLanguage);
                tableResponse.appendChild(tr3Lang);

                let tr4 = document.createElement('tr');
                tr4.setAttribute('style', "background-color: #ffffff;");
                let tdTitle4 = document.createElement('td');
                tdTitle4.innerText = "Document Type";
                tr4.appendChild(tdTitle4);
                tr4.appendChild(tdMIMEType);
                tr4.appendChild(tdDefaultMIMEType);
                tableResponse.appendChild(tr4);

                let tr5 = document.createElement('tr');
                tr5.setAttribute('style', "background-color: #ffffff;");
                let tdTitle5 = document.createElement('td');
                tdTitle5.innerText = "Context";
                tr5.appendChild(tdTitle5);
                tr5.appendChild(tdContext);
                tr5.appendChild(tdDefaultContext);
                tableResponse.appendChild(tr5);

                let tr6 = document.createElement('tr');
                tr6.setAttribute('style', "background-color: #ffffff;");
                let tdTitle6 = document.createElement('td');
                tdTitle6.innerText = "Forward Query Strings?";
                tdFRQS.setAttribute("colspan", "2");
                tr6.appendChild(tdTitle6);
                tr6.appendChild(tdFRQS);
                tableResponse.appendChild(tr6);

                let tr7 = document.createElement('tr');
                tr7.setAttribute('style', "background-color: #ffffff;");
                let tdTitle7 = document.createElement('td');
                tdTitle7.innerText = "Make Active?";
                tdActive.setAttribute("colspan", "2");
                tr7.appendChild(tdTitle7);
                tr7.appendChild(tdActive);
                tableResponse.appendChild(tr7);

                let tr8 = document.createElement('tr');
                tr8.setAttribute('style', "background-color: #ffffff; ");
                let tdTitle8 = document.createElement('td');
                tdTitle8.innerText = "Tasks";
                tdTasks.setAttribute("colspan", "2");
                tr8.appendChild(tdTitle8);
                tr8.appendChild(tdTasks);
                tableResponse.appendChild(tr8);

                let tr9 = document.createElement('tr');
                tr9.setAttribute('style', "background-color: aliceblue; padding: 5px");
                let tdTitle9 = document.createElement('td');
                tdTitle9.innerHTML = "&nbsp;";
                tr9.appendChild(tdTitle9);
                tr9.appendChild(tdTitle9);
                tableResponse.appendChild(tr9);
            });
    }


    static SaveAllResponses()
    {
        //To save all the responses, we can iterate through the list of selectLinkType entries,
        //extracting the 'uri_response_id' attribute value from each one, and using that
        //to save the response line to the API.
        let selectLinkTypeList = document.getElementsByTagName("select");
        for (let i = 0; i < selectLinkTypeList.length; i++)
        {
            if (selectLinkTypeList[i].id.startsWith("selectLinkType_"))
            {
                GS1URI_EDITURI.SaveChangesToResponse(selectLinkTypeList[i].getAttribute("uri_response_id"));
            }
        }
    }


    static CreateNewDestinationURIEntryBoxes()
    {
        let uriRequestId = GS1URI_COMMON.getQueryStringValue("uri");
        let newUriResponseTable = document.getElementById("new_uri_response_table");
        let tdLinkType = document.createElement("td");
        let tdFriendlyName = document.createElement("td");
        let tdLanguage = document.createElement("td");
        let tdDestinationURI = document.createElement("td");
        let tdMIMEType = document.createElement("td");
        let tdContext = document.createElement("td");
        let tdFRQS = document.createElement("td");
        let tdActive = document.createElement("td");
        let tdSaveButton = document.createElement("td");

        let tdDefaultLinkType = document.createElement("td");
        let tdDefaultLanguage = document.createElement("td");
        let tdDefaultMIMEType = document.createElement("td");
        let tdDefaultContext = document.createElement("td");

        //We are hiding this button - it will be made visible once 'save' is pressed
        //on thw row for this new destination
        let buttonCreateNew = document.getElementById("button_add_new_dest_boxes");
        buttonCreateNew.classList.remove('is-visible');

        document.getElementById("message").innerText = "Click 'save' in the 'tasks' column for this new destination uri, then you can add another destination entry if you wish.";

        let selectLinkType = document.createElement("select");
        selectLinkType.setAttribute("uri_request_id", uriRequestId);
        selectLinkType.id = "selectNewLinkType";

        let linkTypeOption = document.createElement("option");
        linkTypeOption.value = "X";
        linkTypeOption.text = "(Choose a link type)";
        linkTypeOption.label = "(Choose an link type)";
        selectLinkType.appendChild(linkTypeOption);

        page_linkTypesList.forEach(
            function (linkTypeEntry)
            {
                let thisOption = document.createElement("option");
                thisOption.value = linkTypeEntry.linktype_reference_url;
                thisOption.text = linkTypeEntry.linktype_name;
                thisOption.label = linkTypeEntry.linktype_reference_url;
                selectLinkType.appendChild(thisOption);
            });
        tdLinkType.appendChild(selectLinkType);

        let checkboxNewLinkTypeDefault = document.createElement("input");
        checkboxNewLinkTypeDefault.id = "checkboxNewLinkTypeDefault";
        checkboxNewLinkTypeDefault.type = "checkbox";
        checkboxNewLinkTypeDefault.checked = true;
        checkboxNewLinkTypeDefault.name = "group_checkbox_default_linktype";
        checkboxNewLinkTypeDefault.onchange = function ()
        {
            GS1URI_EDITURI.CheckLinkTypeDefaultsIntegrity(this);
        };
        checkboxNewLinkTypeDefault.setAttribute("uri_request_id", uriRequestId);
        tdDefaultLinkType.appendChild(checkboxNewLinkTypeDefault);


        let textFriendlyName = document.createElement("input");
        textFriendlyName.id = "textNewFriendlyName";
        textFriendlyName.size = 40;
        textFriendlyName.type = "text";
        textFriendlyName.setAttribute("uri_request_id", uriRequestId);
        tdFriendlyName.appendChild(textFriendlyName);


        let textDestinationURI = document.createElement("input");
        textDestinationURI.id = "textNewDestinationURI";
        textDestinationURI.size = 80;
        textDestinationURI.type = "text";
        textDestinationURI.setAttribute("uri_request_id", uriRequestId);
        tdDestinationURI.appendChild(textDestinationURI);

        //Now set up the Language select box
        let selectLanguage = document.createElement("select");
        selectLanguage.id = "selectNewLanguage";

        for (let lang in
            page_ianaLanguagesList)
        {
            if (page_ianaLanguagesList.hasOwnProperty(lang))
            {
                let thisOption = document.createElement("option");
                thisOption.value = lang;
                if (page_ianaLanguagesList[lang].name === page_ianaLanguagesList[lang].nativeName)
                {
                    thisOption.text = lang + " - " + page_ianaLanguagesList[lang].name;
                    thisOption.label = lang + " - " + page_ianaLanguagesList[lang].name
                }
                else
                {
                    thisOption.text = lang + " - " + page_ianaLanguagesList[lang].name + " (" + page_ianaLanguagesList[lang].nativeName + ")";
                    thisOption.label = lang + " - " + page_ianaLanguagesList[lang].name + " (" + page_ianaLanguagesList[lang].nativeName + ")";
                }
                if (typeof page_ianaLanguagesList[lang].default !== "undefined")
                {
                    thisOption.selected = true;
                }
                selectLanguage.appendChild(thisOption);
            }
        }
        tdLanguage.appendChild(selectLanguage);

        let radioNewDefaultLanguage = document.createElement("input");
        radioNewDefaultLanguage.id = "checkNewDefaultLanguage";
        radioNewDefaultLanguage.type = "radio";
        radioNewDefaultLanguage.checked = true;
        radioNewDefaultLanguage.name = "group_default_new_language";
        radioNewDefaultLanguage.onchange = function ()
        {
            GS1URI_EDITURI.CheckLinkTypeDefaultsIntegrity(this);
        };

        tdDefaultLanguage.appendChild(radioNewDefaultLanguage);


        //Now set up the Mime Type select box
        let selectMimeType = document.createElement("select");
        selectMimeType.id = "selectNewMimeType";

        page_MimeTypesList.forEach(
            function (mimeTypeEntry)
            {
                let thisOption = document.createElement("option");
                thisOption.value = mimeTypeEntry.mime_type_value;
                thisOption.text = "(" + mimeTypeEntry.description + ") " + mimeTypeEntry.mime_type_value;
                thisOption.label = "(" + mimeTypeEntry.description + ") " + mimeTypeEntry.mime_type_value;
                if (mimeTypeEntry.default_mime_type_flag === 1)
                {
                    thisOption.selected = true;
                }
                selectMimeType.appendChild(thisOption);
            });
        tdMIMEType.appendChild(selectMimeType);


        let radioNewDefaultMIMEType = document.createElement("input");
        radioNewDefaultMIMEType.id = "radioNewDefaultMIMEType";
        radioNewDefaultMIMEType.type = "radio";
        radioNewDefaultMIMEType.checked = true;
        radioNewDefaultMIMEType.name = "group_default_new_mime_type";
        radioNewDefaultMIMEType.onchange = function ()
        {
            GS1URI_EDITURI.CheckLinkTypeDefaultsIntegrity(this);
        };
        tdDefaultMIMEType.appendChild(radioNewDefaultMIMEType);


        //Now set up the Context select box
        let selectContext = document.createElement("select");
        selectContext.id = "selectNewContext";

        page_ContextsList.forEach(
            function (contextEntry)
            {
                let thisOption = document.createElement("option");
                thisOption.value = contextEntry.context_value;
                thisOption.text = "(" + contextEntry.description + ") " + contextEntry.context_value;
                thisOption.label = "(" + contextEntry.description + ") " + contextEntry.context_value;
                if (contextEntry.default_context_flag === 1)
                {
                    thisOption.selected = true;
                }
                selectContext.appendChild(thisOption);
            });
        tdContext.appendChild(selectContext);

        let radioNewDefaultContext = document.createElement("input");
        radioNewDefaultContext.id = "radioNewDefaultContext";
        radioNewDefaultContext.type = "radio";
        radioNewDefaultContext.checked = true;
        radioNewDefaultContext.name = "group_new_default_context";
        tdDefaultContext.appendChild(radioNewDefaultContext);

        let checkFRQS = document.createElement("input");
        checkFRQS.id = "checkboxNewFRQS";
        checkFRQS.type = "checkbox";
        checkFRQS.checked = true;
        tdFRQS.appendChild(checkFRQS);

        let checkActive = document.createElement("input");
        checkActive.id = "checkNewActive";
        checkActive.type = "checkbox";
        checkActive.checked = true;
        tdActive.appendChild(checkActive);

        let newDestSaveButton = document.createElement("button");
        newDestSaveButton.value = "Save";
        newDestSaveButton.innerText = "Save";
        newDestSaveButton.id = "new_uri_button";
        newDestSaveButton.onclick = function ()
        {
            GS1URI_EDITURI.SaveNewDestinationURI();
        };
        tdSaveButton.appendChild(newDestSaveButton);

        let newDestCancelButton = document.createElement("button");
        newDestCancelButton.value = "Cancel";
        newDestCancelButton.innerText = "Cancel";
        newDestCancelButton.id = "new_uri_cancel_button";
        newDestCancelButton.onclick = function ()
        {
            document.getElementById("new_uri_response_table").innerHTML = "";
            let buttonCreateNew = document.getElementById("button_add_new_dest_boxes");
            buttonCreateNew.classList.add('is-visible');
        };
        tdSaveButton.appendChild(newDestCancelButton);


        //build the table row in the desired order
        let tr1 = document.createElement('tr');
        let tdTitle1 = document.createElement('td');
        tdTitle1.innerText = "Link Type";
        tr1.appendChild(tdTitle1);
        tr1.appendChild(tdLinkType);
        tr1.appendChild(tdDefaultLinkType);
        newUriResponseTable.appendChild(tr1);

        let tr2 = document.createElement('tr');
        let tdTitle2 = document.createElement('td');
        tdTitle2.innerText = "Friendly Name";
        tdFriendlyName.setAttribute("colspan", "2");
        tr2.appendChild(tdTitle2);
        tr2.appendChild(tdFriendlyName);
        newUriResponseTable.appendChild(tr2);

        let tr3 = document.createElement('tr');
        let tdTitle3 = document.createElement('td');
        tdTitle3.innerText = "Destination URL";
        tdDestinationURI.setAttribute("colspan", "2");
        tr3.appendChild(tdTitle3);
        tr3.appendChild(tdDestinationURI);
        newUriResponseTable.appendChild(tr3);

        let tr3Lang = document.createElement('tr');
        let tdTitle3a = document.createElement('td');
        tdTitle3a.innerText = "Language";
        tr3Lang.appendChild(tdTitle3a);
        tr3Lang.appendChild(tdLanguage);
        tr3Lang.appendChild(tdDefaultLanguage);
        newUriResponseTable.appendChild(tr3Lang);

        let tr4 = document.createElement('tr');
        let tdTitle4 = document.createElement('td');
        tdTitle4.innerText = "Document Type";
        tr4.appendChild(tdTitle4);
        tr4.appendChild(tdMIMEType);
        tr4.appendChild(tdDefaultMIMEType);
        newUriResponseTable.appendChild(tr4);

        let tr5 = document.createElement('tr');
        let tdTitle5 = document.createElement('td');
        tdTitle5.innerText = "Context";
        tr5.appendChild(tdTitle5);
        tr5.appendChild(tdContext);
        tr5.appendChild(tdDefaultContext);
        newUriResponseTable.appendChild(tr5);

        let tr6 = document.createElement('tr');
        let tdTitle6 = document.createElement('td');
        tdTitle6.innerText = "Forward Query Strings?";
        tdFRQS.setAttribute("colspan", "2");
        tr6.appendChild(tdTitle6);
        tr6.appendChild(tdFRQS);
        newUriResponseTable.appendChild(tr6);

        let tr7 = document.createElement('tr');
        let tdTitle7 = document.createElement('td');
        tdTitle7.innerText = "Make Active?";
        tdActive.setAttribute("colspan", "2");
        tr7.appendChild(tdTitle7);
        tr7.appendChild(tdActive);
        newUriResponseTable.appendChild(tr7);

        let tr8 = document.createElement('tr');
        let tdTitle8 = document.createElement('td');
        tdTitle8.innerText = "Tasks";
        tdSaveButton.setAttribute("colspan", "2");
        tr8.appendChild(tdTitle8);
        tr8.appendChild(tdSaveButton);
        newUriResponseTable.appendChild(tr8);
    }

    static CheckLinkTypeDefaultsIntegrity(checkboxControl)
    {
        //TODO: Finish this function that checks and sets the defaults for LinkType
        //Count the number of controls until we find the control that called this function
        let controls = document.getElementsByTagName("input");
        let controlIndex = 0;
        for (let i = 0, iLen = controls.length; i < iLen; i++)
        {
            let control = controls[i];
            if (control.type === "checkbox" && control.name === checkboxControl.name)
            {
                if (control === checkboxControl)
                {
                    //control.checked = !checkboxControl.checked;
                    break; // <-- this stops the for() loop
                }
                else
                {
                    controlIndex += 1;
                }
            }
        }

        //Now get the value of the equivalent linkType
        let linkTypeValueWantedAsDefaultLinkType = "";
        let checkboxLinkTypeCount = 0;

        let selects = document.getElementsByTagName("select");
        for (let s = 0, sLen = selects.length; s < sLen; s++)
        {
            let select = selects[s];
            if (select.id.includes('selectLinkType'))
            {
                if (checkboxLinkTypeCount === controlIndex)
                {
                    linkTypeValueWantedAsDefaultLinkType = select.value;
                }
                else
                {
                    checkboxLinkTypeCount += 1;
                }

            }
        }

        //window.alert(linkTypeValueWantedAsDefaultLinkType);

    }

    static SaveChangesToResponse(uriResponseId)
    {
        let defaultLinkTypeFlag = document.getElementById("checkboxDefaultLinkType_" + uriResponseId).checked;
        let defaultContextFlag = document.getElementById("checkboxDefaultContext_" + uriResponseId).checked;
        let defaultMIMETypeFlag = document.getElementById("checkboxDefaultMIMEType_" + uriResponseId).checked;
        let defaultLanguageFlag = document.getElementById("radioDefaultLanguage_" + uriResponseId).checked;
        let frqsFlag = document.getElementById("checkboxFRQS_" + uriResponseId).checked;
        let activeFlag = document.getElementById("checkboxActive_" + uriResponseId).checked;

        let uriDestination = document.getElementById("textDestinationURI_" + uriResponseId).value;
        if (uriDestination.includes("%20"))
        {
            if (confirm("The URL escape character code '%20' (for space) was found in a destination URI which is not allowed by the resolver. " +
                "However, I can convert all '%20' characters to '+' which will still work. Click OK for me to do this now. (Note, I cannot save this URI if you choose 'Cancel')"))
            {
                document.getElementById("text_destination_" + uriResponseId).value = uriDestination.replace("%20", "+");
            }
            else
            {
                alert("This destination URI has NOT been saved, nor will be until you remove all '%20' references.");
                return;
            }
        }
        else if (uriDestination.includes("%"))
        {
            alert("You have used a URL escape character code in this destination URI which is not allowed by the resolver. This destination URI will NOT been saved until you remove all '%nn' references.");
            return;
        }

        let apiRequest = {
            command: "save_existing_uri_response",
            session_id: page_session.session_id,
            uri_response_id: uriResponseId,
            link_type: document.getElementById("selectLinkType_" + uriResponseId).value,
            iana_language: document.getElementById("selectLanguage_" + uriResponseId).value,
            destination_uri: document.getElementById("textDestinationURI_" + uriResponseId).value,
            friendly_link_name: document.getElementById("textFriendlyName_" + uriResponseId).value,
            mime_type: document.getElementById("selectMimeType_" + uriResponseId).value,
            context: document.getElementById("selectContext_" + uriResponseId).value,
            default_iana_language: defaultLanguageFlag,
            default_link_type: defaultLinkTypeFlag,
            default_mime_type: defaultMIMETypeFlag,
            default_context: defaultContextFlag,
            forward_request_querystrings: frqsFlag,
            active: activeFlag
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.SaveChangesToDestinationURI_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static SaveChangesToDestinationURI_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerText = serviceResponse.STATUS;
    }


    static SaveNewDestinationURI()
    {
        let defaultLinkTypeFlag = 0;
        let defaultContextFlag = 0;
        let defaultMIMETypeFlag = 0;
        let defaultLanguageFlag = 0;
        let frqsFlag = 0;
        let activeFlag = 0;

        if (document.getElementById("selectNewLinkType").value === "X")
        {
            alert("Please choose a link type from the drop-down list");
            return;
        }
        if (document.getElementById("textNewDestinationURI").value.length < 10)
        {
            alert("Destination '" + document.getElementById("textNewDestinationURI").value + "' is a bit short! Longer please and make sure you include 'http://' or 'https://' as needed!");
            return;
        }

        if (document.getElementById("selectNewLanguage").checked)
        {
            defaultLanguageFlag = 1;
        }

        if (document.getElementById("radioNewDefaultMIMEType").checked)
        {
            defaultMIMETypeFlag = 1;
        }

        if (document.getElementById("radioNewDefaultContext").checked)
        {
            defaultContextFlag = 1;
        }

        if (document.getElementById("checkboxNewLinkTypeDefault").checked)
        {
            defaultLinkTypeFlag = 1;
        }

        if (document.getElementById("checkboxNewFRQS").checked)
        {
            frqsFlag = 1;
        }

        if (document.getElementById("checkNewActive").checked)
        {
            activeFlag = 1;
        }

        let buttonCreateNew = document.getElementById("button_add_new_dest_boxes");
        buttonCreateNew.classList.add('is-visible');


        let uriRequestId = GS1URI_COMMON.getQueryStringValue("uri");

        let apiRequest = {
            command: "save_new_uri_response",
            session_id: page_session.session_id,
            uri_request_id: uriRequestId,
            iana_language: document.getElementById("selectNewLanguage").value,
            linktype: document.getElementById("selectNewLinkType").value,
            destination_uri: document.getElementById("textNewDestinationURI").value,
            friendly_link_name: document.getElementById("textNewFriendlyName").value,
            mime_type: document.getElementById("selectNewMimeType").value,
            context: document.getElementById("selectNewContext").value,
            forward_request_querystrings: frqsFlag,
            default_iana_language: defaultLanguageFlag,
            default_linktype: defaultLinkTypeFlag,
            default_context: defaultContextFlag,
            default_mime_type: defaultMIMETypeFlag,
            active: activeFlag
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiRequest));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_EDITURI.AddNewToDestinationURI_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }


    static AddNewToDestinationURI_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerText = serviceResponse.STATUS;
        document.getElementById("button_add_new_dest_boxes").style.visibility = "visible;";

        //Rebuild the table by getting the new list of Response URI data:
        GS1URI_EDITURI.GetResponseUriData();
    }

    static DeleteRequestEntry()
    {
        if (confirm("DO YOU WISH TO DELETE THIS ENTIRE ENTRY? This is an irreversible act!"))
        {
            let apiRequest = {
                command: "delete_uri_request",
                session_id: page_session.session_id,
                uri_request_id: GS1URI_COMMON.getQueryStringValue("uri"),
            };
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiRequest));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_EDITURI.DeleteRequestEntry_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static DeleteRequestEntry_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerText = serviceResponse.STATUS;
        let divHideOnEntryDeletion = document.getElementById("divHideOnEntryDeletion");
        divHideOnEntryDeletion.innerHTML ='<img src="GS1_Symbol_Trashcan_RGB_2015-04-16.jpg">';
    }



    static DeleteDestinationURI(uriResponseId)
    {
        let suspendEntry = false;
        let allowDelete = true;
        let confirmMessage = "";
        let radioCount = 0;

        //count the number of radio buttons starting with "radioDefaultLanguage__default":
        let inputElements = document.getElementsByTagName("input");
        for (let i = 0; i < inputElements.length; i++)
        {
            if (inputElements[i].id.startsWith("radioDefaultLanguage_"))
            {
                radioCount++;
            }
        }

        if (radioCount === 1)
        {
            //Allow deletion but suspend entry
            suspendEntry = true;
            confirmMessage = "Are you sure you wish to delete this only Destination URI? If yes, the entry will be suspended and no longer accessed at this resolver";
        }
        else
        {
            confirmMessage = "Are you sure you wish to delete this Destination URI?";
        }

        if (allowDelete)
        {
            if (confirm(confirmMessage))
            {
                if (suspendEntry)
                {
                    page_active_A_suspended_S = "S";
                    GS1URI_EDITURI.SaveRequestURI();
                    //Update the button to have it ready to do the opposite next time, although it will be
                    //disabled at this time until a new destination entry is created,
                    let button_activate_or_suspend_uri = document.getElementById("button_activate_or_suspend_uri");
                    button_activate_or_suspend_uri.value = "Activate this URI";
                    button_activate_or_suspend_uri.innerText = "Activate this URI";
                    button_activate_or_suspend_uri.enabled = false;
                }

                let apiRequest = {
                    command: "delete_uri_response",
                    session_id: page_session.session_id,
                    uri_response_id: uriResponseId,
                };
                let fd = new FormData();
                fd.append("resolver", JSON.stringify(apiRequest));
                let xhr = new XMLHttpRequest();
                xhr.addEventListener("load", GS1URI_EDITURI.DeleteDestinationURI_Response, false);
                xhr.open("POST", api_url);
                xhr.send(fd);
            }
        }
        else
        {
            alert(confirmMessage);
        }
    }


    static DeleteDestinationURI_Response(evt)
    {
        let serviceResponse = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById("message").innerText = serviceResponse.STATUS;
        //Rebuild the table by getting the new list of Response URI data:
        GS1URI_EDITURI.GetResponseUriData();
    }


    static TestResolverPageExists()
    {
        if (page_active_A_suspended_S === "A")
        {
            let uriTest = {};
            uriTest.select_gs1_key_code = document.getElementById("select_gs1_key_code");
            uriTest.text_gs1_key_value = document.getElementById("text_gs1_key_value");
            uriTest.tdUriPrefix1 = document.getElementById("td_uri_prefix_1");
            uriTest.uriSuffix1 = document.getElementById("uri_value_1");
            uriTest.tdUriPrefix2 = document.getElementById("td_uri_prefix_2");
            uriTest.uriSuffix2 = document.getElementById("uri_value_2");
            uriTest.tdUriPrefix3 = document.getElementById("td_uri_prefix_3");
            uriTest.uriSuffix3 = document.getElementById("uri_value_3");
            uriTest.tdUriPrefix4 = document.getElementById("td_uri_prefix_4");
            uriTest.uriSuffix4 = document.getElementById("uri_value_4");

            let urlSuffixToTest = uriTest.select_gs1_key_code.value + "/" + uriTest.text_gs1_key_value.value;

            let variableFound = false;
            //loop through the four URI extensions, adding them to the URI to test if:
            //1. They are not blank, and
            //2. A variable (a label between two [] brackets) is not found.
            //3. If a variable is found, replace it with the variable label text name for the purposes of testing
            //   and stop adding more extensions
            for (let i = 1;
                 i < 4;
                 i++)
            {
                //A suffix can become null if it is removed from the URI using one of the 'remove' buttons
                if (uriTest['uriSuffix' + i] !== null)
                {
                    let prefix = uriTest['tdUriPrefix' + i].innerText;
                    let suffix = uriTest['uriSuffix' + i].value;
                    if (prefix !== "")
                    {
                        urlSuffixToTest += prefix;
                        if (!variableFound && suffix.includes('['))
                        {
                            urlSuffixToTest += suffix.replace("[", "")
                                .replace("]", "");
                            variableFound = true;
                        }
                        else
                        {
                            urlSuffixToTest += suffix;
                        }
                    }
                }
            }

            let url = page_resolverEndpointURL + urlSuffixToTest;
            document.getElementById("uriToTest").innerHTML = "<a target='_blank' href=\"" + url + "\">" + url + "</a>";

            let testRequest = new Request(url,
                {
                    method: 'get',
                    mode: 'cors',
                    redirect: 'follow'
                });

            fetch(testRequest)
                .then(function (responseObj)
                {
                    GS1URI_EDITURI.TestResolverPageExists_Response(responseObj.status);
                });

        }
        else
        {
            document.getElementById("uriTestResult").innerText = " - This URI is not active so testing is turned off";
        }
    }


    static TestResolverPageExists_Response(status)
    {
        if (status === 0)
        {
            document.getElementById("uriTestResult").innerText = " - not tested yet";
        }
        else if (status === 200)
        {
            document.getElementById("uriTestResult").innerText = " - Confirmed LIVE";
        }
        else
        {
            document.getElementById("uriTestResult").innerText = " - NOT LIVE";
        }
    }

}


class GS1URI_ACCOUNTS
{
    static GetGS1MOList()
    {
        let apiCommand = {
            session_id: page_session.session_id,
            command: 'get_gs1_mo_list'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.GetGS1MOList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static GetGS1MOList_Response(evt)
    {
        let moList = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let select_gs1_mo = document.getElementById("select_gs1_mos");
        select_gs1_mo.innerHTML = null;

        //Add in the new SELECT options in the correct order (that has been decided by the API)
        moList.forEach(
            function (obj)
            {
                let thisOption = document.createElement("option");
                thisOption.value = obj.gs1_mo_primary_gln;
                thisOption.label = obj.organisation_name;
                thisOption.text = obj.organisation_name;
                if (obj.gs1_mo_primary_gln === page_session.gs1_mo_primary_gln)
                {
                    thisOption.selected = true;
                    GS1URI_ACCOUNTS.GetMemberList(page_session.gs1_mo_primary_gln);
                }
                select_gs1_mo.appendChild(thisOption);
            });

        document.getElementById("buttonNewMember").innerText = "Add new member to " + select_gs1_mo.selectedOptions[0].label;

    }


    static GetMemberList(gs1MoPrimaryGln)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            gs1_mo_primary_gln: gs1MoPrimaryGln,
            command: 'get_member_list'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.GetMemberList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static GetMemberList_Response(evt)
    {
        let memberList = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let select_members = document.getElementById("select_members");
        //Add in the new SELECT options in the correct order (that has been decided by the API)
        select_members.innerHTML = null;
        memberList.forEach(
            function (obj)
            {
                let thisOption = document.createElement("option");
                thisOption.value = obj.member_primary_gln;
                thisOption.label = obj.member_name;
                thisOption.text = obj.member_name;
                if (obj.member_primary_gln === page_session.member_primary_gln)
                {
                    thisOption.selected = true;
                    GS1URI_ACCOUNTS.GetAccountList(page_session.member_primary_gln);
                }
                select_members.appendChild(thisOption);
            });

        let member_name = document.getElementById("select_members").selectedOptions[0].label;
        document.getElementById("buttonNewAccount").innerText = "Add new account to " + member_name;

        //Empty the accounts select box as the list of accounts are now inapplicable:
        document.getElementById("select_accounts").innerHTML = null;

    }


    static GetAccountList(gs1MemberPrimaryGln)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            member_primary_gln: gs1MemberPrimaryGln,
            command: 'get_account_list'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.GetAccountList_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static GetAccountList_Response(evt)
    {
        let accountList = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let select_accounts = document.getElementById("select_accounts");
        //Add in the new SELECT options in the correct order (that has been decided by the API)
        select_accounts.innerHTML = null;
        let thisOption = document.createElement("option");
        thisOption.value = 'X';
        thisOption.label = 'Choose Account';
        thisOption.text = 'Choose Account';
        select_accounts.appendChild(thisOption);
        accountList.forEach(
            function (obj)
            {
                let thisOption = document.createElement("option");
                thisOption.value = obj.account_id;
                thisOption.label = obj.firstname + " " + obj.surname;
                thisOption.text = obj.firstname + " " + obj.surname;
                select_accounts.appendChild(thisOption);
            });
    }

    static GetAccountDetails(accountId)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            account_id: accountId,
            command: 'get_account_details'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.GetAccountDetails_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static GetAccountDetails_Response(evt)
    {
        let account = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        //There should only be one account
        document.getElementById('text_email').value = account[0].login_email;
        document.getElementById('text_firstname').value = account[0].firstname;
        document.getElementById('text_surname').value = account[0].surname;
        document.getElementById('td_account_id').innerText = account[0].account_id;
        document.getElementById('textarea_account_notes').value = account[0].account_notes;
        document.getElementById('select_admin_level').value = account[0].administrator;
        document.getElementById('checkbox_account_active').checked = account[0].active === 1;

        //This line returns visibility to the password box  in case the previous task was a cancelled 'New Account' task:
        document.getElementById('text_password').style.visibility = "visible";

        document.getElementById('text_password').value = "";
        document.getElementById('text_new_password_1').value = "";
        document.getElementById('text_new_password_2').value = "";
    }

    static gs1mo_selected()
    {
        let gs1mo_gln = document.getElementById("select_gs1_mos").value;
        let gs1mo_name = document.getElementById("select_gs1_mos").selectedOptions[0].label;
        document.getElementById("buttonNewMember").innerText = "Add new member to " + gs1mo_name;
        GS1URI_ACCOUNTS.GetMemberList(gs1mo_gln);
    }


    static buttonSaveNewMO()
    {
        let organisation_name = window.prompt("Please enter the name of the new GS1 M.O");
        if (organisation_name !== null && organisation_name.length > 3)
        {
            let gs1_mo_primary_gln = window.prompt("What is the 13-digit primary GLN of " + organisation_name + "?");
            if (gs1_mo_primary_gln !== null)
            {
                if (gs1_mo_primary_gln.length !== 13)
                {
                    alert("Sorry, the length of a GLN must always be 13 digits!");
                }
                else if (!GS1URI_COMMON.isNumeric(gs1_mo_primary_gln))
                {
                    alert("Sorry, a GLN can contain only numeric values!");
                }
                else
                {
                    //All good! Ask tha API to insert the new MO
                    if (confirm("Please confirm that you want to save new GS1 MO " + organisation_name + " with Primary GLN " + gs1_mo_primary_gln))
                    {
                        GS1URI_ACCOUNTS.SaveNewGS1MO(organisation_name, gs1_mo_primary_gln);
                    }
                    else
                    {
                        document.getElementById('text_status').innerText = "Cancelled save of new GS1 MO " + organisation_name + " with Primary GLN " + gs1_mo_primary_gln;
                    }
                }
            }
        }
    }


    static SaveNewGS1MO(organisation_name, gs1_mo_primary_gln)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            organisation_name: organisation_name,
            gs1_mo_primary_gln: gs1_mo_primary_gln,
            command: 'save_new_gs1mo'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.SaveNewGS1MO_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static SaveNewGS1MO_Response(evt)
    {
        let result = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        //There should only be one account
        document.getElementById('text_status').innerText = result.STATUS;
        GS1URI_ACCOUNTS.GetGS1MOList();
    }

    static SaveNewMember(member_name, member_primary_gln, gs1_mo_primary_gln, notes, active, member_logo_url)
    {
        let apiCommand = {
            session_id: page_session.session_id,
            member_name: member_name,
            member_primary_gln: member_primary_gln,
            gs1_mo_primary_gln: gs1_mo_primary_gln,
            notes: notes,
            active: active,
            member_logo_url: member_logo_url,
            command: 'save_new_member'
        };

        let fd = new FormData();
        fd.append("resolver", JSON.stringify(apiCommand));
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", GS1URI_ACCOUNTS.SaveNewMember_Response, false);
        xhr.open("POST", api_url);
        xhr.send(fd);
    }

    static SaveNewMember_Response(evt)
    {
        let result = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        let gs1mo_gln = document.getElementById("select_gs1_mos").value;

        document.getElementById('text_status').innerText = result.STATUS;
        GS1URI_ACCOUNTS.GetMemberList(gs1mo_gln);
    }

    static member_selected()
    {
        let member_gln = document.getElementById("select_members").value;
        let member_name = document.getElementById("select_members").selectedOptions[0].label;
        document.getElementById("buttonNewAccount").innerText = "Add new account to " + member_name;
        GS1URI_ACCOUNTS.GetAccountList(member_gln);
    }

    static buttonSetupNewAccount()
    {
        //Clear the account form boxes
        document.getElementById('text_email').value = "";
        document.getElementById('text_firstname').value = "";
        document.getElementById('text_surname').value = "";
        document.getElementById('td_account_id').innerText = "New Account";
        document.getElementById('textarea_account_notes').value = "";
        document.getElementById('select_admin_level').value = "N";
        document.getElementById('text_password').style.visibility = "hidden";

        alert("Please fill in the boxes in the form then click 'Save Changes' to create the new account");
    }

    static buttonSaveNewMember()
    {
        let gs1mo_name = document.getElementById("select_gs1_mos").selectedOptions[0].label;
        let gs1mo_gln = document.getElementById("select_gs1_mos").value;

        let member_name = window.prompt("Please enter the Company Name of the new Member, which will be linked to " + gs1mo_name);
        if (member_name !== null && member_name.length > 3)
        {
            let member_primary_gln = window.prompt("What is the 13-digit primary GLN that " + gs1mo_name + " has assigned to " + member_name + "?");
            if (member_primary_gln !== null)
            {
                if (member_primary_gln.length !== 13)
                {
                    alert("Sorry, the length of a GLN must always be 13 digits!");
                }
                else if (!GS1URI_COMMON.isNumeric(member_primary_gln))
                {
                    alert("Sorry, a GLN can contain only numeric values!");
                }
                else
                {
                    //Now some optional questions:
                    let notes = window.prompt("(Optional) Please enter any note you would like to make about this member");
                    if (notes === null)
                    {
                        notes = "";
                    }

                    let member_logo_url = window.prompt("(Optional) Please enter the public web address of the member's logo, or a base64-encoded version of the image binary (up to 64Kb)");
                    if (member_logo_url === null)
                    {
                        member_logo_url = "";
                    }


                    let active = confirm("Do you wish to make this member active straight away? (OK for Yes, Cancel for No)");

                    //All good! Ask tha API to insert the new member
                    if (confirm("Please click OK to confirm that you wish to save new member " + member_name + " with Primary GLN " + member_primary_gln + " as a member of " + gs1mo_name + " (or 'cancel' to abandon saving):"))
                    {
                        GS1URI_ACCOUNTS.SaveNewMember(member_name, member_primary_gln, gs1mo_gln, notes, active, member_logo_url);
                    }
                    else
                    {
                        document.getElementById('text_status').innerText = "Cancelled save of new member " + member_name + " with Primary GLN " + member_primary_gln;
                    }
                }
            }
        }

    }


    static account_selected()
    {
        let select_accounts = document.getElementById("select_accounts");
        GS1URI_ACCOUNTS.GetAccountDetails(select_accounts.value);

    }


    static validateEmail(email)
    {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email)
            .toLowerCase());
    }

    static SaveAccountDetails()
    {
        let verifyInputOKFlag = true;
        let active = 0;
        let accountId = document.getElementById('td_account_id').innerText;
        let email = document.getElementById('text_email').value;
        let firstName = document.getElementById('text_firstname').value;
        let surname = document.getElementById('text_surname').value;
        let password = document.getElementById('text_password').value;
        let newPassword1 = document.getElementById('text_new_password_1').value;
        let newPassword2 = document.getElementById('text_new_password_2').value;
        let accountNotes = document.getElementById('textarea_account_notes').value;
        let adminLevel = document.getElementById('select_admin_level').value;
        let member_gln = document.getElementById("select_members").value;
        if (document.getElementById('checkbox_account_active').checked)
        {
            active = 1;
        }

        if (!GS1URI_ACCOUNTS.validateEmail(email))
        {
            verifyInputOKFlag = false;
            alert("Sorry, the email address seems to be in an incorrect format!");
        }

        if (firstName === "")
        {
            verifyInputOKFlag = false;
            alert("Sorry, the first name cannot be blank!");
        }

        if (surname === "")
        {
            verifyInputOKFlag = false;
            alert("Sorry, the surname cannot be blank!");
        }


        let apiCommand = {
            session_id: page_session.session_id,
            email: email,
            password: password,
            new_password: '',
            firstname: firstName,
            surname: surname,
            admin_level: adminLevel,
            member_primary_gln: member_gln,
            notes: accountNotes,
            active: active,
            command: 'save_account'
        };

        if (!isNaN(accountId))
        {
            apiCommand.account_id = accountId;
        }

        if (password === "" && accountId !== "New Account")
        {
            verifyInputOKFlag = false;
            alert("Sorry, you need to enter your existing password to save any changes");
            password.focus();

        }

        if (newPassword1 !== "")
        {
            if (newPassword2 === newPassword1)
            {
                apiCommand.new_password = newPassword1;
            }
            else
            {
                verifyInputOKFlag = false;
                alert("Sorry, passwords do not match!");
            }
        }

        if (verifyInputOKFlag)
        {
            let fd = new FormData();
            fd.append("resolver", JSON.stringify(apiCommand));
            let xhr = new XMLHttpRequest();
            xhr.addEventListener("load", GS1URI_ACCOUNTS.SaveAccountDetails_Response, false);
            xhr.open("POST", api_url);
            xhr.send(fd);
        }
    }

    static SaveAccountDetails_Response(evt)
    {
        let result = GS1URI_COMMON.GetAJAXResponse(evt.target.responseText);
        document.getElementById('message').innerText = result.STATUS;
        GS1URI_ACCOUNTS.GetAccountList(document.getElementById("select_members").value);
        //In case the password box was invisible as is the case when setitng up a new account:
        document.getElementById('text_password').style.visibility = "visible";

    }

    static LoadOwnAccount()
    {
        let select_members = document.getElementById("select_members");
        let optionMember = document.createElement("option");
        optionMember.value = page_session.member_primary_gln;
        optionMember.label = page_session.member_name;
        optionMember.text = page_session.member_name;
        select_members.appendChild(optionMember);

        let select_accounts = document.getElementById("select_accounts");
        let optionAccount = document.createElement("option");
        optionAccount.value = page_session.account_id;
        optionAccount.label = page_session.firstname + " " + page_session.surname;
        optionAccount.text = page_session.firstname + " " + page_session.surname;
        select_accounts.appendChild(optionAccount);


        GS1URI_ACCOUNTS.GetAccountDetails(page_session.account_id);
    }

    static BackToMainMenu()
    {
        window.location.href = "index.html";
    }

}


class GS1URI_COMMON
{
    static GetSessionData()
    {
        try
        {
            page_session = JSON.parse(sessionStorage.getItem("session"));
        }
        catch (err)
        {
            page_session = null;
        }
    }

    static GetAJAXResponse(responseText)
    {
        let result = Object;
        try
        {
            result = JSON.parse(responseText);
        }
        catch (err)
        {
            alert("Error from API: " + responseText);
        }

        return result;
    }

    static getQueryStringValue(name)
    {
        let url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        let results = regex.exec(url);
        if (!results)
        {
            return null;
        }
        if (!results[2])
        {
            return "";
        }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    static Logout()
    {
        sessionStorage.clear();
        window.location = "index.html";
    }

    //Functions to run on page load:
    static OnPageFullyLoaded()
    {
        GS1URI_COMMON.GetSessionData();


        if (window.location.href.includes("dashboard.html"))
        {
            //get the session cookie so it is available for JS routines here
            GS1URI_DASHBOARD.ShowInfoInHeader();
            GS1URI_DASHBOARD.GetGS1KeyCodesList();
            GS1URI_DASHBOARD.GetURIList();
        }
        else if (window.location.href.includes("edituri.html"))
        {
            let accountSession = JSON.parse(sessionStorage.getItem("session"));
            page_resolverEndpointURL = accountSession.resolver_endpoint_url;

            GS1URI_EDITURI.GetContextsList();
            GS1URI_EDITURI.GetMimeTypesList();

            GS1URI_EDITURI.GetIanaLanguagesList();
            //.. will call SetIanaLanguageSelectControl()

            //gets the attributes list whose results will later be used by the Response URI.
            //GetLinkTypesList_Response then calls GetResponseUriData:
            GS1URI_EDITURI.GetLinkTypesList();
            //... will call GetResponseUriData();

            //This will start a cascade that will fill in the form from API calls.
            //This is designed this way because the form must wait until the API has responded with the previous
            // function's requested data set. Note that it is the _Response functions that calls the next function.
            GS1URI_EDITURI.GetGS1KeyCodesList();
            //... will call GetRequestUriData()
            //              .... will call SetGS1KeyComponentsButtons()


            //Finally, start a timer to test the presence of the URL resolver for this entry:
            window.setTimeout(GS1URI_EDITURI.TestResolverPageExists, 2000);
            window.setInterval(GS1URI_EDITURI.TestResolverPageExists, 10000);
            window.setInterval(GS1URI_EDITURI.GetURIRequestIdStatus, 10000);
        }
        else if (window.location.href.includes("admin.html"))
        {
            GS1URI_ADMIN.GetAdminData();
        }
        else if (window.location.href.includes("accounts.html"))
        {
            GS1URI_ACCOUNTS.GetGS1MOList();
            GS1URI_ACCOUNTS.LoadOwnAccount();
        }
        else
        {
            GS1URI_HOMEPAGE.ShowAppVersion();
        }
    }

    static isNumeric(n)
    {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

}


//Attach an on page load event which runs after the page is fully loaded into the browser (and not before!)
window.onload = function ()
{
    "use strict";
    GS1URI_COMMON.OnPageFullyLoaded();
};


window.onbeforeunload = function ()
{
    "use strict";
    if (page_unsaved_changes)
    {
        return 'You have unsaved changes - do you still wish to leave this page?';
    }

};

