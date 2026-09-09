import { configDotenv } from "dotenv";

configDotenv({ path: [".env", "../../.env"] });
import { logger } from "@repo/shared";
import { chunkText } from "../Scrapper/chunker";
import { ScrapedPage, scrapePage } from "../Scrapper/scrapper";
import { addChunks } from "../VectorDB/vectorDb";


export async function ingestionPipeline(url: string) {
    //Scrape Page from URL
    const page: ScrapedPage = await scrapePage(url);
    logger.info("Scraped Page", { page });
    //Create chunks from Page.text
    const chunks: string[] = await chunkText(page.text);
    logger.info("Created Chunks", { chunks: chunks.length });
    //Store url and title as the metadata
    const metadata = chunks.map((_, i) => ({
        url: page.url,
        title: page.title,
        chunkIndex: i,
    }));

    await addChunks(chunks, metadata);
    logger.info("Ingested Chunks", { chunks: chunks.length });
    console.log("Ingested Chunks", { chunks: chunks.length });

};

async function runPipeline(url: string) {
    try {
        await ingestionPipeline(url);
        logger.info("Ingestion Complete", {})
    } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : "Something went wrong"
        logger.error("Ingestion failed", {})
        console.error("This is the error in ingestion process", error);
        process.exitCode = 1
    }
}
runPipeline("https://brainnest-lms-fzqv.vercel.app/")