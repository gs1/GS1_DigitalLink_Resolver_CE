# Welcome to the Dockerfile script that will get the GS1 Resolver data entry applications up and running in
# a Docker image and container. You will have course have read everything in README.md before you got here...!

# OK, let's do this! We'll start with the excellent linux operating system Ubuntu v18.04 with its long-term support
FROM ubuntu:18.04

# These two environment variables ensure that the installation of the packages we need is all automatic and doesn't need
# any interaction from us:
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y
# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# Install curl and git, which we'll use to pull various applications from the internet as part of the install.
# apt-utils extends the capability of the aptitude package installer to configure packages when installing them.
# Locales allow international language sets (used later in this Dockerfile).
# Install PHP 7.2 (the target version for the PHP scripts in this repositiry) and dos2unix utility (the latter makes sure
# that windows CRLF line endings are converted to LF since our various config and PHP script files will be running in Ubuntu.
# We'll run dos2unix later in this Dockerfile.
# Install apt-transport-https required for CURL-downloading the Microsoft msodbcsql packages
RUN apt-get update -y && apt-get install -y \
    apt-utils \
    locales \
    curl git \
    tzdata \
    php7.2 \
    php7.2-dev \
    php7.2-xml \
    php7.2-json \
    dos2unix \
    php7.2-curl \
    apt-transport-https \
    libapache2-mod-php7.2 \
    apache2

# We now add the Microsoft package list for Ubuntu 18.04 from their servers.
# This will help apt find the required msodbcsql packages
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
RUN curl https://packages.microsoft.com/config/ubuntu/18.04/prod.list > /etc/apt/sources.list.d/mssql-release.list

# Install msodbcsql and associated Microsft SQL Server tools
# Add the ODBC (Open DataBase Connectivity) drivers we need that support the SQL database language the applications use.
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql17 mssql-tools unixodbc-dev

# We need to add msssql-tools to path so they can be found by client applications
RUN echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bash_profile
RUN echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc


# Add extension info for SQL Server to the PHP ini files
RUN echo extension=sqlsrv.so >> `php --ini | grep "Scan for additional .ini files" | sed -e "s|.*:\s*||"`/20-sqlsrv.ini

# Now we'll use PECL (PHP Extension Community Library) to install sqlsrv, the Microsoft SQL Server driver for PHP.
# When this section of the Dockerfile runs, you will see a lot of downloading and compiling of source code into binary
# libraries. Everything is done for us, but it will take a minute or two.
RUN pecl install sqlsrv

# Copy 20-sqlsrv.ini to the Apache location for loading when Apache calls into PHP to run the PHP scripts
RUN cp /etc/php/7.2/cli/conf.d/20-sqlsrv.ini /etc/php/7.2/apache2/conf.d

# Now we add the sqlsrv extension info to apache2/php.ini
RUN echo "extension=sqlsrv.so" >> /etc/php/7.2/apache2/php.ini


# Now we use PECL to install the MongoDB drivers which will be used by the builder script which will take changed
# data in SQL Server and build resolver documents ready for GS1 Resolver to use. Again lots of downloading and
# compiling of source code will take place.
RUN pecl install mongodb

# Extend the php.ini file for apache2 with the new mongodb extension
RUN echo "extension=mongodb.so" >> /etc/php/7.2/apache2/php.ini


# Initially configure the Apache webserver
RUN a2dismod mpm_event
RUN a2enmod mpm_prefork
RUN a2enmod php7.2


# Install locales  - add your own locale if not already listed here. There must be at least one!
RUN locale-gen en_US.UTF-8 en_GB.UTF-8 de_DE.UTF-8 es_ES.UTF-8 fr_FR.UTF-8 it_IT.UTF-8 km_KH sv_SE.UTF-8 fi_FI.UTF-8

# Configure apache's localhost name, so it doesn't throw a warning constantly about not having a host name.
RUN a2enmod rewrite expires
RUN echo "ServerName dataentry-web-server" | tee /etc/apache2/conf-available/servername.conf
RUN a2enconf servername

