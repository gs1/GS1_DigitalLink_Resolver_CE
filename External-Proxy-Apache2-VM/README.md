## External Proxy Apache2 service
Depending on your implementation, you are likely to need a proxy server between the internet and your Docker Engine 
container runtime. The most useful reason for a proxy is that it can take on the job of processing secure HTTP
decryption and encryption tasks, passing on 'clear text' versions of incoming requests and outgoing responses to the
id-web-server container running on an internal Docker Engine.

Our simple solution is to have an upstream web server that performs this proxying. This way our Docker Engine and
its containers are not themselves on the internet; instead behind an appropriate firewall that only the proxy server
can reach.

For this reason, you will see that the docker-compose.yml file in the root of this repository sets the only external
IP interface as being on port 8080.

Therefore, the proxy server must proxy (that is, forward) web traffic to the container on port 8080, and reverse-proxy
(that is, forward the response) back to the end-user across the internet.

If you are setting up a simple service to start with, the best way to do this is to:
* Spin up a new Ubuntu local or cloud-based virtual computer
* Install Apache2, git, curl and docker-ce on it<pre>sudo apt update && sudo apt install apache2 git docker-ce curl</pre>
* git pull this repository
* Use <pre>docker-compose build</pre> then <pre>docker-compose up -d</a> to set the service running
* Execute the command to create the SQL <pre>docker exec -it  dataentry-sql-server  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i  /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql</pre>
* Copy the files in this section to the same places on the new server:
* /etc/apache2/sites-available/000-default.conf)
* /var/www/html/* (2 files)
* Run these commands to switch on some important Apache modules, then a restart for Apache to read the changed configuration:
<pre>
a2enmod rewrite expires
a2enmod proxy_http
a2enmod headers
service apache2 restart
</pre> 
...and you should have an (non-encrypted) web site up and running.
* Now you need to choose a domain name and install the SSL certificate (if you are doing this on your own we recommend Let's Encrypt - <a href="https://letsencrypt.org/">follow the instructsions here</a>)

... and now you have a fully working single server operating GS1 Digital Link Resolver CE!

If you want to host the Docker Engine behind the proxy server on a different machine, take a look
at the file etc/apache2/sites-available/000-default.conf in this repository and see how we've set up the proxying for each of the GS1 keys
plus the 'ui' and 'api' data entry services. You will need to change 'localhost:8080' to '<internal serverr IP address>:8080'
Here is a snippet for the GTIN key:
<pre>
                     ProxyPass        /gtin http://localhost:8080/gtin
                     ProxyPassReverse /gtin http://localhost:8080/gtin
                     ProxyPass        /01   http://localhost:8080/01
                     ProxyPassReverse /01   http://localhost:8080/01
 </pre>
