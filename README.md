## Welcome to the GS1 Digital Link Resolver
### Community Edition v1.1

Welcome! The purpose of this repository is to provide you with the ability to build a complete resolver service that will enable you to enter information about GTINs and other GS1 keys
and resolve (that is, redirect) web clients to their appropriate destinations.

This repository consists of five projects which work together to provide the resolving service:
<table border="1">
<tr><th>Folder Name</th><th>Project</th></tr>
<tr><td>dataentry_web_server</td><td>The Data Entry service <b>dataentry-web-server</b> (as used on the domain <a href="https://data.gs1.org">https://data.gs1.org</a>) consisting of an API that provides controlled access to Create, Read, Update and Delete (CRUD) operations on resolver records, along with 
a web-based example user interface that allows easy data entry of this information (and uses the API to perform its operations). 
This project uses a SQL Server database to store information, and the API has a 'Build' command that takes any 
changes to the database and builds a document for each GS1 key and value, which will be used by... </td></tr>
<tr><td>id_web_server</td><td>The resolving service <b>id-web-server</b> (as used on the domain <a href="https://id.gs1.org">https://id.gs1.org</a>) and completely re-written in Node.js for improved performance and scalability which can be used by client applications that supply a GS1 key and value according to the GS1 Digital Link standard. This service performs a high-speed lookup of the specified GS1 key and value, and returns the appropriate redirection where possible.</td></tr>
<tr><td>gs1resolver_dataentry_db</td><td>The SQL database service <b>dataentry-sql-server</b> using SQL Server 2017 Express edition (free to use but with 10GB limit) to provide a stable data storage service for the resolver's data-entry needs.</td></tr>
<tr><td>gs1resolver_document_db</td><td>The <b>id-mongo-server</b> MongoDB database used by the resolver.</td></tr>
<tr><td>frontend_proxy_server</td><td>The frontend web server routing traffic securely to the other containers. Using NGINX, this server's config can be adjusted to support load balancing and more,</td></tr>
</table>

### Important Notes for existing users of previous version 1.0
On 5th February 2020, this repository was updated to reflect big changes to the design and architecture of the service.
These changes were to provide:
* More complete compliance with the GS1 Digital Link standard
* Performance and security improvements
* Rewrite of the id_web_server from PHP 7.3 to Node.JS v13.7
* Removal of separate Digital Link Toolkit server - now integrated into id_web_server
* Removal of experimental unixtime service (unixtime downloads will be revisited at later time)

As a result of these changes, if you are upgrading the service then you need to perform these tasks:

BEFORE YOU 'GIT PULL' an update:
1. Unless you are are using a separate external SQL database, backup the SQL database to an external host location, as you will be deleting its container data volume. Make sure
you have a successful backup by restoring it to another database. This is done at your own risk! 
2. Use 'docker-compose down' to stop and remove the containers using the  docker-compose.yml for the version 1.0 that you are running.
3. Delete all the repository's docker volumes (listed further down this page and in docker-compose.yml)

Now let's build the new service:
1. 'git pull' (or 'git clone' to a new location) this repository.
2. IF using an external Mongo database: Change the connection string which is now in id_web_server/Dockerfile and dataentry_web_server/config/api.ini
3. IF using an external SQL server: Change the connection string which is now in dataentry_web_server/config/api.ini
2. Run 'docker-compose build' to build the new v1.1 service.
3. IF using the dataentry_sql_server container: Restore your database to the SQL server.
4. Wherever your SQL server is, you must run this SQL statement, which will cause the resolver to rebuild all the document data in MongoDB at the next BUILD event (usually once per minute with default settings): <pre>UPDATE [gs1resolver_dataentry_db].[uri_requests] SET [api_builder_processed] = 0
GO</pre> 

Your service should now be fully restored.
 
 

## Architecture

The community edition of the GS1 Digital Link Resolver is an entirely self-contained set of applications, complete with databases and services for data entry and resolving.

We chose a Docker-based <i>containerisation</i> or <i>micro-services</i> architecture model for GS1 Digital Link Resolver for these reasons:
* The need for end-users to build and host a reliable application free from issues with different versions of database drivers and programming languages.
* Should a container fail (equivalent of a computer crash) the Docker Engine can instantly start a fresh copy of the container, thus maintaining service.
* It is simple to scale-up the service  by running multiple instances of containers with load-balancing. 
* Most cloud computing providers have the ability to host containers easily within their service platforms. 

It is for these reasons that this type of architecture has become so popular.

#### Web Servers

The only outward-facing web server is <i><b>frontend-proxy-server</b></i> which proxies any client requests to the /ui/ data entry web application and /api/ API service 
through to the <b><i>dataentry-web-server</i></b> which provides both services. All requests that are not /ui/ or /api/ are sent to <b><i>id-web-server</i></b>


As well as enabling CRUD (Create / Read / Update / Delete) operations on data, <i><b>dataentry-web-server</b></i> also has a BUILD function that runs once per minute as a result of the Docker HEALTHCHECK process set up in the Dockerfile for that container.
BUILD causes <i><b>dataentry-web-server</b></i> to look for changes in the SQL database and uses it to create documents in the MongoDB database. MongoDB can perform high-speed lookups and is ideal for the high-performance reading of data.

#### Database servers
This repository includes two extra containers for SQL Server and MongoDB. These are included to help you get up and running quickly to experiment and 
test the service. However, you are strongly advised to move to cloud-based versions of these databases, and change the data connection
strings as stored below:
* <b>dataentry-web-server</b> stores both SQL and MONGO strings in dataentry_web_server/config/api.ini 
* <b>id-web-server</b> stores its MONGO (only) string in id_web_server/Dockerfile 

##### A note on Microsoft Azure
The MongoDB library/driver code used in the id-web-server and dataentry-web-server containers are 100% compatible with the Microsoft Azure COSMOS DB with Mongo API database service. You simply change the connection string
as if you were using a MongoDB local or cloud server. However you must add the following string text to the END of the connection string
for it to work properly: <pre>&retryWrites=false</pre>

#### Disk volumes
FIve 'disk' volumes are created for internal use by the service database. Three <i><b>gs1resolver-dataentry- prefixed</b></i> volumes stores the SQL database and <i><b>gs1resolver-document-volume</b></i>
stores the Mongo document data so that all the data survives the service being shutdown or restarted. A further volume, <i><b>gs1resolver-dbbackup-volume</b></i> (not shown in the diagram below) is used to store
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
2. <i><b>git clone</b></i> this repository onto your computer.
3. Open a terminal prompt (Mac and Linux) or PowerShell (Windows 10) and change directory to the one at the 'root' of this repository, so you can see
the file <b>docker-compose.yml</b> in the current folder.
4. Type this command:<pre>docker-compose config</pre>...which should simply list the docker-compose.yml without error, and then type this command <pre>docker info</pre>
which will Docker to check that all is well with the service and give some run-time statistics. If you're not seeing any errors then we're good to go.
5. Make sure you have a good internet connection, and then type this command:<pre>docker-compose build</pre>...which will cause Docker to build the complete end-to-end GS1 Resolver service.
This will take quite a while with lots of text flowing up the terminal window as downloading and compiling of the service takes place. Even on a high speed
connection the build-from-scratch will take 10-15 minutes.
6. Once completed, type this to start everything up:<pre>docker-compose up -d</pre>(the -d means 'disconnect' - docker-compose will start up everything then hand control back to you). 

7. Now wait 10 seconds while the system settles down (the SQL Server service takes a few seconds to initialise when 'new') then copy and paste this command, which will run a program inside the SQL Server 
container, creating the database and some example data described in [data_gs1_org/README.md](dataentry_web_server/README.md) 
<pre>
docker exec -it  dataentry-sql-server  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i  /gs1resolver_sql_scripts/gs1resolver_dataentry_db_build_script.sql
</pre>
8. Now open a web browser and direct it to this web address: <a href="http://localhost:8080/ui/">http://localhost:8080/ui/</a> (the trailing / is important!) and login as one of the test accounts described in [data_gs1_org/README.md](dataentry_web_server/README.md)
9. To close the entire application down type this: <pre>docker-compose down</pre> Since the data is stored on Docker volumes, the data will survive the shutdown and be available when you 'up' the service again.
10. If you wish to delete the volumes and thus wipe the data, type these commands: 
<pre>
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dataentry-volume-db-data
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dataentry-volume-db-log
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dataentry-volume-db-secrets
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dbbackup-volume
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-document-volume
</pre>

If the above volume are the ony ones in your Docker Engine then it's quicker to type:<pre>docker volume ls </pre> to confirm, then to delete all the volumes type:<pre>docker volume prune </pre> 

## Next steps
* Read through the README.md and Dockerfiles for each project in this repository; many originate from when they were separate projects and will prove interesting reading. Especially note the example data installed into the service when you run the SQL script: Welcome to the world of <i>GS1 Westeros</i>!

## Windows Server (and Azure)
Unfortunately, running Docker containers within the Windows Server environment is challenging at this time because these projects use much more widely-adopted Linux containers
which can't run natively in Windows Server without additional complex configuration. If you are allowed only Windows Server machines then the options are:
* Use the Programs and Features configuration settings to run Hyper-V, the virtual machine Hypervisor, then install and run a Ubuntu virtual machine
* Clone a copy of this repository and create Windows containers. At this time how much work required to change the Dockerfiles to create Windows containers is unknown, but a welcome extra task!
* Find out if the real reason is that you need to run in Azure? If so, Azure provide a service called 'Web Apps for Containers' which run Linux containers
individually. Web Apps for containers can run both individual containers and also docker-compose, so this service should work natively.
