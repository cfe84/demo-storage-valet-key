using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace demo_storage_valet_key.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        IStorageProvider storageProvider;
        public FilesController(IStorageProvider storageProvider)
        {
            this.storageProvider = storageProvider;
        }

        [HttpGet("{name}/downloadUrl")]
        public async Task<ActionResult<StorageUrl>> GetDownloadUrlAsync(string name)
        {
            // IRL you would validate access rights before returning the SAS.
            return await storageProvider.GetDownloadUrlAsync(name);
        }

        [HttpGet("{name}/uploadUrl")]
        public async Task<ActionResult<StorageUrl>> GetUploadUrlAsync(string name)
        {
            // IRL you would validate access rights before returning the SAS.
            return await storageProvider.GetUploadUrlAsync(name);
        }

        public async Task<ActionResult<string[]>> ListFilesAsync()
        {
            return (await storageProvider.GetFileListAsync()).ToArray();
        }
    }
}
