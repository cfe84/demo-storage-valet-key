function callBackendAsync(apiUrl,
    method = "GET", 
    body = null, 
    contentType = "application/json", 
    headers = []) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open(method, "/api" + apiUrl, true);
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
                    reject({
                        status: 200
                    })
                }
            }
        };
        if (body) {
            xhttp.setRequestHeader("content-type", contentType);
        }
        for(let header of headers) {
            xhttp.setRequestHeader(header.header, header.value);
        }
        xhttp.send(body);
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

const uploadFile = () => {
    const fileUploadElement = document.getElementById('file');
    const file = fileUploadElement.files[0];
    operations.getUploadUrlAsync(file.name).then((url) => {
        const customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
        const blobService = AzureStorage.Blob.createBlobServiceWithSas(url.account, url.sas);
        blobService.singleBlobPutThresholdInBytes = customBlockSize;
        blobService.createBlockBlobFromBrowserFile(url.container, file.name, file, {blockSize : customBlockSize}, function(error, result, response) {
            if (error) {
                alert(error);
            } else {
                refreshFiles();
            }
        });
    })
}

const downloadFile = (filename) => {
    operations.getFileDownloadUrlAsync(filename).then((url) => {
        window.location.href = url.url;
    })
}

const refreshFiles = () => {
    operations.listFilesAsync()
        .then((files) => {
            document.getElementById("files").innerHTML = files
                .map((file) => `<div onclick="downloadFile('${file}')">${file}</div>`)
                .join("\n");
        })
}

window.onload = () => {
    refreshFiles();
}