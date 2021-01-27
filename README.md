## Welcome to the GS1 Digital Link Resolver
### Community Edition v2.3 

Welcome! The purpose of this repository is to provide you with the ability to build a complete resolver service that will enable you to enter information about GTINs and other GS1 keys
and resolve (that is, redirect) web clients to their appropriate destinations.

### Version 2.3 Features
1. New JSON output format conforming to the IETF Linkset standard.
2. New extended format for Mongo documents that reduces the processing
   overhead of the resolving web server, thus improving performance.
3. New HTTP 303 'See Other' return code enabling clients to get more general info
   about an entry, if the specific lot or serial number is not present (part of the 'walking up the tree' functionality).
4. New HTTP 410 'Gone Away' return code if entry is present in the database but its 'active'
   flag is set to false (as compared to HTTP 404 'Not Found') when no entry exists at all.
5. Improvements to GS1 Digital Link Toolkit library.
6. Various bug fixes and improvements to the applications thanks to developer and triallists feedback.

### Version 2.2 Features
1. URI Template Variables - instead of using static values for qualifiers such as serial number, you can use a string value wrapped in curly braces like this: {myvar}. See the example in the CSV file resolverdata.csv in the 'Example Files To Upload'
2. Simplified linktype=all JSON document
3. New linktype=linkset JSON document 
3. Massively reduced container image sizes. Using the latest version of Node and NPM with its updated packages, we can now run most of the service in the tiny Alpine Linux containers.
4. Better access to SQL via pooling - this makes better use of cloud-based databases such as SQL Azure (as well as dedicated databases)  
5. Lots of optimisations, enhancements and security improvements.   
6. Optimised for working in Kubernetes clusters - tested on DigitalOcean and Microsoft Azure Kubernetes offerings.

This repository consists of seven applications which work together to provide the resolving service:
<table border="1">
<tr><th>Folder Name</th><th>Project</th></tr>
<tr><td>resolver_data_entry_server</td><td>The Data Entry service <b>dataentry-web-server</b> consisting of an API that provides controlled access to Create, Read, Update and Delete (CRUD) operations on resolver records, along with 
a web-based example user interface that allows easy data entry of this information (and uses the API to perform its operations). 
This project uses a SQL Server database to store information</td></tr>
<tr><td>build_sync_server</td><td>This service runs a 'Build' process once a minute (configurable in Dockerfile) that takes any changes to the date in teh SQL database and builds a document for each GS1 key and value, which will be used by... </td></tr>
<tr><td>resolver_web_server</td><td>The resolving service <b>resolver-web-server</b> is completely re-written in Node.js for improved performance and scalability which can be used by client applications that supply a GS1 key and value according to the GS1 Digital Link standard. This service performs a high-speed lookup of the specified GS1 key and value, and returns the appropriate redirection where possible.</td></tr>
<tr><td>resolver_sql_server</td><td>The SQL database service <b>dataentry-sql-server</b> using SQL Server 2017 Express edition (free to use but with 10GB limit) to provide a stable data storage service for the resolver's data-entry needs.</td></tr>
<tr><td>resolver_mongo_server</td><td>The <b>resolver-mongo-server</b> MongoDB database used by the resolver.</td></tr>
<tr><td>frontend_proxy_server</td><td>The frontend web server routing traffic securely to the other containers. Using NGINX, this server's config can be adjusted to support load balancing and more,</td></tr>
<tr><td>digitallink_toolkit_server</td><td>A library server available to all the other container applications that tests incoming data against the official reference implementation of the GS1 Digital Link standard</td></tr>
</table>
<hr />

### Important Notes for existing users of previous versions 1.0 and 1.1
This is a brand new resolving architecture, not backwards compatible with version 1.0 or 1.1
as it is updated to reflect big changes to the design and architecture of the service.
These changes were to provide:
* More complete compliance with the GS1 Digital Link standard
* Performance and security improvements
* Rewrite of the id_web_server from PHP 7.3 to Node.JS v13.7
* Removal of separate Digital Link Toolkit server - now integrated into id_web_server
* Removal of experimental unixtime service (unixtime downloads will be revisited at later time)

