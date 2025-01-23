import { z } from 'zod';
import { Tool, ToolParams } from '@langchain/core/tools';
import axios from 'axios';
import cheerio from 'cheerio';
import { INode, INodeData, INodeParams } from '../../../src/Interface';
import { getBaseClasses } from '../../../src/utils';

// Define the parameters for the AustLII Search Tool
interface AustLiiSearchParams extends ToolParams {
  baseURL?: string;  // Optional base URL for AustLII search
}

// Define the tool class for AustLII Search
export class AustLiiSearchTool implements INode {
  label: string;
  name: string;
  version: number;
  description: string;
  type: string;
  icon: string;
  category: string;
  baseClasses: string[];
  inputs: INodeParams[];

  constructor() {
    this.label = 'AustLii Search';
    this.name = 'austliiSearch';
    this.version = 1.0;
    this.type = 'SearchTool';
    this.icon = 'austliisearch.svg';
    this.category = 'Tools';
    this.description = 'Search AustLII for legal documents based on a query and return results';
    this.baseClasses = [this.type, 'Tool', ...getBaseClasses(AustLiiSearchTool)];
    this.inputs = [];
  }

  async init(nodeData: INodeData): Promise<any> {
    const baseURL = nodeData.inputs?.baseURL as string || 'https://www.austlii.edu.au/cgi-bin/sinosrch.cgi';
    return new AustLiiSearchToolInstance({ baseURL });
  }
}

// Define the instance of AustLii Search Tool that handles the actual search logic
class AustLiiSearchToolInstance extends Tool {
    static lc_name() {
      return 'AustLiiSearchTool';
    }
  
  
    name = 'austlii_search';
  
    description = 'Search AustLII for legal documents and return the result titles and links';
  
    baseURL: string;
  
    constructor({ baseURL = 'https://www.austlii.edu.au/cgi-bin/sinosrch.cgi', ...rest }: AustLiiSearchParams) {
      super(rest);
      // Set default value for baseURL if it's undefined
      this.baseURL = baseURL;
    }
  
    async _call(input:any) {

  
      try {
        const response = await axios.get(this.baseURL+`?q=${encodeURIComponent(input)}`);
        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const resultsLinks = $('a[href]').toArray();
          const output: string[] = [];
  
          resultsLinks.forEach((result) => {
            const title = $(result).text().trim();
            const link = `https://www.austlii.edu.au${$(result).attr('href')}`;
            if (title) {
              output.push(`Title: ${title}\nLink: ${link}\n${'-'.repeat(50)}`);
            }
          });
  
          return output.length > 0 ? output.join('\n\n') : 'No results found.';
        } else {
          return `Error: Unable to fetch results (HTTP ${response.status})`;
        }
      } catch (error) {
        return `Error: An exception occurred while fetching results: ${error.message}`;
      }
    }
  }
  

module.exports = { nodeClass: AustLiiSearchTool };
