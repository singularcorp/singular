import { Anthropic } from '@anthropic-ai/sdk';
import { WikiArticle } from './WikiScraper';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
});

// export async function generateHTMLFromArticle(article: WikiArticle, articleContent: string, prompt: string) {

//   const PROMPT = `
//     ${prompt}

//     <Article>
//     {{ ${JSON.stringify(article)} }}
//     <Article/>

//     <Article Content>
//     {{ ${articleContent} }}
//     </Article Content>
//   `

//   const response = await anthropic.messages.create({
//     model: "claude-3-5-sonnet-latest",
//     system: "You will generate html with user interactivity based the input given.",
//     max_tokens: 8000,
//     messages: [
//       {"role": "user", "content": PROMPT}
//     ],
//   });
  
//   return response;
// }

export async function generateHTMLFromArticle(articleContent: string, prompt: string) {

    const PROMPT = `
      ${prompt}
  
      <Article Content>
      {{ ${articleContent} }}
      </Article Content>
    `
  
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      system: "You will generate html with user interactivity based the input given.",
      max_tokens: 8000,
      messages: [
        {"role": "user", "content": PROMPT}
      ],
    });
    
    return response;
  }

export async function generateTweetFromContent(article: WikiArticle, articleContent: string, prompt: string) {

    const PROMPT = `
        ${prompt}

        <Article>
        {{ ${JSON.stringify(article)} }}
        <Article/>

        <Article Content>
        {{ ${articleContent} }}
        </Article Content>
    `

    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        system: "You will generate a tweet based on the content given.",
        max_tokens: 200,
        messages: [
          {"role": "user", "content": PROMPT}
        ],
      });
      
      return response;
}

export async function generateNewTopic() {
    const PROMPT = `
        Generate a new research topic that is interesting, complex, and thought-provoking.
        The topic should be specific enough to research in depth but broad enough to have multiple aspects to explore.
        Return the response in the following JSON format:
        {
            "topic": "the generated topic name"
        }
    `

    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        system: "You are an expert at identifying fascinating research topics. Return only valid JSON.",
        max_tokens: 500,
        messages: [
            {"role": "user", "content": PROMPT}
        ]
    });
    
    return response;
}

export async function prompt(system: string, promptText: string, maxTokens: number = 2000) {

    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        system: system,
        max_tokens: maxTokens,
        messages: [
            {"role": "user", "content": promptText}
        ]
    });
    
    return response;
}