If you are using earlier versions of Resolver, contact Nick Lansley (nick@lansley.com) for advice
on copying the data from the old SQL format to the new much simpler SQL format. You should stop
using the older v1.x service and transition to this version as soon as possible.
<hr />

### Important Notes for existing users of previous version 2.0
The main upgrade of the service is to resolver_data_entry_server which has been upgraded to support batch
uploading of data and a validation process which you can optionally harness to check uploaded entries 
before they are published. This has resulted in a data structure change that includes '_prevalid' suffix
named SQL tables into which data is uploaded. A validation process is then kicked off which, if successful
for each entry, copies the data into the non _prevalid suffix SQL tables.

To install this new update, make sure all your data is backed up(!), then use the 'docker-compose build' and 'docker-compose run -d' commands over the top of your existing
installation, then run the SQL create script as documented in Fast Start step 7 below. This will create a SQL database called "gs1-resolver-ce-v2-1-db" alongside
your existing SQL database "gs1-resolver-ce-v2-db" with the updated structure. The containers point to the new SQL database but the
Mongo database is unchanged and will continue serving existing data. You will have an extra step of copying data
between the databases but, apart from the _prevalid tables, you will find the structure familiar. Note that
a few column names have been changed to conform better to GS1 naming conventions for data properties, but the
data in the columns is unchanged in format.

Note also that you only see one running instance of the resolver-web-server rather than five, unlike v2.0. The running of multiple
servers has become unnecessary thanks to the latest Node v14 V8 engine and a lot of code optimisation. Fast!

Finally, by popular request, docker-compose exposes the web service on port 80, no longer port 8080. It also exposes SQL Server and MongoDB on their default
ports, so use your favourite SQL Server client and Mongo DB to connect to localhost with credentials supplied in the SQL and Mongo Dockerfiles.
<hr />

### Important Notes for existing users of previous version 2.1
In v2.2 the new JSON format for linktype=all has been highly simplified and is a breaking change if you have a client that
expects the previous format. The unixtime batch format also uses the new format.

We have upgraded the security of the service in many ways. An important new environment
variable in the Dockerfile of resolver_data_entry_server is:
<pre>ENV CSP_NONCE_SOURCE_URL="localhost"</pre>
Wherever you run Resolver, you must change its domain name in this variable
to match it's 'live' domain name, or else the Data Entry UI JavaScript will be blocked from executing.

#### Emptying SQL table [server_sync_register] to initiate MongoDB rebuild:
The SQL database is unchanged, but we've greatly simplified the data stored in MongoDB. This changed document format is smaller and simpler to both use and understand!
So you need to force the Build application to rebuild the Mongo database or the new Resolver web server won't understand it. This is simple to do - using either the API or direct server access, empty the table
[gs1-resolver-ce-v2-1-db].[dbo].[server_sync_register]

For example, using the free SQL Server Management Studio, head into the database and use this command:
<pre>truncate table [gs1-resolver-ce-v2-1-db].[dbo].[server_sync_register]</pre>   
- OR -
Using the API with your Admin auth key, use the endpoint to list the servers:
<pre>curl --location --request GET 'https://resolver-domain-name/admin/heardbuildsyncservers'

[
  {
    "resolverSyncServerId": "qlh00O7z3JGk",
    "resolverSyncServerHostname": "build-sync-server-deployment-798854fb75-bvk4m",
    "lastHeardDatetime": "2020-06-15T08:35:12.840Z"
  }
]

</pre>
...then delete each server using its resolverSyncServerId value:
<pre>curl --location --request DELETE 'https://resolver-domain-name/admin/heardbuildsyncserver/qlh00O7z3JGk'</pre>
- OR -
If you are running Resolver in Docker on your local machine, then you can use the docker volume command to remove the volume that Mongo stores its data in.
Make sure that the service is completely down using <pre>docker-compose down</pre> then use this command:
<pre>docker volume ls</pre>
..and look for a volume that should be called 'gs1_digitallink_resolver_ce_resolver-document-volume'. You can then delete it like this:
<pre>docker volume rm gs1_digitallink_resolver_ce_resolver-document-volume</pre>
Finally, build and restart the new service:
<pre>
docker-compose build
docker-compose run -d
</pre>
Mongo will initialise a fresh new empty database which the Build application will detect and perform a full rebuild.
<hr />

