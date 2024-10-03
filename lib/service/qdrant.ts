import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { Embedding } from '@/types/settings';
import { logger } from '@/lib/service/winston'; // Import the Winston logger
import chalk from 'chalk'; // Import Chalk
import { client } from '@/lib/client/qdrant'; // Using the Qdrant client you've set up
import { KnowledgebaseFile } from '@/types/file-uploader';

const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'atlasv1';

export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[]
) => {
  logger.info(chalk.blue(`Starting upsert for user ${userId}`));

  // Prepare the points to be upserted
  const points = embeddings.map((embedding) => ({
    id: uuidv4(), // Generate a UUID for the point
    payload: {
      embeddingId: embedding.id, // The ID of the embedding
      metadata: embedding.metadata || {} // Attach any additional metadata if available
    },
    vector: embedding.values // The embedding's vector
  }));

  try {
    // Perform the upsert operation using the Qdrant client
    await client.upsert(QDRANT_COLLECTION, {
      points // The list of points (embeddings) to upsert
    });

    logger.info(chalk.green(`Upsert successful for user ${userId}`));
    return embeddings.length;
  } catch (error) {
    logger.error(
      chalk.red(
        `Failed to upsert for user ${userId}. Error: ${
          (error as Error).message
        }. Response: ${JSON.stringify((error as any).response?.data)}`
      )
    );
    throw error;
  }
};

export async function query(
  userId: string,
  embeddings: any,
  topK: number
): Promise<any> {
  logger.info(
    `query called with userEmail: ${userId}, embeddings: ${embeddings.length}, topK: ${topK}`
  );

  try {
    // Implement actual query logic here
    // For now, we're throwing an unimplemented error
    throw new Error('query function is not implemented');
  } catch (error) {
    logger.error(
      chalk.red(
        `Query failed for user ${userId}. Error: ${(error as Error).message}`
      )
    );
    throw error;
  }
}

export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  logger.info(
    `deleteFromVectorDb called with userId: ${userId}, file: ${JSON.stringify(
      file
    )}`
  );

  try {
    // Extract the filename or URL from the file object
    const { name, url } = file;

    if (!name && !url) {
      throw new Error('No filename or URL provided for deletion.');
    }

    // Use the Qdrant client to delete points based on the filename or URL filter
    await client.delete(QDRANT_COLLECTION, {
      filter: {
        must: [
          {
            key: 'name', // Filter based on the filename
            match: {
              value: name // Match the points that have the same filename
            }
          },
          {
            key: 'url', // Optionally, filter based on the URL as well
            match: {
              value: url // Match the points that have the same URL
            }
          }
        ]
      }
    });

    // Log success and return the number of points deleted (if provided by response)
    logger.info(
      chalk.green(
        `Successfully deleted vectors for user ${userId} and file ${
          name || url
        }`
      )
    );
    return 1;
  } catch (error) {
    logger.error(
      chalk.red(
        `Failed to delete from vector DB for user ${userId}. Error: ${
          (error as Error).message
        }`
      )
    );
    throw error;
  }
}
