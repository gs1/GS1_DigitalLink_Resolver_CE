## 📢 Welcome to GS1 Resolver Community Edition Version 3.0.0

GS1 Resolver is a free and open-source web-server application that allows you to resolve GS1 identifiers to their corresponding web resources. 

This is really useful for products, services, and other entities that have a GS1 identifier stored in a GS1 Digital Link QR Code.

In simple terms, a consumer scans the GS1 Digital Link QR Code on your product, and GS1 Resolver will redirect them to the correct page on your website,
all without having to change your existing web applications or databases. You simply add the GS1 identifier and the corresponding target URL to the Resolver database.

Even more useful is the fact that the same consumer could scan the QR Code before they purchase the product to check for nutritional red flags, and
after they have purchased to the product to look at recipes! GS1 Resolver signposts people to the appropriate information based on <i>why</i> they scanned
the QR Code.

It means that that consumers, supply chain workers and others can see contextually important information about a product that is
relevant to their needs. One QR Code, infinite possibilities!

This software is developed by the GS1 Resolver Community and aims to be fully conformant with the GS1 Digital Link standard.

### <i>From the official 'GS1-Conformant Resolver Standard' document (link further down this README):

A GS1-Conformant Resolver connects a GS1-identified object or entity to one or more online
resources that are directly related to it. The object or entity may be identified at any level of
granularity, and the resources may be either human- or machine-readable. Examples include
product information pages, instruction manuals, patient leaflets and clinical data, product data,
service APIs, marketing experiences and more. By adhering to a common protocol based on existing
GS1 identifiers and existing Web technologies, each GS1-Conformant Resolver is part of a coherent,
yet distributed, network of links to information resources.</i>

### 🚀 What's new in this version?
1. **Completely revised and simplified architecture** for better performance and scalability.
2. **Improved support for GS1 Digital Link and GS1 Web URI** according to the standard published at https://ref.gs1.org/standards/resolver/
1. **Multiple Links**: Serve multiple links from a single context, a notable improvement over the previous single-link limitation. This is particularly useful if your product has multiple certificates or related documents.
2. **Simplified Data Input**: The data input methods have been revamped for user-friendliness. The complex structures of versions 1 and 2 are now obsolete, paving the way for straightforward data entry.
3. **Separate GTIN Qualifiers**: GTIN qualifiers are now independent, free from a fixed 'qualifier path', offering enhanced flexibility.
4. **Unified Database**: Streamline your infrastructure as maintaining both SQL *and* Document databases is no longer necessary—only the Document database is required.
5. **Embrace the Pythonic Way with Python 3.10**: The evolution of the Resolver CE is taking a leap forward in code readability with Python. After discussions and feedback from the dev community implementing Resolver 2.x, we've shed the many layers of Node JavaScript source files in favor of Python's elegant simplicity and fewer script files. Resolver CE v3.0 is written in Python 3.10, adopting a 'pythonic' style of coding that is much easier to read and adjust as required. This isn't just a change; it's an upgrade to high-performance processing that is easier to read, comprehend and adjust.
6. **Introduction of compression for GS1 Digital Link URls**: The Resolver CE v3.0 now supports the compression of GS1 Digital Link URLs. This feature is particularly useful when you have a long URL that you want to compress to a shorter one. The compressed URL can be used in place of the original URL, and the Resolver CE v3.0 will automatically decompress it when resolving the GS1 identifier. 

### 📚 Simplified Architecture
The new architecture is based on a microservices approach. In this solution the data entry service with its API can be separated from the Front-end resolving web service.
The main components, each architected as separate container images, are:
1. **Data Entry Service**: This service is responsible for storing and managing the GS1 identifiers and their corresponding web resources.
2. **Front-end Web Service**: This service is responsible for resolving GS1 identifiers to their corresponding web resources, and redirecting web clients as needed
3. **Single Document Database** : This database is used to store the GS1 identifiers and their corresponding web resources in an IETF LinkSet format.
4. **Frontend Proxy Server**: This server is responsible for routing the incoming requests to the appropriate service when used together in a Docker composition or Kubernetes cluster.

<img alt="GS1 Resolver CE v3.0 Architecture.jpg" src="GS1%20Resolver%20CE%20v3.0%20Architecture.jpg" title="The simplified GS1 Resolver Community Edition version 3 architecture diagram"/>


Indeed, part of the innovative design is to make it possible to run Resolver CE v3.0 with just two containers:
1. Data Entry service running on your internal network
2. Resolving (web) service on the internet surface at id.<yourdomainname.com>

We can certainly foresee both these containers running as Azure Container Functions or similar inexpensive services on other cloud platforms.

**What about MongoDB?**
You could use a Mongo-cloud based solution such as MongoDB Atlas or Cosmos DB with Mongo APi connector. You then supply the connection string as an environment variable to data entry and web containers.

