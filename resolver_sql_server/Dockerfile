# In v2.6 we have switched the Microsoft SQL Server  edition to 'Azure SQL Edge' which
# works on ARM 64 (e.g. Raspberry Pi 4) and Apple Silicon (latest Mac) processors as well as Intel x64 processors.
# It is fully compatible with our previous choice of 'SQL Server 2017 Developer' edition, but if you are
# running on Intel processors then you can always use the older edition (commented out below).

# Once you have set the servioce running, use a SQL Client to connect to the server using 'sa' and the password
# you set in the environment variable 'MSSQL_SA_PASSWORD' in docker-compose.yml. Once connected, you can create a database
# with sample data by execuitng the script sqldb_create_script.sql stored in the same directory as this Dockerfile.

# FROM mcr.microsoft.com/mssql/server:2017-latest
FROM mcr.microsoft.com/azure-sql-edge:latest

# This root user is needed to for Azure SQL Edge to initialise the first time. Once initialised you can comment out this line
# since the initial configuration persists on docker volumes (see docker-compose.yml)
USER root

ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# This password is used by the dataentry_web_server to login to the database as 'sa'.
ENV MSSQL_SA_PASSWORD=its@SECR3T!

# We are using Express edition. If you have a licence then you can change to other allowed editions
# See: https://hub.docker.com/_/microsoft-mssql-server
ENV MSSQL_PID=Express

# This is the sys.language from Transact-SQL - 1033 is English. You may wish to alter this.
# More here: https://docs.microsoft.com/en-us/sql/relational-databases/system-compatibility-views/sys-syslanguages-transact-sql?view=sql-server-2017
ENV MSSQL_LCID=1033

# If you have lots of memory in host environment running this container, this can go higher. Lower memory limits can place limits on the SQL Server's in-memory sorting
# capabilities and thus slow it down. However, if you are not processing big data changes updates through the server then this is fine. The stored procedures used by
# tha data entry API data_gs1_org have been designed to minimise processing load as much as possible.
ENV MSSQL_MEMORY_LIMIT_MB=1024

# Enabling MSSQL Agent will allow scheduled tasks to be conducted such as performing regular backups (Not imeplmented yet in this project yet)
# More at: https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-run-sql-server-agent-job?view=sql-server-2017
# BUT NOTE: SQL Azure Edge does not include the SQL Agent, only standard SQL Server 201x editions do.
ENV MSSQL_AGENT_ENABLED=true


