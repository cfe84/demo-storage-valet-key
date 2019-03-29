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

Note that to be allowed to upload directly to blob storage, 
[CORS needs to be setup](https://docs.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services) 
appropriately on the Storage Account.

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

# To deploy the demo

This demo contains a provisioning script that will automatically provision the necessary
resources and deploy the application. You need an Azure Subscription for that.

For it to work you have two options:

1. **If you have the Azure CLI installed and setup on a Linux terminal on your machine (either Linux,
    a VM, or the WSL)**. then make sure you are currently
    selecting the subscription on which you want the demo to be deployed, clone the Git repo,
    then simply run `./provision.sh`.

2. **If you don't have the Azure CLI installed**, go to the [Azure Shell](https://shell.azure.com),
    select the subscription on which you want to provision the demo, then select "Bash" as
    the shell type, and finally, run 
    `git clone https://github.com/cfe84/demo-storage-valet-key.git && cd demo-storage-valet-key && ./provision.sh`.

# To cleanup the demo

The provisioning script creates a cleanup script to delete all the resources it created.

Run `./cleanup.sh` on the same place you ran the initial command (local CLI, or Azure Shell).

Alternatively, simply delete the resource group that was created.

# To run the demo locally

This requires dotnet core 2.2 on the machine you are running.

You need to provision a storage account and a container within it. If you have not ran the
provisioning script, copy the appSettings template file into the `src` directory and rename
it `appsettings.Development.json`, replace the `_APPSTORAGECONNECTIONSTRING_` and `_UPLOADCONTAINERNAME_`
by respectively the connection string from the storage account you want to use, and the container name
of the storage container you created.

Go to the `src` folder and run `dotnet restore`, then `dotnet run`. The application should start
on port 5000, so navigate to `http://localhost:5000` ; potentially ignore HTTPS warnings.