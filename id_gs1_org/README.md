## Overview
Welcome to the GS1 Resolver service.
The resolver takes incoming requests in a format defined by [GS1 Digital Link](https://www.gs1.org/standards/Digital-Link/), looks up entries in a Document Database and returns a redirect response as fast as possible.

Here are the various elements of the application in their respective folders:
<table>
<tr><td>/resolver</td><td>The GS1 Resolver root web app</td></tr>
<tr><td>/wwwroot</td><td>home page that currently redirects to https://www.gs1.org home page</td></tr>
<tr><td>/config</td><td>A folder containing api.ini which has connection info for the databases.</td></tr>
<tr><td>/docker_config</td><td>Contains an Apache2 config file which Docker will install into the image it builds/td></tr>
<tr><td>/digitallink_toolkit</td><td>A Node.JS JavaScript application pulled from another GS1 repository and saved here for version control reasons</td></tr>
<tr><td>Dockerfile</td><td>Used to build an image for this complete application </td></tr>
</table>

![architecture](architecture.png "Architecture")

This repository covers applications inside an instance of an Rn web server in the id.gs1.org blue lozenge.

## Preparing for Installation
1. You are strongly advised to use containerisation to build this application. Docker images and the containers instantiated from them are easy to support, scale up, scale-out, and are supported by all major cloud computing platforms. This project has been tested on Kuberbetes clusters on cloud provider <i>Digital Ocean</i>, and Container Web Apps on <i>Microsoft Azure</i>.
2. Before you build the resolver, make sure that you have built and started running the gs1resolver_ui_api project first, and that its BUILD() 
function is operating successfully, copying entries from the test database into your MongoDB database successfully.
3. Currently, the web icon image located at resolver/favicon.ico is that of GS1 - please change it to your own! Hint:
You probably already have one on your organisation's web site - download it
using a web browser by heading to https://[your web domain]/favicon.ico then save the favicon.ico to your computer and copy it 
over the top of the current one. 
## Installation
1. Open a Linux terminal window or Windows 10 / Windows Server PowerShell terminal window.
2. Change directory to the top folder of this repository. If you 'ls -l' (Linux) or 'dir' (Windows) you will see Dockerfile listed alongside the various folders, and this file README.md.
3. Type this command (including that full stop (period) at the end): <pre>docker build -t gs1resolver .</pre>
4. If this is the first time you have built the image of this repository, it will take several minutes to download code and run all the commands. If you are rebuilding after a first run, it will be pretty quick.
5. From this image, we can create a container (an instance of the image we have just built, running as a virtual machine - note the slightly different port number - 8090 - so the running container won't clash with the Data Entry container gs1uri_api_ui if you have that running too):<pre>docker run -p 8090:80 gs1resolver</pre>
6. Let's try it! Open up a Web browser and go to  <pre>http://localhost:8090/gtin/07625695556149?linktype=all</pre>
If it all worked, you should see a Web page with information about an 'Ice Axe' product. If so, excellent! If not, head to the troubleshooting page to find out what's not working. 
8. To shut down the container, we need to interrupt the docker run command line (press Ctrl-C to exit to terminal prompt - the container will remain running). Now type this command: <pre>docker container list</pre> which lists the one running container, like this (your list will have different values): <pre>
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                            PORTS                  NAMES
839b65cb3275        gs1resolver       "/usr/sbin/apache2ct…"   5 seconds ago       Up 4 seconds (health: starting)   0.0.0.0:8080->80/tcp   sleepy_neumann</pre>Select
the container ID value (833884bd7575 in this case) and type this command:<pre>docker container stop 839b65cb3275</pre> After a few seconds the container will shut down and return you the terminal prompt.

## Troubleshooting
If you saw errors when you tried the test page at <pre>http://localhost:8090/gtin/07625695556149?linktype=all</pre> then we need to find out what happened. Hopefully, the errors are caused by these issues:
* Is the connection string for MongoDB in config/resolver.ini identical to the one in the GS1 Resolver Data Entry image? 
* Have you logged in to the data entry page for the 'Ice Axe' (GTIN: 07625695556149) and set it Active, as requested by the GS1 Resolver API / UI set up instructions?
* When you look at the 'Ice Axe' product on the data entry screen, is the status still saying "Waiting for Activation"? If this remains the status and a couple of minutes have passed then the Build event may not be running on your computer (or failing because it can't access the MongoDb database either).
* Have you made sure the Healthcheck event in the GS1 Resolver Data Entry Dockerfile was not commented out, otherwise the every-minute Build event on your machine cannot take place. You will need to stop the Data Entry container, uncomment the Healthcheck line, then perform a 'docker build' then 'docker run' as documented in the GS1 Resolver Data Entry respository.
* Is the Web page taking a long time to respond then seems to timeout, when the GS1 Resolver Data Entry web pages are working quite fast? If so it is likely that the MongoDb connection string is not identical to the one in GS1 Resolver Data Entry config file.
* Something is misbehaving in your container and we need to take a look inside! If you arrived here as soon as you saw the errors, then your container is still running, giving you the opportunity to look for errors. The GS1 Resolver is a much simpler application and installation than the Data Entry, so the log data will appear in the terminal window that you executed the 'docker run' command.
 
## The Resolver Document Format
The GS1 Resolver expects to be able to access a document database (also known as a 'NoSQL' database) in which
it expects the information to be resolved to be a specific format. This version of the resolver is designed to
work with popular document database engine MongoDB, which stores documents in a JSON-like format, called BSON.
The difference is that BSON has extra data types that JSON lacks. The good news is that GS1 Resolver's wanted document format
uses none of those extra data types, so BSON and JSON are interchangeable. For this reason the document is shown
and described in its JSON format.

Let's look at an example GS1 Resolver document:
<pre>
{
	"_id": "/01/00037000849988",
	"/": {
		"item_name": "Acme Soapy Suds Laundry Detergent",
		"active": false,
		"responses": {
			"default_linktype": "pip",
			"linktype": {
				"pip": {
					"default_lang": "en",
					"lang": {
						"en": {
							"default_context": "gb",
							"context": {
								"gb": {
									"default_mime_type": "text/html",
									"mime_type": {
										"text/html": {
											"link": "https://acme.com/en-us/shop/type/powder/acme-powder",
											"title": "https://gs1.org/voc/pip",
											"fwqs": 1,
											"linktype_uri": "https://gs1.org/voc/pip"
										}
									}
								}
							}
						}
					}
				},
				"smartlabel": {
					"lang": {
						"en": {
							"default_context": "gb",
							"context": {
								"gb": {
									"default_mime_type": "text/html",
									"mime_type": {
										"text/html": {
											"link": "http://smartlabel.pg.com/00037000849988.html",
											"title": "https://gs1.org/voc/smartLabel",
											"fwqs": 1,
											"linktype_uri": "https://gs1.org/voc/smartLabel"
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	"/lot/1234": {
		"item_name": "Acme Soapy Suds Laundry Detergent - RECALL NOTICE",
		"active": false,
		"responses": {
			"default_linktype": "recall",
			"linktype": {
				"recall": {
					"lang": {
						"en": {
							"default_context": "gb",
							"context": {
								"gb": {
									"default_mime_type": "text/html",
									"mime_type": {
										"text/html": {
											"link": "https://acme.com/en-us/recall-notice",
											"title": "https://gs1.org/voc/recall",
											"fwqs": 1,
											"linktype_uri": "https://gs1.org/voc/recall"
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
} 
</pre>

At the top of the document is its unique <i>primary key</i> with name "_id". Using "_id" tells the document database to store the document in an efficient index for fast retrieval. This primary key value consists of the gs1 key's numeric format ('01' for GTIN) followed by the GS1 key value
(the GTIN itself). Note how this primary key is stored with '/' separators in a 'URI' format that could be appended to a 
domain name by following the GS1 Digital Link standard.

Under "_id" is a list of one or more 'key variants' which are also stored in URI format, and could be appended to the "_id" value to form the complete URI

The first entry URI is always "/" which denotes the 'root variant' and contains generalised links for the product which can be resolved to the calling
client should no other variants match the incoming request. The vast majority of products are likely only to have the root variant present. 

Other variants are stored with specific combinations of URI attributes. For GTIN these are CPV, LOT, and Serial Number which allows entries, for example, with a particular lot number to have a different set of entries than the root variant.
For example, a specific LOT number may be subject to a recall notice.

Within each variant is a hierarchy of data, which consists of:
* Summary data - "item_name" with a suitable product description, and "active" to denote if the Resolver is allowed to use the information in this variant.
* Responses - a list of one or more hierarchical information groups available to help GS1 Resolver send the most appropriate response to the calling client. 
As well as a list of one or more link types, a unique value 'default_linktype' allows the Resolver to choose a LinkType in case the calling client does not request one via the query string 'linktype=<wanted linktype>'.

* LinkType - a value conforming to GS1 Web Vocabulary which describes the <i>type</i> of this link. Examples include a product information page, patient leaflet, or video. Each link type must be chosen from the GS1 Web Vocabulary or Schema.org vocabulary.
* Language - within LinkType is a list of one or more languages. These are two lowercase characters conforming with the IANA Language
List and which are received by the Resolver via a standard HTTP header in the request, or because the client used 'lang=<lang letters>" in 
the query string section of the incoming request. "default_lang" is used to allow the Resolver to choose a language should one not be requested, or the requested language be unlisted.
* Context - within Language is a list of one or more <i>contexts</i>. In this GS1 Resolver, the context is the IANA two-character country or territory name abbreviation received by the Resolver either in an HTTP header or the query string having "context=<context value>". For example, "en-GB" in the incoming request
means that the end user wished to use the British version of English. The context is stored in lowercase in context (e.g. 'gb'). "default_context" is used to allow the Resolver to choose a context should one not be requested, or the requested context is unlisted.
* Mime-Type - within context is a list of one or more <i>Mime-Types</i>, which uses W3C standards for the type of document that the Resolver will redirect the end-user.
Examples include HTML, PDF, audio amongst many others. "default_mime_type" is used to allow the Resolver to choose a mime-type should one not be requested, or the requested mime-type be unlisted.
* Finally, the four essential pieces of information sought by the Resolver are stored: Link, Title, LinkType_URI and a flag called 'FWQS' - 'forward request query strings'.
The GS1 Resolver uses this information to respond to the request. Here are the details of each piece of information:

* "link" - this is the destination URL that the GS1 Resolver will respond with as a redirect.
* "title" - a friendly version of the URL should the link be displayed to the end-user.
* "fwqs" - One feature of this GS1 Resolver is that any query strings it receives in a request are appended
to the end of the destination URL. This flag is useful in many scenarios to pass on extra information to the destination by the originating client.
However, in our trials, we have encountered an instance where the extra information caused a malfunction at the destination web server. 
Setting 'fwqs' to 1 will allow the GS1 Resolver to pass through query strings, but setting it to 0 will cause the Resolver
to suppress any incoming query strings and not forward them. 
