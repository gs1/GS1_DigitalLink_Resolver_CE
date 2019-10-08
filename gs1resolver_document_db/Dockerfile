# This dockerfile creates MongoDB v4.2 running in Ubuntu 18.04 (Bionic Beaver) LTS.
# This minimal dockerfile is mainly used to make sure that the image being craeted is competely up to date and
# patched. This file also sets the username and password used by both date_gs1_org and id_gs1_org so if you change it here,
# also change it in the config files for those two projects! Chaage it here:
#     id_gs1_org/config/gs1resolver.ini
#     data_gs1_org/config/api.ini

FROM mongo:4.2-bionic
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# Set MongoDB login credentials
ENV MONGO_INITDB_ROOT_USERNAME=gs1resolver
ENV MONGO_INITDB_ROOT_PASSWORD=gs1resolver

# Update and upgrade repositories as needed:
RUN apt-get update -y && apt-get dist-upgrade -y