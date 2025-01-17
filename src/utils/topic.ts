import * as fs from 'node:fs/promises';
import { prompt } from './llm';
import dotenv from 'dotenv';

dotenv.config();

// TODO: Knowledge Layer Demo
// Given an array of topics, prompt engineer llm to generate a branch 
// of new topics with a 50% chance to branch, and then use 
// the TopicTree data structure to add the topic and then get 
// a random branch, and then get a subtopic and then runStateMachine

// 1. TopicTree - complete
class TopicTree {

    tree = {}

    constructor() {
        this.tree = {}
    }

    addNode(topic, subtopics = []) {
        if (!this.tree[topic]) {
            this.tree[topic] = { subtopics: [], links: [] }
        }

        this.tree[topic].subtopics.push(...subtopics)
    }

    removeNode(topic) {
        delete this.tree[topic]
        for (const key in this.tree) {
            this.tree[key].subtopics = this.tree[key].subtopics.filter(sub => sub !== topic)
            this.tree[key].links = this.tree[key].links.filter(link => link !== topic)
        }
    }

    addLink(topic, linkedTopic) {
        if (this.tree[topic] && this.tree[linkedTopic]) {
            this.tree[topic].links.push(linkedTopic)
        }
    }

    saveToFile(filename) {
        fs.writeFile(filename, JSON.stringify(this.tree, null, 4))
    }

    async loadFromFile(filename) {
        const data = await fs.readFile(filename, 'utf-8')
        this.tree = JSON.parse(data)
    }

    getTopics() {
        return Object.keys(this.tree)
    }

    getBranches(topic) {
        return this.tree[topic] || { subtopics: [], links: [] }
    }

    getRandomBranch() {
        const topics = Object.keys(this.tree)
        if (topics.length === 0) return null

        const randomTopic = topics[Math.floor(Math.random() * topics.length)]
        return { topic: randomTopic, ...this.tree[randomTopic] }
    }

    getAllTopics() {
        const topics = new Set<string>()
        
        // Add main topics
        Object.keys(this.tree).forEach(topic => {
            topics.add(topic)
            
            // Add subtopics
            this.tree[topic].subtopics.forEach(subtopic => {
                topics.add(subtopic)
            })
            
            // Add linked topics
            this.tree[topic].links.forEach(link => {
                topics.add(link)
            })
        })
        
        return Array.from(topics)
    }

}

const topics = [
    "Book of Genesis",
    "Sumeria",
    "Ascension Glossary",
    "Annunaki", 
    "Book of Thoth",
    "Emerald Tablets of Thoth",
    "2012 Mayan Calendar",
    "Tower of Babel",
    "Nibiru",
    "Nag Hammadi Library",
    "Book of Enoch",
    "Corpus Hermeticum",
    "Behold a Pale Horse",
    "Babylon",
    "Kyballion",
    "Dead Sea Scrolls",
    "Ascension Glossary"
]

// 2. Prompt engineer llm to generate topic branches from given topic set.

export const generateTopicTree = async(topics: string[]): Promise<TopicTree> => {

    const SYSTEM_PROMPT = `You are a singular agent that will generate various topic branches from the given set of topics.`

    const PROMPT = `
        You are given an input of topic array with various topics. Generate at least 5 new topics for each topic given in array 
        to branch off. 
        <Topic Input>
        ${topics.join("\n")}
        </Topic Input>


        You are returning to an api, only return JSON; no prose:
        <JSON Output>
        {
            topicA: ["topic1_generated_from_topicA", "topic2_generated_from_topicA", "topic3_generated_from_topicA", ...],
            ... // generate as many topic branches as given from the topic input array.
        }
        </JSON Output>
    `

    let promptResponse = await prompt(
        SYSTEM_PROMPT,
        PROMPT,
        2000
    )

    // Lets run the engineered prompt to see what is returned and tweak if necessary!
    console.log(promptResponse)

    if (promptResponse.content.length === 0) {
        throw new Error("ERR_NO_CONTENT_RETURNED") 
    }

    if (promptResponse.content[0].type !== "text") {
        throw new Error("ERR_CONTENT_NOT_TEXT_TYPE")
    }

    let promptResponseData = promptResponse.content[0].text
    let topicBranchJSON = JSON.parse(promptResponseData)


    // We can generate a TopicTree right here.

    const topicTree = new TopicTree()
    
    for (const [topic, topicBranch] of Object.entries(topicBranchJSON)) {
        let topicsBranch = topicBranch as string[]
        topicTree.addNode(topic, topicsBranch)
    }

    return topicTree
}