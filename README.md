## 📢 Welcome to GS1 Resolver Community Edition Version 3.0.0 Beta 1

GS1 Resolver is a free and open-source software that allows you to resolve GS1 identifiers to their corresponding web resources. This software is developed by the GS1 Resolver Community and is based on the GS1 Digital Link standard.

### 🚀 What's new in this version?
1. **Completely revised and simplified architecture** for better performance and scalability.
2. **Improved support for GS1 Digital Link and GS1 Web URI** according to the standard published at https://ref.gs1.org/standards/resolver/
1. **Multiple Links**: Serve multiple links from a single context, a notable improvement over the previous single-link limitation. This is particularly useful if your product has multiple certificates or related documents.
2. **Simplified Data Input**: The data input methods have been revamped for user-friendliness. The complex structures of versions 1 and 2 are now obsolete, paving the way for straightforward data entry.
3. **Separate GTIN Qualifiers**: GTIN qualifiers are now independent, free from a fixed 'qualifier path', offering enhanced flexibility.
4. **Unified Database**: Streamline your infrastructure as maintaining both SQL *and* Document databases is no longer necessary—only the Document database is required.
5. **Embrace the Pythonic Way with Python 3.10**: The evolution of the Resolver CE is taking a leap forward in code readability with Python. After discussions and feedback from the dev community implementing Resolver 2.x, we've shed the many layers of Node JavaScript source files in favor of Python's elegant simplicity and fewer script files. Resolver CE v3.0 is written in Python 3.10, adopting a 'pythonic' style of coding that is much easier to read and adjust as required. This isn't just a change; it's an upgrade to high-performance processing that is easier to read, comprehend and adjust.

### 📚 Simplified Architecture
The new architecture is based on a microservices approach. In this solution the data entry service with its API can be separated from the Front-end resolving web service.
The main components, each architected as separate container images, are:
1. **Data Entry Service**: This service is responsible for storing and managing the GS1 identifiers and their corresponding web resources.
2. **Front-end Web Service**: This service is responsible for resolving GS1 identifiers to their corresponding web resources, and redirecting web clients as needed
3. **Single Document Database** : This database is used to store the GS1 identifiers and their corresponding web resources in an IETF LinkSet format.
4. **Frontend Proxy Server**: This server is responsible for routing the incoming requests to the appropriate service when used together in a Docker composition or Kubernetes cluster.

<img alt="GS1 Resolver CE v3.0 Architecture.jpg" height="1080" src="GS1%20Resolver%20CE%20v3.0%20Architecture.jpg" title="The simplified GS1 Resolver Community Edition version 3 architecture diagram" width="1920"/>


Indeed, part of the innovative design is to make it possible to run Resolver CE v3.0 with just two containers:
1. Data Entry service running on your internal network
2. Resolving (web) service on the internet surface at id.<yourdomainname.com>

We can certainly foresee both these containers running as Azure Container Functions or similar inexpensive services on other cloud platforms.

**What about MongoDB?**
You could use a Mongo-cloud based solution such as MongoDB Atlas or Cosmos DB with Mongo APi connector. You then supply the connection string as an environment variable to data entry and web containers.

**What about the Proxy server?**
This container is just there to route incoming requests to data-entry and resolving (web) containers via a single endpoint through Docker or Kubernetes. Most of you have your own "front-door" routing services to your network applications, so you would just use that with appropriate rules.


### What has been simplified compared to previous versions?

#### Two containers are dropped:
1. No relational database so the v1.x/v2.x SQL Server is dropped
2. No separate GS1 Digital Toolkit service - now integrated into data entry and web services
#### No more 'accounts'
1. Originally resolver v1/v2 of needed to be self-standing with independent logins. No more! 
2. There is an authentication key that can be set as a secret and provided by the calling client when acting on the Resolver CE data entry API. Alternatively, you can easily replace our simple 'Bearer' authentication with your own authentication mechanism. You would likely run the data entry service on your internal network and accessed by your existing applications, with only the Resolving web server facing the internet - although they are both accessible via the provided proxy server 'out of the box'.


## What does it mean to be be in 'beta'?
Resolver CE v3.0 is in beta because we are still working on the following:
1. **Testing**: We are still testing the software to ensure that it is stable and reliable.
2. **Documentation**: We are still working on the documentation to make it easier for users to understand how to use the software.
3. **Feedback**: We are looking for feedback from users to help us improve the software.
4. **Standards Compliance** : We are working on ensuring that the software is fully compliant with the GS1 Digital Link standard. Alongside this project, a test suite is being built. We **cannot** bring Resolver CE v3.0 out of beta until it has passed the test suite.


### 📦 Installation
The GS1 Resolver Community Edition is available as a Docker composition. Make sure you have Docker Desktop running, then you can run the software using the following command from the root directory of the project:
```bash
docker compose up -d --build
```
This command will download the base container images from Docker Hub, build the necessary images, and start the services.
Importantly this will run whether you are using x64 (Intel / AMD) or ARM based hardware such as Apple Silicon and Raspberry Pi.

The service will then be available at http://localhost:8080

The API is available with Open API (Swagger) documentation at http://localhost:3000/api/

## What should I do next?
1. **Try it out**: To do this, use the 'setup_test.py' script in the tests folder to add some test data to the database and test Resolver. Indeed, we recommend you read through - then step through - the heavily documented test suite which will give you examples of creating / reading / deleting entries using the API, and observing behaviour through the Resolver front-end service. 
2. **Review the new data entry format** in the /tests folder which gives examples of the new format for data entry - although you will be pleased to know that the API will accept v2.x format data as well.
3. **Look at the convertor scripts** in the useful_external_python_scripts folder. These scripts are useful for converting data between the previous versions of Resolver CE and the new format.
4. **Try out the API yourself**: The API is available with Open API (Swagger) documentation at http://localhost:3000/api/ and, for Postman fans (complete with example data) at https://documenter.getpostman.com/view/10078469/2sA3JKeNb2
5. **Provide feedback**: We are looking for feedback from users to help us improve the software. Please provide feedback by creating an issue on the GitHub repository.

## What are the GS1 Dev team doing next?
1. **Testing**: We are testing the software to ensure that it is stable and reliable - expect regular updates that will be the form of 'beta 2', 'beta 3' etc.
2. **Documentation**: We are working on the documentation to make it easier for users to understand how to use the software.
3. **Building the test suite**: We are building a web-based test suite to ensure that the software is fully compliant with the GS1 Digital Link standard.