import { z } from 'zod'
import { BlobServiceClient } from '@azure/storage-blob'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'

class AzureBlobUpload_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Azure Blob Upload'
        this.name = 'azureBlobUpload'
        this.version = 1.0
        this.type = 'AzureBlobUpload'
        this.icon = 'azureblob.svg'
        this.category = 'Tools'
        this.description = 'Upload file to Azure Blob Storage'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(AzureBlobUploadTool)]
        this.inputs = [
            {
                label: 'Storage Account Name',
                name: 'storageAccountName',
                type: 'string',
                placeholder: 'mystorageaccount'
            },
            {
                label: 'Storage Account Key',
                name: 'storageAccountKey',
                type: 'password'
            },
            {
                label: 'Blob Container Name',
                name: 'containerName',
                type: 'string',
                placeholder: 'mycontainer'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const { 
            storageAccountName, 
            storageAccountKey, 
            containerName 
        } = nodeData.inputs as any

        return new AzureBlobUploadTool(
            storageAccountName, 
            storageAccountKey, 
            containerName
        )
    }
}

class AzureBlobUploadTool {
    private storageAccountName: string
    private storageAccountKey: string
    private containerName: string

    constructor(
        storageAccountName: string, 
        storageAccountKey: string, 
        containerName: string
    ) {
        this.storageAccountName = storageAccountName
        this.storageAccountKey = storageAccountKey
        this.containerName = containerName
    }

    schema = z.object({
        fileName: z.string().describe('Name of file to upload'),
        fileContent: z.string().describe('Content of file to upload')
    })

    name = 'azure_blob_upload'
    description = 'Upload a file to Azure Blob Storage'

    async _call({ fileName, fileContent }: { fileName: string, fileContent: string }) {
        try {
            console.log('Storage Account Name:', this.storageAccountName);
            console.log('Container Name:', this.containerName);
            console.log('File Name:', fileName);
            console.log('File Content:', fileContent); 

            // Use the connection string format to connect to Blob Storage
            const connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.storageAccountName};AccountKey=${this.storageAccountKey};EndpointSuffix=core.windows.net`;

            // Create the BlobServiceClient using the connection string
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            
            // Get a reference to the container client
            const containerClient = blobServiceClient.getContainerClient(this.containerName);

            // Create the container if it does not exist
            await containerClient.createIfNotExists();

            // Convert the file content to a buffer
            const fileBuffer = Buffer.from(fileContent, 'utf-8');

            // Get a reference to the blob (file) in the container
            const blobClient = containerClient.getBlockBlobClient(fileName);

            // Upload the content to the blob
            await blobClient.upload(fileBuffer, fileBuffer.length);

            // Output the uploaded file's URL
            const fileUrl = `${blobClient.url}`;
            console.log("File uploaded successfully");

            return `File ${fileName} uploaded successfully at ${fileUrl}`;
        } catch (error) {
            throw new Error(`Azure Blob Upload Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

module.exports = { nodeClass: AzureBlobUpload_Tools }