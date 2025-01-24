/**
 * Wikipedia API Scraper Module
 * Provides a comprehensive interface for interacting with the MediaWiki API
 * to fetch and process Wikipedia article data.
 * @module WikiScraper
 */

/**
 * Parameters interface for MediaWiki API requests
 * Allows for flexible parameter passing with various data types
 */
interface WikiParams {
    [key: string]: string | number | boolean;
}

/**
 * Represents the structure of a Wikipedia page response
 * Contains optional fields for different aspects of a page
 */
interface WikiPage {
    extract?: string;                 // Plain text content extract
    categories?: Array<{title: string}>; // Page categories
    links?: Array<{title: string}>;   // Internal wiki links
    revisions?: Array<{              // Edit history
        timestamp: string;           // When the edit was made
        user: string;               // Username of editor
        comment: string;            // Edit summary
        size: number;              // Page size in bytes
    }>;
}

/**
 * Public interface for Wikipedia article data
 * Used for search results and article metadata
 */
export interface WikiArticle {
    title: string;     // Article title
    snippet: string;   // Brief excerpt for search results
    pageid: number;    // Unique Wikipedia page ID
    size: number;      // Article size in bytes
    timestamp: string; // Last modification time
    url: string;       // Full Wikipedia URL
}

/**
 * Structure of API responses from MediaWiki
 * Contains nested query results with pages or search data
 */
interface WikiResponse {
    query: {
        pages: {
            [key: string]: WikiPage;
        };
        search?: Array<{
            title: string;
            snippet: string;
            pageid: number;
            size: number;
            timestamp: string;
        }>;
    };
}

/**
 * WikiScraper class provides methods to interact with Wikipedia's MediaWiki API
 * Handles article searches, content retrieval, and metadata extraction
 */
export class WikiScraper {
    private apiEndpoint: string;
    private baseUrl: string;

    /**
     * Creates a new WikiScraper instance
     * @param apiEndpoint - MediaWiki API endpoint URL (defaults to English Wikipedia)
     */
    constructor(apiEndpoint = 'https://en.wikipedia.org/w/api.php') {
        this.apiEndpoint = apiEndpoint;
        this.baseUrl = 'https://en.wikipedia.org/wiki/';
    }

    /**
     * Constructs a complete API URL with query parameters
     * @param params - Key-value pairs of API parameters
     * @returns Formatted URL string for API request
     * @private
     */
    private buildUrl(params: WikiParams): string {
        const defaultParams = {
            format: 'json',
            origin: '*', // Required for CORS
        };
        const fullParams = { ...defaultParams, ...params };
        const queryString = new URLSearchParams(fullParams as Record<string, string>).toString();
        return `${this.apiEndpoint}?${queryString}`;
    }

    /**
     * Retrieves the plain text content of a Wikipedia article
     * @param title - Title of the Wikipedia article
     * @returns Promise resolving to article content or undefined
     * @throws Error if API request fails
     */
    async getArticleContent(title: string): Promise<string | undefined> {
        const params: WikiParams = {
            action: 'query',
            prop: 'extracts',
            titles: title,
            exintro: true, // Only get introduction
            explaintext: true, // Get plain text instead of HTML
        };

        try {
            const response = await fetch(this.buildUrl(params));
            const data = await response.json() as WikiResponse;
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            return pages[pageId].extract;
        } catch (error) {
            console.error('Error fetching article content:', error);
            throw error;
        }
    }

    /**
     * Converts article title to Wikipedia URL format
     * @param title - Article title
     * @returns Formatted Wikipedia URL
     * @private
     */
    private getWikiUrl(title: string): string {
        return `${this.baseUrl}${encodeURIComponent(title.replace(/ /g, '_'))}`;
    }

    /**
     * Searches Wikipedia articles based on query string
     * @param query - Search terms
     * @param limit - Maximum number of results (default: 10)
     * @returns Promise resolving to array of search results with URLs
     * @throws Error if search request fails
     */
    async searchArticles(query: string, limit = 10): Promise<Array<{
        title: string;
        snippet: string;
        pageid: number;
        size: number;
        timestamp: string;
        url: string;
    }>> {
        const params: WikiParams = {
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: limit,
        };

        try {
            const response = await fetch(this.buildUrl(params));
            const data = await response.json() as WikiResponse;
            // Add Wikipedia URL to each search result
            return data.query.search?.map(result => ({
                ...result,
                url: this.getWikiUrl(result.title)
            })) ?? [];
        } catch (error) {
            console.error('Error searching articles:', error);
            throw error;
        }
    }

    /**
     * Retrieves categories associated with a Wikipedia article
     * @param title - Article title
     * @returns Promise resolving to array of category titles
     * @throws Error if category retrieval fails
     */
    async getArticleCategories(title: string): Promise<string[]> {
        const params: WikiParams = {
            action: 'query',
            prop: 'categories',
            titles: title,
            cllimit: 500,
        };

        try {
            const response = await fetch(this.buildUrl(params));
            const data = await response.json() as WikiResponse;
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            return pages[pageId].categories?.map(cat => cat.title) || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Retrieves internal links from a Wikipedia article
     * @param title - Article title
     * @returns Promise resolving to array of linked article titles
     * @throws Error if link retrieval fails
     */
    async getArticleLinks(title: string): Promise<string[]> {
        const params: WikiParams = {
            action: 'query',
            prop: 'links',
            titles: title,
            pllimit: 500,
        };

        try {
            const response = await fetch(this.buildUrl(params));
            const data = await response.json() as WikiResponse;
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            return pages[pageId].links?.map(link => link.title) || [];
        } catch (error) {
            console.error('Error fetching links:', error);
            throw error;
        }
    }

    /**
     * Retrieves revision history of a Wikipedia article
     * @param title - Article title
     * @param limit - Maximum number of revisions to fetch (default: 10)
     * @returns Promise resolving to array of revision details
     * @throws Error if revision history retrieval fails
     */
    async getArticleRevisions(title: string, limit = 10): Promise<Array<{
        timestamp: string;
        user: string;
        comment: string;
        size: number;
    }>> {
        const params: WikiParams = {
            action: 'query',
            prop: 'revisions',
            titles: title,
            rvlimit: limit,
            rvprop: 'timestamp|user|comment|size',
        };

        try {
            const response = await fetch(this.buildUrl(params));
            const data = await response.json() as WikiResponse;
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            return pages[pageId].revisions || [];
        } catch (error) {
            console.error('Error fetching revisions:', error);
            throw error;
        }
    }
}

// Run the demonstration
// demonstrateWikiScraper();