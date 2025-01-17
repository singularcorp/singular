// Wikipedia API Scraper
// This script demonstrates various ways to interact with the MediaWiki API

interface WikiParams {
    [key: string]: string | number | boolean;
}

interface WikiPage {
    extract?: string;
    categories?: Array<{title: string}>;
    links?: Array<{title: string}>;
    revisions?: Array<{
        timestamp: string;
        user: string;
        comment: string;
        size: number;
    }>;
}

export interface WikiArticle {
    title: string;
    snippet: string;
    pageid: number;
    size: number;
    timestamp: string;
    url: string;
}

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

// Wikipedia API Scraper
// This script demonstrates various ways to interact with the MediaWiki API

export class WikiScraper {
    private apiEndpoint: string;
    private baseUrl: string;

    constructor(apiEndpoint = 'https://en.wikipedia.org/w/api.php') {
        this.apiEndpoint = apiEndpoint;
        this.baseUrl = 'https://en.wikipedia.org/wiki/';
    }

    // Helper method to build API URL with parameters
    private buildUrl(params: WikiParams): string {
        const defaultParams = {
            format: 'json',
            origin: '*', // Required for CORS
        };
        const fullParams = { ...defaultParams, ...params };
        const queryString = new URLSearchParams(fullParams as Record<string, string>).toString();
        return `${this.apiEndpoint}?${queryString}`;
    }

    // Fetch article content
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

    // Helper method to get Wikipedia URL for a title
    private getWikiUrl(title: string): string {
        return `${this.baseUrl}${encodeURIComponent(title.replace(/ /g, '_'))}`;
    }

    // Search Wikipedia articles
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

    // Get article categories
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

    // Get article links
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

    // Get article revisions
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