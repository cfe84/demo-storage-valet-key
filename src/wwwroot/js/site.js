function callBackendAsync(apiUrl) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/api" + apiUrl, true);
        xhttp.onreadystatechange = () => {
            if(xhttp.readyState === XMLHttpRequest.DONE) {
                if (xhttp.status === 200) {
                    if (xhttp.responseText) {
                        const res = JSON.parse(xhttp.responseText);
                        resolve(res);
                    } else {
                        resolve();
                    }
                }
                else {
                    reject({ status: xhttp.status });
                }
            }
        };
        xhttp.send();
    })
}

const operations = {
    listFilesAsync: async () => {
        return await callBackendAsync(`/files/`);
    },
    getFileDownloadUrlAsync: async (filename) => {
        return await callBackendAsync(`/files/${filename}/downloadUrl`);
    },
    getUploadUrlAsync: async (filename) => {
        return await callBackendAsync(`/files/${filename}/uploadUrl`);
    }
}

const uploadFile = (file) => {
    operations.getUploadUrlAsync(file.name).then((url) => {
        const KIBIBYTE = 1024;
        const MEBIBYTE = 1024 * KIBIBYTE;
        // Sizing in chunks of 4MB for large files, 512kb for smaller files.
        const options = { blockSize : file.size >  32 * MEBIBYTE ? 4 * MEBIBYTE : 512 * KIBIBYTE };
        const blobService = AzureStorage.Blob.createBlobServiceWithSas(url.account, url.sas);
        blobService.singleBlobPutThresholdInBytes = options.blockSize;
        const upload = blobService.createBlockBlobFromBrowserFile(url.container, file.name, file, options, (error) => {
            if (error) {
                alert(error);
            } else {
                events.refreshFiles();
            }
        });

        const progressElement = document.getElementById("progress");
        upload.on("progress", () => {
            const progress = upload.getCompletePercent();
            progressElement.style.width = `${progress}%`;
        })
    })
}

const downloadFile = (filename) => {
    operations.getFileDownloadUrlAsync(filename)
        .then((url) => {
            window.location.href = url.url;
        })
        .catch((error) => alert(error))
}

const events = {
    uploadFileButtonClicked: () => {
        const fileUploadElement = document.getElementById('file');
        const file = fileUploadElement.files[0];
        uploadFile(file);
    },
    refreshFiles: () => {
        operations.listFilesAsync()
            .then((files) => {
                document.getElementById("files").innerHTML = files
                    .map((file) => `<li><a href="#" onclick="downloadFile('${file}')">${file}</a></li>`)
                    .join("\n");
                })
            .catch((error) => alert(error));
    }
}

window.onload = () => {
    events.refreshFiles();
}