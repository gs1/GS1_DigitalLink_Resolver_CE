# This Dockerfile will build a Microsoft SQL Server Express edition container and copy across the SQL script
# which you will run inside the container once it is up and running.
# ONLY USE THIS CONTAINER FOR EXPERIMENTATION - Use proper cloud or on-premises-based databases in production
FROM mcr.microsoft.com/mssql/server:2017-latest

ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# This password is used by the dataentry_web_server to login to the database as 'sa'.
ENV MSSQL_SA_PASSWORD=feorfhgofgq348ryfwfAHGAU

# We are using Express edition. If you have a licence then you can change to other allowed editions
# See: https://hub.docker.com/_/microsoft-mssql-server
ENV MSSQL_PID=Express

# This is the sys.langiage from Transact-SQL - 1033 is English. You may wish to alter this.
# More here: https://docs.microsoft.com/en-us/sql/relational-databases/system-compatibility-views/sys-syslanguages-transact-sql?view=sql-server-2017
ENV MSSQL_LCID=1033

# If you have lots of memory in host environment running this container, this can go higher. Lower memory limits can place limits on the SQL Server's in-memory sorting
# capabilities and thus slow it down. However, if you are not processing big data changes updates through the servefr then this is fine. The stored procedures used by
# tha data entry API data_gs1_org have been designed to minimise processing load as much as possible.
ENV MSSQL_MEMORY_LIMIT_MB=1024

# These data directories cause data to be stored on an external disk volume, so that the container can be restarted
# wihout forgetting anything!
ENV MSSQL_BACKUP_DIR=/gs1resolver_data/backup
ENV MSSQL_DATA_DIR=/gs1resolver_data/data
ENV MSSQL_LOG_DIR=/gs1resolver_data/log
ENV MSSQL_DUMP_DIR=/gs1resolver_data/dump

# Enabling MSSQL Agent will allow scheduled tasks to be conducted such as performing regukar backups (Not imeplmented yet in this project yet)
# More at: https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-run-sql-server-agent-job?view=sql-server-2017
ENV MSSQL_AGENT_ENABLED=true

# Copy the scripts and convert them to unix format
RUN apt-get update -y && apt-get dist-upgrade -y && apt-get install -y dos2unix
COPY gs1resolver_dataentry_db_build_script.sql /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql
COPY gs1resolver_dataentry_backupdb_script.sh /gs1resolver_data/setup/gs1resolver_dataentry_backupdb_script.sh
COPY gs1resolver_dataentry_restoredb_script.sh /gs1resolver_data/setup/gs1resolver_dataentry_restoredb_script.sh
RUN find  /gs1resolver_data/setup/* -type f -print0 | xargs -0 dos2unix
