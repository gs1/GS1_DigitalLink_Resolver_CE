# The aim of installContainers.ps1 is to set up the test environment automatically on an empty windows box. 
# Everyone should have his/her own standalone resolver environment. without too much hassle.
# Some independent testing might still not hurt.
# 
# Best Regards Sten Walde, Product specialist Standards & Datamodels, GS1 Sweden

Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned # or Unrestricted
 
#############################################
# Install supporting software
 
$Downloads = $env:HOMEDRIVE + $env:HOMEPATH + "\Downloads\"
Set-Location $Downloads
 
# Get Powershell 7
$psURI = "https://github.com/PowerShell/PowerShell/releases/download/v7.3.9/"
$exe = "PowerShell-7.3.9-win-x64.msi"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download Powershell
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install Powershell
Invoke-Expression -Command $installFile

# Get Git for Windows 
$psURI = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/"
$exe   = "Git-2.42.0.2-64-bit.exe"
$uri   = $psURI+$exe
$installFile = $Downloads+$exe
# download Git
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install Git
Invoke-Expression -Command $installFile
 
# Get SQL Server Management Studio SSMS from Microsoft for Windows so you can see inside the SQL Server database.
# https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver15
$psURI = "https://aka.ms/ssmsfullsetup"
$exe = "SSMS-Setup-ENU.exe"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download SSMS
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install SSMS
Invoke-Expression -Command $installFile
 
# Get VS Code
$psURI = "https://code.visualstudio.com/docs/?dv=win"
$exe = "VSCodeUserSetup-x64.exe"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download VS Code
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install VS Code
Invoke-Expression -Command $installFile
 
# or Intellij IDEA https://www.jetbrains.com/idea/
# (Community (free) and Ultimate (licensed) editions) from Jetbrains or Visual Studio Code (free) supported by Microsoft - our chosen development environments which we have deliberately included config files for (.idea and .vscode) within the repo to help you get started quickly. Of course this repo will work with other fully featured IDEs! https://www.jetbrains.com/idea/download/
$psURI = "https://www.jetbrains.com/idea/download/download-thanks.html?platform=windows&code=IIC"
$exe = "ideaIC-2023.2.3.exe"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download Intellij IDEA
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install Intellij IDEA
Invoke-Expression -Command $installFile
 
# Get MongoDB Compass https://www.mongodb.com/products/compass
# a client application from MongoDB Inc for exploring Resolver's database. 
$psURI = "https://downloads.mongodb.com/compass/mongodb-compass-1.36.4-win32-x64.exe"
$exe = "mongodb-compass-1.36.4-win32-x64.exe"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download MongoDB Compass
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install MongoDB Compass
Invoke-Expression -Command $installFile

# Use this connection string to get connected:
mongodb://gs1resolver:gs1resolver@localhost:27017/?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false
 
# Get Postman https://www.postman.com/downloads/ 
# API client which will work directly with GS1 Resolver CE's API documentation at https://documenter.getpostman.com/view/10078469/TVejgpjz 
$psURI = "https://dl.pstmn.io/download/latest/win64"
$exe = "Postman-win64-Setup.exe"
$uri = $psURI+$exe
$installFile = $Downloads+$exe
# download Postman
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install Postman
Invoke-Expression -Command $installFile
 
#############################################
# Fast start
 
# 1. Get Docker Desktop
$psURI = "https://www.docker.com/products/docker-desktop/"
$exe = "Docker Desktop Installer.exe"
$uri ='"' + $psURI + $exe + '"'
$installFile = '"' + $Downloads + $exe + '"'
# download
##### this does not work anymore due to complex new URI, download manually 
##### Invoke-WebRequest -Uri $uri -OutFile $installFile
# install:
Invoke-Expression -Command $installFile
 
# 2. Clone Git Repo
$repoPath = "https://github.com/gs1/"
$repoName = "GS1_DigitalLink_Resolver_CE"
$repoUri = $repoPath + $repoName + ".git"
$repoRoot = $env:HOMEDRIVE + $env:HOMEPATH + "\source\"
 
# change directory to the one at the 'root' of this repository,
if(Test-Path -Path $repoRoot){ 
    Write-Output "$repoRoot exists"  
}else {
    New-Item -Path $repoRoot -ItemType Directory
}
Set-Location $repoRoot

# Now you need to "git clone" this repository onto your computer. The web link is $repoUri
git clone $repoUri $repoName
Set-Location $repoName

# 3. Open a terminal prompt (Mac and Linux) or PowerShell (Windows 10) and change directory to the one at the 'root' 
# of your local cloned copy of this repository, so you can see the file docker-compose.yml in the current folder. 
Get-ChildItem docker-compose.yml

# 4. Type this command:
docker compose config
#...which should simply list the docker-compose.yml without error, and then type this command 

docker info
#which will get Docker to check that all is well with the service and provide some run-time statistics. 
#You may some warnings appear, but if you're not seeing any errors then we're good to go.
 
