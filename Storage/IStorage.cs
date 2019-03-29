using System.Collections.Generic;
using System.Threading.Tasks;

namespace demo_storage_valet_key {
    public interface IStorageProvider {
        Task<StorageUrl> GetDownloadUrlAsync(string filename);
        Task<StorageUrl> GetUploadUrlAsync(string filename);
        Task<IEnumerable<string>> GetFileListAsync();
    }
}