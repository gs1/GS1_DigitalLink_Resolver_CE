## Welcome to the GS1 Digital Link Resolver
### Community Edition v2.0 

Welcome! The purpose of this repository is to provide you with the ability to build a complete resolver service that will enable you to enter information about GTINs and other GS1 keys
and resolve (that is, redirect) web clients to their appropriate destinations.

This repository consists of six applications which work together to provide the resolving service:
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
</table>

### Important Notes for existing users of previous version 1.0 and 1.1
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

#### Web Servers

The only outward-facing web server is <i><b>frontend-proxy-server</b></i> which proxies any client requests to the /ui/ data entry web application and /api/ API service 
through to the <b><i>resolver_data_entry_server</i></b> which provides both services. All requests that are not /ui/ or /api/ are sent to <b><i>resolver-web-server</i></b>

#### Build server
The BUILD server looks look for changes in the SQL database and uses it to create documents in the MongoDB database. 
This 'de-coupled' processing means that the data is simple to understand for date entry purposes, but is repurposed into a more complex structure for highly
performant resolving.
MongoDB can perform high-speed lookups and is ideal for the high-performance reading of data.

#### Database servers
This repository includes two extra containers for SQL Server and MongoDB. These are included to help you get up and running quickly to experiment and 
test the service. However, you are strongly advised to move to cloud-based versions of these databases, and change the data connection
strings as stored below:
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

1. Now wait 10 seconds while the system settles down (the SQL Server service takes a few seconds to initialise when 'new') then copy and paste this command, which will run a program inside the SQL Server 
container, creating the database and some example data.<pre>
docker exec -it  resolver-sql-server  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i  /gs1resolver_sql_scripts/sqldb_create_script.sql </pre>

1. Head to http://localhost:8080/ui and select the Download page.
1. In the authorization key box, type: "12345" and click the Download button. Save the file to your local computer.
1. Click the link to go back to the home page, then choose the Upload page.
1. Type in your authorization key (12345), then choose the file you just downloaded. The Upload page detects 'Download' -format file and will set all the columns correctly for you. Have  look at the example data in each column
and what it means (read the final section of the PDF document for more details about these columns).
1. Click 'Check file' followed by 'Upload file'.
1. By now the local Mongo database should be built (a build event occurs every one minute) so try out this request in a terminal window: <pre>curl -I http://localhost:8080/gtin/05000204795370 </pre> which should result in this appearing in your terminal window:
<pre>HTTP/1.1 307 Temporary Redirect
     Server: nginx/1.17.10
     Date: Tue, 21 Apr 2020 06:40:02 GMT
     Connection: keep-alive
     Vary: Accept-Encoding
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: HEAD, GET, OPTIONS
     Access-Control-Expose-Headers: Link, Content-Length
     Cache-Control: max-age=0, no-cache, no-store, must-revalidate
     X-Resolver-ProcessTimeMS: 68
     Link: https://www.sainsburys.co.uk/gol-ui/product/raid-fly---wasp-killer-300ml>; rel="gs1:promotion"; type="text/html"; hreflang="en"; title="Sainsburys Promotion", https://id.gs1.org/01/05000204795370>; rel="owl:sameAs"
     Location: https://www.sainsburys.co.uk/gol-ui/product/raid-fly---wasp-killer-300ml
</pre> This demonstrates that Resolver has found an entry for GTIN 05000204795370 and is redirecting you to the web site showin in the 'Location' header. 
You can also see this in action if you use the same web address in your web browser - you should end up at Sainsbury's online shopping site looking at a can of fly spray.

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

If the above volume are the ony ones in your Docker Engine then it's quicker to type:<pre>docker volume ls </pre> to confirm, then to delete all the volumes type:<pre>docker volume prune </pre> 