### Important Notes for existing users of previous version 2.2
Just as for users upgrading to version 2.2, you will need to empty the table:
<pre>[gs1-resolver-ce-v2-1-db].[dbo].[server_sync_register]</pre>
Please follow the instructions for doing this in 'Important Notes for existing users of previous version 2.1' 
section 'Emptying SQL table [server_sync_register]' to initiate MongoDB rebuild of its data. 

<hr />

## Documentation
Please refer to the document 'GS1 Resolver - Overview and Architecture.pdf' in the root of this 
repository. This README contains a useful subset of information contained there, but please
refer to that PDF for more complete reading. 

## Architecture

The community edition of the GS1 Digital Link Resolver is an entirely self-contained set of applications, complete with databases and services for data entry and resolving.

We chose a Docker-based <i>containerisation</i> or <i>micro-services</i> architecture model for GS1 Digital Link Resolver for these reasons:
* The need for end-users to build and host a reliable application free from issues with different versions of database drivers and programming languages.
* Should a container fail (equivalent of a computer crash) the Docker Engine can instantly start a fresh copy of the container, thus maintaining service.
* It is simple to scale-up the service  by running multiple instances of containers with load-balancing. 
* Most cloud computing providers have the ability to host containers easily within their service platforms. 

It is for these reasons that this type of architecture has become so popular.

![GS1 Resolver Community Edition v2.0 Architecture](Resolver%20v2.0.jpg)

#### Note: In the above diagram you will see five running resolver-web-servers. Unlike v2.0., the running of multiple web servers in v2.1 has become unnecessary thanks to the latest Node V8 engine and a lot of code optimisation! There is now just one resolver-web-server set up by docker-compose.
                                                                              
#### Web Servers
The only outward-facing web server is <i><b>frontend-proxy-server</b></i> which proxies any client requests to the /ui/ data entry web application and /api/ API service 
through to the <b><i>resolver_data_entry_server</i></b> which provides both services. All requests that are not /ui/ or /api/ are sent to <b><i>resolver-web-server</i></b>

#### Build server
The BUILD server looks look for changes in the SQL database and uses it to create documents in the MongoDB database. 
This 'de-coupled' processing means that the data is simple to understand for date entry purposes, but is repurposed into a more complex structure for highly
performant resolving.
MongoDB can perform high-speed lookups and is ideal for the high-performance reading of data.

#### Data Entry API
The Data Entry API is published here: https://documenter.getpostman.com/view/10078469/TVejgpjz

#### Database servers
This repository includes two extra containers for SQL Server and MongoDB. These are included to help you get up and running quickly to experiment and 
test the service. However, you are strongly advised to move to cloud-based versions - especially for SQL server, and change the data connection
strings as stored below. MongoDB can be left local as long as the volume it stores data on can be made 'permanent'.
* <b>resolver_data_entry_server</b> stores the required SQL connection resolver_data_entry_server/Dockerfile 
* <b>build_sync_server</b> stores both SQL and MONGO connection strings in build_sync_server/Dockerfile 
* <b>the five resolverN-web-server</b> stores their MONGO (only) string in resolver_web_server/Dockerfile 


#### Disk volumes
Five 'disk' volumes are created for internal use by the service database. Three <i><b>resolver-sql-server-volume-db-</b></i> prefixed volumes stores the SQL database and <i><b>resolver-document-volume</b></i>
stores the Mongo document data so that all the data survives the service being shutdown or restarted. A further volume, <i><b>resolver-sql-server-dbbackup-volume</b></i> is used to store
a backup of the SQL Server database.


