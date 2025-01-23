import { ICommonObject,INode, INodeData, INodeParams } from '../../../src/Interface'
import { OpenAI } from 'openai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
type OpenAIModel = 'tts-1' | 'tts-1-hd'
type OpenAIFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav'

// Utility function to ensure directory exists
function ensureDirectoryExists(directory: string) {
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true })
    }
}

class OpenAITextToSpeech implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]
    schema: any

    constructor() {
        this.label = 'OpenAI Text to Speech Tool'
        this.name = 'openAITextToSpeechTool'
        this.version = 1.0
        this.type = 'Tool'
        this.icon = 'openai.svg'
         this.category = 'Tools'
        this.description = 'Convert text to speech using OpenAI TTS API, returns the audio as text'
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        }
        this.inputs = [

          
            {
                label: 'Voice',
                name: 'voice',
                type: 'options',
                options: [
                    { label: 'Alloy', name: 'alloy' },
                    { label: 'Echo', name: 'echo' },
                    { label: 'Fable', name: 'fable' },
                    { label: 'Onyx', name: 'onyx' },
                    { label: 'Nova', name: 'nova' },
                    { label: 'Shimmer', name: 'shimmer' }
                ],
                default: 'alloy',
                optional: false
            },
            {
                label: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    { label: 'TTS-1', name: 'tts-1' },
                    { label: 'TTS-1-HD', name: 'tts-1-hd' }
                ],
                default: 'tts-1',
                optional: false
            },
            {
                label: 'Output Format',
                name: 'format',
                type: 'options',
                options: [
                    { label: 'MP3', name: 'mp3' },
                    { label: 'Opus', name: 'opus' },
                    { label: 'AAC', name: 'aac' },
                    { label: 'FLAC', name: 'flac' },
                    { label: 'WAV', name: 'wav' }
                ],
                default: 'mp3',
                optional: false
            },

        ]
        this.schema = {
          type: 'function',
          function: {
             name: 'textToSpeech',
             description: 'This tool is used to convert text into speech, the output will be the speech in text format.',
             parameters: {
                type: 'object',
                 properties: {
                  text: {
                     type: 'string',
                     description: 'Text to convert into speech, it will be provided back on the output'
                    },
                },
                required: ["text"]
            }
          }
        }
    }

      async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const voice = nodeData.inputs?.voice as OpenAIVoice
        const model = nodeData.inputs?.model as OpenAIModel
        const format = nodeData.inputs?.format as OpenAIFormat
        const outputDir = './outputs/audio' //Set a default dir
        const text = nodeData.inputs?.text
        
        console.log("Text passed to OpenAI TTS node:", text);
           if(!text){
          throw new Error(`No text was provided, can't convert to speech`)
        }

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const openAIApiKey = getCredentialParam('openAIApiKey', credentialData, nodeData)

        const client = new OpenAI({ apiKey: openAIApiKey })
      try {
            // Ensure output directory exists
            ensureDirectoryExists(outputDir)

            // Generate speech using OpenAI API
            const response = await client.audio.speech.create({
                model: model,
                voice: voice,
                input: text,
                response_format: format
            })

            // Create unique filename and save path
            const fileName = `speech_${Date.now()}.${format}`
            const outputPath = join(outputDir, fileName)

            // Convert response to buffer and save file
            const buffer = Buffer.from(await response.arrayBuffer())
            writeFileSync(outputPath, buffer)

            // Return file information as a text
            return text
        } catch (error) {
            throw new Error(`Failed to generate speech: ${error}`)
        }
    }
}

module.exports = { nodeClass: OpenAITextToSpeech }