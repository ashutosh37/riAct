import { z } from 'zod'
import { ShareServiceClient } from '@azure/storage-file-share'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'

class AzureFileShareUpload_Tools implements INode {
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
        this.label = 'Azure File Share Upload'
        this.name = 'azureFileShareUpload'
        this.version = 1.0
        this.type = 'AzureFileShareUpload'
        this.icon = 'azurefileshare.svg'
        this.category = 'Tools'
        this.description = 'Upload file to Azure File Share'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(AzureFileShareUploadTool)]
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
                label: 'File Share Name',
                name: 'fileShareName',
                type: 'string',
                placeholder: 'myfileshare'
            },
            {
                label: 'Folder Path',
                name: 'folderPath',
                type: 'string',
                optional: true,
                placeholder: 'documents/subfolder'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const { 
            storageAccountName, 
            storageAccountKey, 
            fileShareName, 
            folderPath 
        } = nodeData.inputs as any

        return new AzureFileShareUploadTool(
            storageAccountName, 
            storageAccountKey, 
            fileShareName, 
            folderPath
        )
    }
}

class AzureFileShareUploadTool {
    private storageAccountName: string
    private storageAccountKey: string
    private fileShareName: string
    private folderPath: string

    constructor(
        storageAccountName: string, 
        storageAccountKey: string, 
        fileShareName: string, 
        folderPath: string = ''
    ) {
        this.storageAccountName = storageAccountName
        this.storageAccountKey = storageAccountKey
        this.fileShareName = fileShareName
        this.folderPath = folderPath
    }

    schema = z.object({
        fileName: z.string().describe('Name of file to upload'),
        fileContent: z.string().describe('Content of file to upload')
    })

    name = 'azure_file_share_upload'
    description = 'Upload a file to Azure File Share'

    async _call({ fileName, fileContent }: { fileName: string, fileContent: string }) {
        try {
            console.log('Storage Account Name:', this.storageAccountName);
            console.log('File Share Name:', this.fileShareName);
            console.log('Folder Path:', this.folderPath);
            console.log('File Name:', fileName);
            console.log('File Content:', fileContent); 
            const connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.storageAccountName};AccountKey=${this.storageAccountKey};EndpointSuffix=core.windows.net`
            const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString)
            
            const shareClient = shareServiceClient.getShareClient(this.fileShareName)
            await shareClient.createIfNotExists()

            const directoryClient = shareClient.getDirectoryClient(this.folderPath)
            await directoryClient.createIfNotExists()
            const fileBuffer = Buffer.from(fileContent, 'utf-8');

            const fileClient = directoryClient.getFileClient(fileName);
            await fileClient.create(fileBuffer.length); 
                // Upload the buffer to the file
            await fileClient.uploadRange(fileBuffer, 0, fileBuffer.length);
            
            const fullPath = `https://${this.storageAccountName}.file.core.windows.net/${this.fileShareName}/${this.folderPath}/${fileName}`;
            console.log(fullPath);
            return `File ${fileName} uploaded successfully at ${fullPath}`
        } catch (error) {
            throw new Error(`Azure File Share Upload Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
}

module.exports = { nodeClass: AzureFileShareUpload_Tools }