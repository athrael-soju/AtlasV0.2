import { rerank } from '@/lib/service/cohere';
import { embedMessage } from '@/lib/service/openai';
import { getVectorDbProvider } from '@/lib/service/vector-db/factory';
import { validateUser } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging
import { Embedding } from '@/types/settings';

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    logger.info(chalk.blue('GET request received for retrieving context.'));

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const message = searchParams.get('message');

    if (!userId || !message) {
      logger.warn(chalk.yellow('Missing userId or message in request.'));
      return NextResponse.json(
        { error: 'No userId or message provided' },
        { status: 400 }
      );
    }

    // Validate user
    const userServerData = await validateUser(userId);
    logger.info(chalk.green(`User validated successfully: ${userId}`));

    const settings = userServerData.settings;

    // Setup and return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);
        retrieveContext(userId, message, settings, send)
          .then(() => controller.close())
          .catch((err) => {
            logger.error(chalk.red(`Error retrieving context: ${err.message}`));
            controller.error(err);
          });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error: any) {
    logger.error(chalk.red(`Error in GET request: ${error.message}`));
    return handleErrorResponse(error);
  }
}

async function retrieveContext(
  userId: string,
  message: string,
  settings: any,
  sendUpdate: (status: string, message: string) => void
): Promise<void> {
  let rerankingContext = '';
  try {
    sendUpdate('Retrieving context', `${message}`);
    logger.info(chalk.blue(`Embedding message for user: ${userId}`));

    // Embed the message
    const embeddingResults = (await embedMessage(userId, message)) as Embedding;
    sendUpdate(
      'Embedding complete',
      `Message embedding complete for: ${message}`
    );
    logger.info(chalk.green('Message embedding complete.'));

    // Query Vector DB from the factory with the embedding
    logger.info(chalk.blue('Querying Vector DB Factory for context.'));
    const vectorDbProvider = await getVectorDbProvider(
      settings.forge.vectorizationProvider
    );
    const queryResults = await vectorDbProvider.query(
      userId,
      embeddingResults,
      settings.knowledgebase.vectorDbTopK
    );
    sendUpdate('Query complete', 'Query results retrieved from Pinecone.');
    logger.info(chalk.green('Query complete.'));

    if (queryResults.context.length > 0) {
      // Rerank the results
      logger.info(chalk.blue('Reranking query results.'));
      rerankingContext = await rerank(
        message,
        queryResults.context,
        settings.knowledgebase
      );
      sendUpdate('Reranking complete', `${rerankingContext}`);
      logger.info(chalk.green('Reranking complete.'));
    } else {
      sendUpdate('No context', 'No context found for the message.');
      logger.warn(chalk.yellow('No context found for the message.'));
    }
  } catch (error: any) {
    sendUpdate('Error', `Error retrieving context: ${error.message}`);
    logger.error(
      chalk.red(
        `Error in retrieving context for user: ${userId}, message: ${error.message}`
      )
    );
  } finally {
    sendUpdate('Done', `Processing complete for: ${message}`);
    logger.info(chalk.green(`Processing done for message: ${message}`));
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status = ['Invalid user', 'Invalid file IDs'].includes(error.message)
    ? 400
    : 500;

  logger.error(chalk.red(`Returning error response: ${error.message}`));

  return new NextResponse(
    JSON.stringify({ message: error.message || 'Internal server error' }),
    { status }
  );
}
