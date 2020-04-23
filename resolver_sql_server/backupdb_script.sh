/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -Q "BACKUP DATABASE [gs1-resolver-ce-v2-db] TO DISK='/dbbackup/gs1resolverdb.bak' WITH FORMAT"
