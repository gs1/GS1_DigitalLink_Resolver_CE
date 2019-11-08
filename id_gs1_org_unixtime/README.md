### Unixtime
A new feature of GS1 Resolver is to provide a way of downloading all documents, just those documents for a particular
GS1 key, or all documents after a particular date, ideal for synchronisng documents with your own systems.

This server, <b>unixtime-web-server</b> provides this service, with requests proxied through to it by <b>id-web-server</b>.

To use the service just supply a minimum unixtime to this URL:
<pre>https://resolver-domain/unixtime/*unixtime*</pre>

All documents with a unixtime equal to or greater than this value will be returned.

If you want to filter on AICode or AIShortCode (otherwise all come back):
<pre>
https://resolver-domain/unixtime/unixtime/*ai-code*
https://resolver-domain/unixtime/unixtime/*ai-short-code*
</pre>
Examples:
<pre>
https://resolver-domain/unixtime/1573130975
https://resolver-domain/unixtime/1573130975/gtin
https://resolver-domain/unixtime/1573130975/01
</pre>

Currently, the resolver sources this data dynamically but soon this feature will be enhanced to build daily deltas for every midnight GMT unixtime 
value so that the results are sent as flat files saved on content delivery network (CDN) storage, taking the burden off live 
processing. 
Then, any request for unixtime will result in the 'nearest' previous unixtime CDN file being downloaded by the client. 
There will also be an 'all download' special file for requested unixtime 0000000000.