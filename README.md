## Welcome to the GS1 Digital Link Resolver - Community Edition

Welcome! The purpose of this repository is to provide you with the ability to build a complete resolver service that will enable you to enter information about GTINs and other GS1 keys
and resolve (that is, redirect) web clients to their appropriate destinations.

This repository consists of five projects which work together to provide the resolving service:
<table border="1">
<tr><td>data_gs1_org</td><td>The Data Entry service <b>dataentry-web-server</b> (as used on the domain <a href="https://data.gs1.org">https://data.gs1.org</a>) consisting of an API that provides controlled access to Create, Read, Update and Delete (CRUD) operations on resolver records, along with 
a web-based example user interface that allows easy data entry of this information (and uses the API to perform its operations). 
This project uses a SQL Server database to store information, and the API has a 'Build' command that takes any changes to the database and builds a document for each GS1 key and value, which will be used by... </td></tr>

<tr><td>id_gs1_org</td><td>the resolver service <b>id-web-server</b> (as used on the domain <a href="https://id.gs1.org">https://id.gs1.org</a>) which can be used by client applications that supply a GS1 key and value according to the GS1 Digital Link standard. This service performs a high-speed lookup of the specified GS1 key and value, and returns the appropriate redirection where possible.</td></tr>

<tr><td>gs1resolver_dataentry_db</td><td>database service <b>dataentry-sql-server</b> using SQL Server 2017 Express edition (free to use but with 10GB limit) to provide a stable data storage service for the resolver's data-entry needs.</td></tr>
<tr><td>gs1resolver_document_db</td><td>the <b>id-mongo-server</b> MongoDB database used by the resolver.</td></tr>

<tr><td>dl_toolkit_server</td><td>the <b>gs1dl-toolkit-server</b> service hosting a Node.JS (JavaScript) application running internally within the service to support id_gs1_org's ability to understand incoming GS1 Digital Link requests.</td></tr>
</table>

## Architecture

The community edition of the GS1 Digital Link Resolver is an entirely self-contained set of applications, complete with databases and services for data entry and resolving.

We chose a Docker-based <i>containerisation</i> or <i>micro-services</i> architecture model for GS1 Digital Link Resolver for these reasons:
* The need for end-users to build and host a reliable application free from issues with different versions of database drivers and programming languages.
* Should a container fail (equivalent of a cpmputer crash) the Docker Engine can instantly start a fresh copy of the container, thus maintaining service.
* It is simple to scale-up the service  by running multiple instances of containers with load-balancing. 
* Most cloud computing providers have the ability to host containers easily within their service platforms. 

It is for these reasons that this type of architecture has become so popular.

#### Web Servers
The only outward-facing web server is the <i><b>id-web-server</b></i> container. Any client requests to the /ui/ data entry web application and /api/ API service are proxied through to the <b><i><b>dataentry-web-server</b></i></b> by the <i><b>id-web-server</b></i>. Any other calls to the service are processed by <i><b>id-web-server</b></i> itself.

A third web server, <i><b>gs1dl-toolkit-server</b></i>, is a separate service used internally by <i><b>id-web-server</b></i> to detect and return distinct GS1 Digital Link elements which
<i><b>id-web-server</b></i> uses for further processing. Indeed, <i><b>gs1dl-toolkit-server</b></i> hosts a set of ten node.js (JavaScript) web servers across ten internal-only IP ports from 3000 to 3009 on the service's private <i><b>gs1-resolver-network</b></i>.
Processing threads in <i><b>id-web-server</b></i> can choose any of the ten ports at random, which speeds throughput given that each node.js endpoint is a single-threaded application.

As well as enabling CRUD (Create / Read / Update / Delete) operations on data, <i><b>dataentry-web-server</b></i> also has a BUILD function that runs once per minute as a result of the Docker HEALTHCHECK process set up in the Dockerfile for that container.
BUILD causes <i><b>dataentry-web-server</b></i> to look for changes in the SQL database and uses it to create documents in the MongoDB database. MongoDB can perform high-speed lookups and is ideal for the high-performance reading of data.

#### Database servers
This repository includes two extra containers for SQL Server and MongoDB. These are included to help you get up and running quickly to experiment and 
test the service. However, you are strongly advised to move to cloud-based versions of these databases, and change the data connection
strings in the .ini file in each of the dataentry-web-server and id-web-server (see their respective README.md files).

##### A note on Microsoft Azure
The MongoDB code in these web servers are 100% compatible with the Microsoft Azure COSMOS DB service. You simply change the connection string
as if you were using a MongoDB local or cloud server. However you must ass the following string text to the end of the connection string
for it to work properly: 

#### Disk volumes
Three 'disk' volumes are created for internal use by the service database. Volume <i><b>gs1resolver-dataentry-volume</b></i> stores the SQL database and <i><b>gs1resolver-document-volume</b></i>
stores the Mongo document data so that all the data survives the service being shutdown or restarted. A further volume, <i><b>gs1resolver-dbbackup-volume</b></i> (not shown in the diagram below) is used to store
a backup of the SQL Server database.

![architecture](architecture-ce-edition.png "Architecture")

#### SQL Server Database backup and restore
There are two *not-fully-tested-yet*  backup and restore scripts for the SQL Server. To backup the server:
<pre>docker exec -it  dataentry-sql-server  /bin/bash /gs1resolver_data/setup/gs1resolver_dataentry_backupdb_script.sh</pre>
.. and to restore it (there are issues with restore which are being worked on!)
<pre>docker exec -it  dataentry-sql-server  /bin/bash /gs1resolver_data/setup/gs1resolver_dataentry_restoredb_script.sh</pre>




## Fast start
1. Install the Docker system on your computer. Head to https://www.docker.com/products/docker-desktop for install details for Windows and Mac.
If you are using Ubuntu Linux, follow install instructions here: https://docs.docker.com/install/linux/docker-ce/ubuntu/
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
container, creating the database and some example data described in [data_gs1_org/README.md](data_gs1_org/README.md) 
<pre>docker exec -it  dataentry-sql-server  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i  /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql</pre>
8. Now open a web browser and direct it to this web address: <a href="http://localhost:8080/ui/">http://localhost:8080/ui/</a> (the trailing / is important!) and login as one of the test accounts described in [data_gs1_org/README.md](data_gs1_org/README.md)
9. To close the entire application down type this: <pre>docker-compose down</pre> Since the data is stored on Docker volumes, the data will survive the shutdown and be available when you 'up' the service again.
10. If you wish to delete the volumes and thus wipe the data, type these three commands: 
<pre>
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dataentry-volume
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-dbbackup-volume
docker volume rm gs1_digitallink_resolver_ce_gs1resolver-document-volume
 
</pre>
## Next steps
* Read through the README.md and Dockerfiles for each project in this repository; many originate from when they were separate projects and will prove interesting reading. Especially note the example data installed into the service when you run the SQL script: Welcome to the world of <i>GS1 Westeros<i>!