# 5. Make sure you have a good internet connection, and then type this command:
docker compose build
# ...which will cause Docker to build the complete end-to-end GS1 Resolver service. 
# This will take only a short time given a fast internet connection, most of it taken up with downloading the SQL Server instance.
 
# 6. You are nearly ready to start the application. Before you do, make sure you have no SQL Server service, 
# MongoDB service or port 80 web server running on your computer as they will clash with Docker as it tries to start the service up."

# 7. Let's do this! Run docker-compose with the 'up' command to get Docker to spin up the complete end-to-end application: 
# (the -d means 'disconnect' - docker-compose will start up everything then hand control back to you).
docker compose up -d

# 8. (SQL Server 2017 only) Now wait 10 seconds while the system settles down (the SQL Server service takes a few seconds to initialise when 'new')
Get-Date; Start-Sleep -Seconds 10; Get-Date

# 9. Copy the initialization SQL script into the database container:
docker compose cp ./resolver_sql_server/sqldb_create_script.sql sql-server:sqldb_create_script.sql

# Now run this command which will create the database and some example data:
docker compose exec sql-server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i /sqldb_create_script.sql

# 10 Head to 
curl -I http://localhost/ui 
<# and select the Download page.

11. In the authorization key box, type: 5555555555555  and click the Download button. Save the file to your local computer."
12. Click the link to go back to the home page, then choose the Upload page."
13. Type in your authorization key   5555555555555  , then choose the file you just downloaded. The Upload page detects Download 
  -format file and will set all the columns correctly for you. Have look at the example data in each column and what it means 
  (read the final section of the PDF document for more details about these columns)."
# 14. Click   Check file   followed by   Upload file  ."
# 15. By now the local Mongo database should be built (a build event occurs every one minute) so try out this request in a terminal window:"
#>

curl -I http://localhost/gtin/09506000134376?serialnumber=12345  

# which should result in this appearing in your terminal window:..."

<#
HTTP/1.1 307 Temporary Redirect
Server: nginx/1.19.0
Date: Mon, 09 Nov 2020 16:42:51 GMT
Connection: keep-alive
Vary: Accept-Encoding
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: HEAD, GET, OPTIONS
Access-Control-Expose-Headers: Link, Content-Length
Cache-Control: max-age=0, no-cache, no-store, must-revalidate
X-Resolver-ProcessTimeMS: 9
Link: <https://dalgiardino.com/medicinal-compound/pil.html>; rel="gs1:epil"; type="text/html"; hreflang="en"; title="Product Information Page", <https://dalgiardino.com/medicinal-compound/>;
rel="gs1:pip"; type="text/html"; hreflang="en"; title="Product Information Page", <https://dalgiardino.com/medicinal-compound/index.html.ja>; rel="gs1:pip"; type="text/htm
l"; hreflang="ja"; title="Product Information Page", <https://id.gs1.org/01/09506000134376>; rel="owl:sameAs"
Location: https://dalgiardino.com/medicinal-compound/?serialnumber=12345
#>

<# 
This demonstrates that Resolver has found an entry for GTIN 09506000134376 and is redirecting you to the 
website shown in the 'Location' header. You can also see this in action if you use the same web address.
In your web browser, you should end up at Dal Giordano website. The rest of the information above reveals 
all the alternative links available for this product depending on the context in which Resolver was called."
In this example, try changing the serial number - you will see it change in the resulting 'Location:' header, too! 
This is an example of using 'URI template variables' to forward incoming requests into outgoing responses. 
This is a new feature in Resolver CE v2.2 and later.
In the folder "Example Files to Upload" you will also find an Excel spreadsheet and CSV file with the same data 
- you can upload Excel data too! This particular spreadsheet is the 'official GS1 Resolver upload spreadsheet' 
which is recognised by the Upload page which sets all the upload columns for you. However, any unencrypted 
Excel spreadsheet saved by Excel with extension .xlsx can be read by the upload page."
#>

Exit-PSSession

## Shutting down the service
# 1. To close the entire application down type this:
docker-compose down
# Since the data is stored on Docker volumes, the data will survive the shutdown and be available when you 'up' the service again.

# 2. If you wish to delete the volumes and thus wipe the data, type these commands:
docker volume rm gs1_digitallink_resolver_ce_resolver-document-volume
docker volume rm gs1_digitallink_resolver_ce_sql-server-dbbackup-volume
docker volume rm gs1_digitallink_resolver_ce_sql-server-volume-db-data
docker volume rm gs1_digitallink_resolver_ce_sql-server-volume-db-log
docker volume rm gs1_digitallink_resolver_ce_sql-server-volume-db-secrets

#If the above volumes are the only ones in your Docker Engine then it's quicker to type:
docker volume ls 

# to confirm, then to delete all the volumes type:
docker volume prune 
