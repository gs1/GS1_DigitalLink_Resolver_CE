# Welcome to the Dockerfile script that will get the GS1 Resolver data entry applications up and running in
# a Docker image and container. Before you start, there are some prerequisites you need to set.
# 1. You have read the README.md file before starting here1
# 2. You have entered the MongoDb connection string into config/gs1resolver.ini file
# OK, let's do this! We'll start with the excellent PHP team's own docker image which is currently Debian 10 with
# PHP7.3 and Apache web server already installed and configured for optimal performance.
FROM php:7.3-apache

# These two environment variable ensure that the installation of the packages we need is all automatic and doesn't need
# any interaction from us:
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y
# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# Install utilities we'll be using, which we'll use to pull various applications from the internet as part of the install.
# In addition we install dos2unix which just makes sure the text and script files are in native linux format. We'll
# use that utility later when copyiing files into the container.
RUN apt-get -y update
RUN apt-get -y install apt-utils
RUN apt-get -y install curl dos2unix apt-transport-https libssl-dev pkg-config zlib1g-dev libicu-dev g++ dos2unix tzdata

# Now we'll use PECL (PHP Extension Community Library) to install MongoDB, the MongoDB Database driver for PHP.
# When this section of the Dockerfile runs, you will see a lot of downloading and compiling of source code into binary
# libraries. Everything is done for us, but it will take a minute or two.
RUN pecl install mongodb

# This line makes the MongoDB driver visible to PHP
RUN echo "extension=mongodb.so" > /usr/local/etc/php/conf.d/20-mongodb.ini

# We need to install the INTL extension for PHP. Since this Docker image was created by the PHP people themselves,
# they have written some PHP configure/install docker utilties inside the image which we may as well take advantage of.
# These are not part of a standard PHP install!
RUN docker-php-ext-configure intl
RUN docker-php-ext-install intl

# Install locales  - add your own locale if not already listed here. There must be at least one!
RUN apt-get install -y locales
RUN locale-gen en_US.UTF-8 en_GB.UTF-8 de_DE.UTF-8 es_ES.UTF-8 fr_FR.UTF-8 it_IT.UTF-8 km_KH sv_SE.UTF-8 fi_FI.UTF-8

# Configure apache's localhost name, so it doesn't throw a warning constantly about not having a host name.
RUN echo "ServerName unixtime-web-server" | tee /etc/apache2/conf-available/servername.conf
RUN a2enconf servername

# Enable apache's rewrite, proxy and headers modules
RUN a2enmod rewrite expires
RUN a2enmod proxy_http
RUN a2enmod headers

# Configure apache's virtual host for the resolver
# by copying and enabling our own version of the apache config file: apache-unixtime-gs1-org.conf
COPY docker_config/apache-unixtime-gs1-org.conf /etc/apache2/sites-available/
RUN a2dissite 000-default
RUN a2ensite apache-unixtime-gs1-org.conf

# We're done installing packages so now just a final tune-up to make sure we have the latest versions of everything
RUN apt-get -y upgrade
RUN apt-get -y autoremove

# now it's time to start copying the files, so we move the working directory in the image to /var/www
WORKDIR /var/www

# Copy the resolver application and convert from Windows to Linux format
# - note that dos2unix causes the Docker progress output script to show red rather than white
#   text when it announces that it has converted each file. This is not an issue!
COPY unixtime /var/www/html/
RUN find /var/www/html/* -type f -print0 | xargs -0 dos2unix

# Copy the config file. Note that this file is stored outside the directories
# used by the web server so cannot be accessed publically. The public directories
# are defined in Apache config file  "docker_config/apache-unixtime-gs1-org.conf"
RUN mkdir config
COPY config /var/www/config/

# Now we need to set the internal digitallink toolkit servers running whenever a container is run from
# this image. These will be used as a pool by Resolver to decode the Digital Links using node.js.
# ENTRYPOINT /bin/bash /var/www/digitallink_toolkit/digilink_toolkit_servers_start.sh


# Alter permissions access. gs1resolver.json gets xtra permissions as PHP code has to update it,
# otherwise read-only everywhere else:
RUN chmod -R 755 /var/www/*

# Open port 80 on the container
# EXPOSE 80

# Set up a health check heartbeat - here it's every 6 seconds - up to you how frequently you want the
# heartbeat to run and what document to call to signify success.
# HEALTHCHECK --interval=60s --timeout=3s --retries=3 CMD curl -f http://localhost/healthcheck.php || exit 1

# We are done! Apache is already up and running as soon as the container starts.