#### SQL Server Database backup and restore
There are two *not-fully-tested-yet*  backup and restore scripts for the SQL Server. To backup the server:
<pre>docker exec -it  dataentry-sql-server  /bin/bash /gs1resolver_data/setup/gs1resolver_dataentry_backupdb_script.sh</pre>
.. and to restore it (there are issues with restore which are being worked on!)
<pre>docker exec -it  dataentry-sql-server  /bin/bash /gs1resolver_data/setup/gs1resolver_dataentry_restoredb_script.sh</pre>



## Fast start 
1. Install the Docker system on your computer. Head to https://www.docker.com/products/docker-desktop for install details for Windows and Mac.
If you are using Ubuntu Linux, follow install instructions here: https://docs.docker.com/install/linux/docker-ce/ubuntu/ - Note that if you wish to
install on Windows Server editions, read the section on Windows Server at the foot of this README file. 
1. <i><b>git clone</b></i> this repository onto your computer.
1. Open a terminal prompt (Mac and Linux) or PowerShell (Windows 10) and change directory to the one at the 'root' of this repository, so you can see
the file <b>docker-compose.yml</b> in the current folder.
1. Type this command:<pre>docker-compose config</pre>...which should simply list the docker-compose.yml without error, and then type this command <pre>docker info</pre>
which will Docker to check that all is well with the service and give some run-time statistics. If you're not seeing any errors then we're good to go.
1. Make sure you have a good internet connection, and then type this command:<pre>docker-compose build</pre>...which will cause Docker to build the complete end-to-end GS1 Resolver service.
This will take quite a while with lots of text flowing up the terminal window as downloading and compiling of the service takes place. Even on a high speed
connection the build-from-scratch will take 10-15 minutes.
1. You are nearly ready to start the application. Before you do, make sure you have no SQL Server service, MongoDB service or port 80 web server running on your computer
as they will clash with Docker as it tries to start the service up. Once completed, type this to start everything up:<pre>docker-compose up -d</pre>(the -d means 'disconnect' - docker-compose will start up everything then hand control back to you). 

1. Now wait 10 seconds while the system settles down (the SQL Server service takes a few seconds to initialise when 'new') then copy and paste 
this command which will cause you to enter the container and access its terminal prompt:<pre>docker exec -it  resolver-sql-server bash</pre>
Now run this command which will create the database and some example data:<pre>/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i  /gs1resolver_sql_scripts/sqldb_create_script.sql </pre>
You will see a messages such as '(1 rows affected)' and a sentences that starts 'The module 'END_OF_DAY' depends on the missing object...'. These are all fine - the latter messages are shown because some
stored procedures are created by the SQL script before others - and some stored procedures depend on others not created yet. As long as the final line says 'Database Create Script Completed' all is well!
Exit the container with the command:<pre>exit</pre> 
1. Head to http://localhost/ui and select the Download page.
1. In the authorization key box, type: "5555555555555" and click the Download button. Save the file to your local computer.
1. Click the link to go back to the home page, then choose the Upload page.
1. Type in your authorization key (5555555555555), then choose the file you just downloaded. The Upload page detects 'Download' -format file and will set all the columns correctly for you. Have  look at the example data in each column
and what it means (read the final section of the PDF document for more details about these columns).
1. Click 'Check file' followed by 'Upload file'.
1. By now the local Mongo database should be built (a build event occurs every one minute) so try out this request in a terminal window: <pre> curl -I http://localhost/gtin/09506000134376?serialnumber=12345 </pre> which should result in this appearing in your terminal window:

<pre>
HTTP/1.1 307 Temporary Redirect
Server: nginx/1.19.0
Date: Mon, 09 Nov 2020 16:42:51 GMT
Connection: keep-alive
Vary: Accept-Encoding
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: HEAD, GET, OPTIONS
Access-Control-Expose-Headers: Link, Content-Length
Cache-Control: max-age=0, no-cache, no-store, must-revalidate
X-Resolver-ProcessTimeMS: 9
Link: &#60;https://dalgiardino.com/medicinal-compound/pil.html>; rel="gs1:epil"; type="text/html"; hreflang="en"; title="Product Information Page", &#60;https://dalgiardino.com/medicinal-co
mpound/>; rel="gs1:pip"; type="text/html"; hreflang="en"; title="Product Information Page", &#60;https://dalgiardino.com/medicinal-compound/index.html.ja>; rel="gs1:pip"; type="text/htm
l"; hreflang="ja"; title="Product Information Page", &#60;https://id.gs1.org/01/09506000134376>; rel="owl:sameAs"
Location: https://dalgiardino.com/medicinal-compound/?serialnumber=12345
</pre> 