# Configure apache's virtual host for the our applications 'api' and 'ui' (as well as web root)
# by copying and enabling our own version of the apache config file: resolver_ui_api.conf
COPY docker_config/resolver_ui_api.conf /etc/apache2/sites-available/
RUN a2dissite 000-default
RUN a2ensite resolver_ui_api.conf

# Open port 80 on the container
# Rmove the comment if running this container alone (not part of docker-compose)
# EXPOSE 80

# Set the working directory for Docker to start copying files from this project into the container
WORKDIR /var/www/

# Install the API application and convert from Windows to Linux format
# - note that dos2unix causes the Docker progress output script to show red rather than white
#   text when it announces that it has converted each file. This is not an issue!
RUN mkdir api
COPY api /var/www/api/
RUN find /var/www/api/* -type f -print0 | xargs -0 dos2unix

# Install the UI application and convert from Windows to Linux format
RUN mkdir ui
COPY ui /var/www/ui/
RUN find /var/www/ui/* -type f -print0 | xargs -0 dos2unix

# Install 'root' application files that visitors will see when they just type the
# domain name into their browser. Whatever files you save in the project's /wwwroot folder
# will be available here. Note that, since Apache web server gets installed, the installer
# sets up an 'index.html' page which shows that the web server is working along with
# technical info (not something you would wish to show your end users at the root home page!
# So that default page file gets removed before file(s) are copied from the /wwwroot folder.
# Of course you can add your own index.html which will be the 'default' file home page,
# and index.php will be the default if you don't have an index.html file.
RUN rm /var/www/html/index.html
COPY wwwroot /var/www/html/

# Copy the config file. Note that this file is stored outside the directories
# used by the web server so cannot be accessed publically. The public directories
# are defined in Apache config file  "docker_config/resolver_ui_api.conf"
RUN mkdir config
COPY config /var/www/config/

# Set all the file permissions for good security
RUN chmod -R 755 /var/www/*

# Set up a HEALTHCHECK heartbeat - here it's every 60 seconds - which tests the health of the application
# ...actually this does a lot more, as the HEALTHCHECK command is actually instantiating a BUILD command
# which takes changes found in the SQL database and applies them to the MongoDB database for use by the
# resolver.

# So take care here: If you are planning on running a number of containers at once to scale up or
# scale out this UI/API application then you need to comment this build command heathcheck and just use a
# conventional healthcheck such as the one below it commented out. Now, if you forget to do this, each
# container is going to instantiate the build command every minute, creating random effects (as they are not
# necessarily synchronised) and put unnecessary strain on the SQL Server database. You only want one Build
# command running, not one in every container!

# If you DON'T implement this Healthceck for the reasons stated then you must implement the BUILD function
# somewhere else in your installation. For example, it could even call across the internet using the external HTTPS
# domain name you have set up for this UI/API application. Supposing you have set up this application at:
# https://www.example.com - in which case you could set up, on another server, a Windows scheduled task or
# Linux CRON job with this command which you have setup to run once per minute 24 hours a day:

# curl --header "Content-Type: application/json" --request POST --data '{ "command": "build", "build_auth_key": "ohf78qhrnhmrq8grnc97gc9wg7fmc79gfc9" }' https://www.example.com/api/api.php
# NB: The build_auth_key value in either the Healthcheck or the external calling task must match the one in config/api.ini file!
HEALTHCHECK --interval=60s --timeout=3s --retries=3 CMD curl --header "Content-Type: application/json" --request POST --data '{ "command": "build", "build_auth_key": "ohf78qhrnhmrq8grnc97gc9wg7fmc79gfc9" }' http://localhost/api/api.php || exit 1

# Here's a conventional healthcheck you can use instead that just makes sure the application is running OK:
# HEALTHCHECK --interval=60s --timeout=3s --retries=3 CMD curl http://localhost/api/api.php || exit 1

# Finally set the apache webserver running.
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]

# That's it! Hopefully this Dockerfile ran without issues.
# Contact Nick Lansley at nick@lansley.com if you get any problems.
