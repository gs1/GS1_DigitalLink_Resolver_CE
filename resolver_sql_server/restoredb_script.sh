/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -Q "RESTORE DATABASE [gs1-resolver-ce-v2-db] FROM DISK='/dbbackup/gs1resolverdb.bak' WITH NORECOVERY, REPLACE"
