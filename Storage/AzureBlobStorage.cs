using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;

namespace demo_storage_valet_key {
    class AzureBlobStorage : IStorageProvider
    {
        readonly CloudBlobClient client;
        readonly CloudBlobContainer container;
        const int SAS_VALIDITY_MINUTES = 15;
        public AzureBlobStorage(string storageConnectionString, string containerName) {
            var account = CloudStorageAccount.Parse(storageConnectionString);
            client = account.CreateCloudBlobClient();
            container = client.GetContainerReference(containerName);
            container.CreateIfNotExistsAsync().Wait();
        }
        
        private StorageUrl GetSASAsync(string filename, SharedAccessBlobPermissions permissions)
        {
            var blob = container.GetBlockBlobReference(filename);
            var SAS = blob.GetSharedAccessSignature(new SharedAccessBlobPolicy {
                Permissions = permissions,
                SharedAccessExpiryTime = DateTime.Now.AddMinutes(SAS_VALIDITY_MINUTES),
                SharedAccessStartTime = DateTime.Now.AddMinutes(-2)
            });
            var result = new StorageUrl {
                Container = container.Name,
                Account = blob.Uri.Host,
                Sas = SAS,
                Url = blob.Uri + SAS
            };
            return result;
        }

        public Task<StorageUrl> GetDownloadUrlAsync(string filename)
            => Task.FromResult(GetSASAsync(filename, SharedAccessBlobPermissions.Read));

        public Task<IEnumerable<string>> GetFileListAsync()
        {
            var blobs = container.ListBlobs();
            return Task.FromResult(blobs.Select(blob => ((CloudBlockBlob)blob).Name));
        }

        public Task<StorageUrl> GetUploadUrlAsync(string filename)
            => Task.FromResult(GetSASAsync(filename, SharedAccessBlobPermissions.Write))    ;
    }
}