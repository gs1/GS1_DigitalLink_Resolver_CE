##Welcome to the GS1 Digotal Link Resolver - Community Edition
Welcome! The purpose of this repository is to enable you to build a complete resolver service that will enable you to entrr information about GTINs aand other GS1 keys
and resolve (that is redirect) web clients to their appropriate destinations.

This repository consists of three projects which work together to provide the resolving service:
* data_gs1_org - an API that provides controlled access to Create, Read, Update and Delete (CRUD) operations on resolver records. along with 
a web-based example user interface that allows easy date entry of this information (and uses the API to perform its operations). This
project uses a SQL Server database to store information, and the API has a 'Build' command that takes any changes to the database
and builds a document for each GS1 key and value, which will be used by.... 
* id_gs1_org - the resolver end-point which can be used by client applications that supply a gs1 key and value according to digital link 
standards. This service performs a high-speed lookup of the wanted GS1 key and value, and returns the appropriate redirect where possible.
* gs1resolver_dataentry_db - a database setvice using SQL Server 2017 Express edition )with 10GB limit) to provide a stable data storage
service for the resolver's data-entry needs.
* gs1resolver_document_db - the MongODB database used by the resolver.
* dl_toolkit_server - a Node.JS (JavaScript) application running internally within the service to support id_gs1_org's ability to 
understand incming digital ink requests.


## Fast start
* Install the Docker system on your computer. Head to https://www.docker.com/products/docker-desktop for install details for Windows and Mac.
If you are using linux, follow install instructions here: https://docs.docker.com/install/linux/docker-ce/ubuntu/
* Git Pull the repository onto your computer.
* Open a terminal prompt (Mac and Linux) or PowerShell (Windows 10) and change directory to the one at the 'root' of this repository, so you can see
the file <b>docker-compose.yml</b> in the current folder.
* Type this command:<pre>docker-compose config</pre>, which should simply list the docker-compose.yml without error, and then type this xommand <pre>docker info</pre>
which will cause docker to check that all is well with the service and give some starts. If you're not seeing any errors then we're good to go.
* Make sure you have a good internet connection, and then type this command:<pre>docker-compose build</pre> which will cause Docker to build the complete end-to-end docker service.
This will take quite a while with lots of text flowing up the terminal window as downloading and compiling of the service takes place. Even on a high speed
connection the build-from-scratch will take 10-15 minutes.
*Once completed, type this to start everything up:<pre>docker-compose up</pre>As everything starts up, lots of text will once again flow up the terminal window.
Let it settle down.
*Now open a second terminal / powershell window! At the new command prompt, type this command, which will run a program inside the SQL Server 
container, creating the database and some example data described in the file data_gs1_org/README.md <pre>docker exec -it gs1resolver_dataentry_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i  /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql</pre>
* Now take a browser and head to this web address: http://localhost:8080/ui and login as one of the test accounts described in data_gs1_org/README.md
* You're in! (To be continued)
* To clse the service down, go back to the first terminal /powershell window and press Ctrl-C. This will shut the service down. 

## Useful Docker commands:
docker exec -it gs1resolver_dataentry_db  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql

docker exec -it gs1resolver_dataentry_db  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU

docker exec -it data_gs1_org tail -f -n50 /var/log/apache2/error.log

docker exec -it gs1resolver_document_db mongo -u gs1resolver -p gs1resolver