This demonstrates that Resolver has found an entry for GTIN 09506000134376 and is redirecting you to the web site shown in the 'Location' header. 
You can also see this in action if you use the same web address (in your web browser - you should end up at Dal Giardino web site, this particular page written in Vietnamese!).
 The rest of the information above reveals all the alternative links available for this product depending on the context in which Resolver was called.

In this example, try changing the serial number - you will see it change in the resulting 'Location:' header, too! This is an example of using 'URI template variables'
to forward incoming requests into outgoing responses. This is new to Resolver CE v2.2!

In the folder "Example Files to Upload" you will also find an Excel spreadsheet and CSV file with the same data - you can upload Excel data too! This particular spreadsheet
is the 'official GS1 Resolver upload spreadsheet' which is recognised by the Upload page which sets all the upload columns for you. However, any unencrypted
Excel spreadsheet saved by Excel with extension .xlsx can be read by the upload page.

####Shutting down the service  
1. To close the entire application down type this: <pre>docker-compose down</pre> Since the data is stored on Docker volumes, the data will survive the shutdown and be available when you 'up' the service again.
1. If you wish to delete the volumes and thus wipe the data, type these commands: 
<pre>
docker volume rm gs1resolvercommunityeditionv20_resolver-document-volume
docker volume rm gs1resolvercommunityeditionv20_resolver-sql-server-volume-db-data
docker volume rm gs1resolvercommunityeditionv20_resolver-sql-server-volume-db-log
docker volume rm gs1resolvercommunityeditionv20_resolver-sql-server-volume-db-secrets
docker volume rm gs1resolvercommunityeditionv20_resolver-sql-server-dbbackup-volume
</pre>

If the above volumes are the only ones in your Docker Engine then it's quicker to type:<pre>docker volume ls </pre> to confirm, then to delete all the volumes type:<pre>docker volume prune </pre> 

<hr />

## Fast Start: Kubernetes (Beta)

##### DISCLAIMER: These Kubernetes YAML scripts are currently under test and experimentation to get the best results. Be careful if you run these scripts on a cloud service as it could cause them to create costly resources. You need to be skilled and experienced with Kubernetes to continue! You can also run Kubernetes on your own computer - these scripts have been tested with Docker Desktop for Windows 10 running in 'Kubernetes' mode.

The service is now ready for use with Kubernetes clusters. The container images are now maintained on Docker Hub and
the supplied YAML files in this repository will get you up and running quickly.

1. Make sure you are pointing at the correct K8s cluster context:<pre>docker context ls</pre> 
1. Run this command to get your cluster to install the images and build the complete K8s application:<pre>kubectl apply -k ./</pre>
Note: It can take several minutes for the SQL Server pod to be set running. Until then expect 'ContainerCreating' status when you list the running pods.
Use the command 'kubectl get pods' regularly until the SQL Server pod has status 'Running'. You are always recommended to use SQL Server in a separate cloud resource such as SQL Azure and not in a pod! 
1. Once your cluster is up and running, you will need to run the SQL script to create the database with some example data. To do this, you need to find the SQL Server pod:<pre>kubectl get pods</pre>...and locate a pod with 'sql-server' in its name, then use that name in this command:<pre>kubectl exec -it  POD_name_containing_sql-server /bin/bash</pre>
...then once you have a command prompt inside the pod:<pre>/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i  /gs1resolver_sql_scripts/sqldb_create_script.sql</pre>... and once that script has completed, exit the pod with:<pre>exit</pre>