**What about the Proxy server?**
This container is just there to route incoming requests to data-entry and resolving (web) containers via a single endpoint through Docker or Kubernetes. Most of you have your own "front-door" routing services to your network applications, so you would just use that with appropriate rules.

<hr>
### What has been simplified compared to previous versions?

#### Two containers are dropped:
1. No relational database so the v1.x/v2.x SQL Server is dropped
2. No separate GS1 Digital Toolkit service - now integrated into data entry and web services
#### No more 'accounts'
1. Originally resolver v1/v2 of needed to be self-standing with independent logins. No more! 
2. There is an authentication key that can be set as a secret and provided by the calling client when acting on the Resolver CE data entry API. Alternatively, you can easily replace our simple 'Bearer' authentication with your own authentication mechanism. You would likely run the data entry service on your internal network and accessed by your existing applications, with only the Resolving web server facing the internet - although they are both accessible via the provided proxy server 'out of the box'.

<hr>

### 📦 Installation
The GS1 Resolver Community Edition is available as a Docker composition. Make sure you have Docker Desktop running, then you can run the software using the following command from the root directory of the project:
```bash
docker compose up -d --build
```
This command will download the base container images from Docker Hub, build the necessary images, and start the services.
Importantly this will run whether you are using x64 (Intel / AMD) or ARM based hardware such as Apple Silicon and Raspberry Pi.

The service will then be available at http://localhost:8080

The API is available with Open API (Swagger) documentation at http://localhost:3000/api/

### Postman documentation for the API can be found at: https://documenter.getpostman.com/view/10078469/2sA3JKeNb2

## What should I do next?
1. **Try it out**: To do this, use the 'setup_test.py' script in the tests folder to add some test data to the database and test Resolver. Indeed, we recommend you read through - then step through - the heavily documented test suite which will give you examples of creating / reading / deleting entries using the API, and observing behaviour through the Resolver front-end service. 
2. **Put it to use**: You can now start using Resolver CE v3.0 in your projects. You'll be joining at least three GS1 Member Organisations who are already using Resolver CE v3.0 in various scenarios, and we are looking forward to hearing about your experiences.
3. **Review the new data entry format** in the /tests folder which gives examples of the new format for data entry - although you will be pleased to know that the API will accept v2.x format data as well.
3. **Look at the convertor scripts** in the useful_external_python_scripts folder. These scripts are useful for converting data between the previous versions of Resolver CE and the new format.
4. **Try out the API yourself**: The API is available with Open API (Swagger) documentation at http://localhost:3000/api/ and, for Postman fans (complete with example data) at https://documenter.getpostman.com/view/10078469/2sA3JKeNb2
5. **Provide feedback**: We are looking for feedback from users to help us improve the software. Please provide feedback by creating an issue on the GitHub repository.

## Can I put this GS1 Resolver live?
YES! We recommend that you test the software thoroughly before putting it live. We are looking for feedback from users to help us improve the software. Please provide feedback by creating an issue on the GitHub repository.
Your code review to ensure security and GDPR compliance will also be a key consideration.
The only thing left is to decide on a Fully Qualified Domain Name (FQDN) for your Resolver service (we recommend a FQDN starting 'id' - e.g. 'https://id.mycompany.org' so it can sit alongside, but not disturb, your other web services) and set up the appropriate DNS records to point to your server.
Before you spin up the service, make sure you set environment variable 'FQDN' (currently in web_server/Dockerfile) to your chosen name.
You should also fill in your organisation contact information in web_server/src/public/gs1resolver.json which will be published as part
of the GS1 Resolver standard from https://your-fully-qualified-doman-name/.well-knowsn/gs1resolver

<hr>
## How do I backup the database?
The database is stored in a Docker volume within the composition. To back up the database to a backup archive file on your host computer, you can use the following command which uses 'docker compose exec' to run the 'mongodump' command within the 'database-service' container (some computers hosting docker may have 'docker-compose' rather than 'docker compose'):
```bash
 docker compose exec -T database-service mongodump --host localhost:27017 --username gs1resolver --password gs1resolver --archive=- --gzip > mongobackup.tar.gz
```
... and to restore the database from a backup archive file on your host computer, you can use the following command:
```bash
docker compose exec -T database-service mongorestore --host localhost:27017 --username gs1resolver --password gs1resolver --archive=- --gzip < mongobackup.tar.gz
```

## Looking for version Resolver CE v2.6?
We've stopped development and maintenance on version 2.6, but you can still find the code in the 'v2.6' branch of this repository:<br>
https://github.com/gs1/GS1_DigitalLink_Resolver_CE/tree/v2.6

We recommend that you upgrade to version 3.0 to take advantage of the new features, simplified services and many improvements.

## Settling in with Resolver CE v3.0?
It's now time to point your code branch back to the 'master' branch to keep up with the latest updates and improvements. We are looking forward to your feedback and contributions to the project.


