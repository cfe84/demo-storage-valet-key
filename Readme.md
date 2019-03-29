Demonstrates the [valet key pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/valet-key) with Azure Blob Storage 
and using the Azure Storage SDK on the client side for upload.

![](/sas.jpg)

The principal interest of this pattern is to offload data transfer from the application,
reducing both the requirements on the application servers (memory, caching, networking) and
the complexity on the application (handling streaming, caching, memory optimization, etc.).

# Overview

To upload a file, the webpage is asking for a write-only Shared Access Signature (SAS) from the API.
This SAS is a token that allows its bearer to write directly to Blob storage for a limited period of time (in this
demo, 15 minutes). The webpage then uses that URL with the 
[Azure Blob Storage SDK](https://github.com/Azure/azure-storage-node/blob/master/browser/README.md) to upload the file,
possibly doing so in multiple blocks (this is abstracted away from you, so there's no complexity
there).

The API is only returning Shared Access Signatures. In this
demo it is not doing any validation. In real life it should
validate that user has permissions to download/upload files.

To download a file, the webpage is asking the API for a read-only SAS, then redirects the browser
to this URL, which triggers the download directly from blob storage.

# What's the interesting code for me?

Have a look at:
- `/wwwroot/js/site.js`
- Classes in `/Storage`
- `/Controllers/FilesController`

Note that this example is not implementing any access control. In real-life,
the API would validate that the user has relevant permissions to upload / list / access the files
they are requesting, before issuing SAS or file list.