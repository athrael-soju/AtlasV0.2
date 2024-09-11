export interface ForgeSettings {
  parsingProvider: string;
  partitioningStrategy: string;
  chunkingStrategy: string;
  minChunkSize: number;
  maxChunkSize: number;
  chunkOverlap: number;
  chunkBatch: number;
}

export interface Embedding {
  id: string;
  values: number[];
  metadata: {
    text: any;
    userId: string;
  };
}

export interface ParsedElement {
  [k: string]: any;
}

export interface KnowledgebaseSettings {
  cohereTopN: number;
  cohereRelevanceThreshold: number;
  pineconeTopK: number;
}
export interface ChatSettings {
  knowledgebaseEnabled: boolean;
}

export interface ProfileSettings {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: number;
  countryOfOrigin?: string;
  preferredLanguage: string;
  personalizedResponses: boolean;
}

export interface MiscSettings {
  sidebarExpanded: boolean;
}
