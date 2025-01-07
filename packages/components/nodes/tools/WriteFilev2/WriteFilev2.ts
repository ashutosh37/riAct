import { z } from 'zod'
import { StructuredTool, ToolParams } from '@langchain/core/tools'
import { Serializable } from '@langchain/core/load/serializable'
import { NodeFileStore } from 'langchain/stores/file/node'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'

abstract class BaseFileStore extends Serializable {
    abstract readFile(path: string): Promise<string>
    abstract writeFile(path: string, contents: string): Promise<void>
}

class WriteFile_Toolsv2 implements INode {
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
        this.label = 'Write File'
        this.name = 'writeFile'
        this.version = 1.0
        this.type = 'WriteFile'
        this.icon = 'writefile.svg'
        this.category = 'Tools'
        this.description = 'Write file to disk .if directory is missing then creates a directory as well'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(WriteFileToolv2)]
        this.inputs = [
            {
                label: 'Base Path',
                name: 'basePath',
                placeholder: `C:\\Users\\User\\Desktop`,
                type: 'string',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const basePath = nodeData.inputs?.basePath as string
        const store = basePath ? new CustomFileStore(basePath) : new CustomFileStore()
        return new WriteFileToolv2({ store })
    }
}

class CustomFileStore extends BaseFileStore {
    private basePath: string;
    lc_namespace: string[];
    // Constructor to handle optional basePath
    constructor(basePath?: string) {
        super();
        // If basePath is provided, use it; otherwise, use the current directory
        this.basePath = basePath || process.cwd();
    }

    async readFile(path: string): Promise<string> {
        const fs = require('fs/promises');
        const fullPath = require('path').join(this.basePath, path);
        return await fs.readFile(fullPath, 'utf8');
    }

    async writeFile(path: string, contents: string): Promise<void> {
        const fs = require('fs');
        const fsPromises = require('fs/promises');
        const pathModule = require('path');

        // Combine basePath and relative path to get the full path
        const fullPath = pathModule.join(this.basePath, path);

        // Extract the directory from the file path
        const dir = pathModule.dirname(fullPath);

        // Check if the directory exists
        if (!fs.existsSync(dir)) {
            console.log(`Directory does not exist, creating: ${dir}`);
            await fsPromises.mkdir(dir, { recursive: true });
        }

        // Write the file
        await fsPromises.writeFile(fullPath, contents);
        console.log(`File successfully written to: ${fullPath}`);
    }
}

// basePath: string;
//lc_namespace: string[];
//constructor(basePath?: string);

interface WriteFileParams extends ToolParams {
    store: BaseFileStore
}


/**
 * Class for writing data to files on the disk. Extends the StructuredTool
 * class.
 */
export class WriteFileToolv2 extends StructuredTool {
    static lc_name() {
        return 'WriteFileTool'
    }

    schema = z.object({
        file_path: z.string().describe('name of file'),
        text: z.string().describe('text to write to file')
    }) as any

    name = 'write_file'

    description = 'Write file from disk'

    store: BaseFileStore

    constructor({ store, ...rest }: WriteFileParams) {
        super(rest)

        this.store = store
    }

    async _call({ file_path, text }: z.infer<typeof this.schema>) {
        await this.store.writeFile(file_path, text)
        return 'File written to successfully.'
    }
}

module.exports = { nodeClass: WriteFile_Toolsv2  }
