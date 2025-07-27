/**
 * RAG Server using @google/generative-ai with advanced rate limiting
 * This implementation provides better rate limit handling and retry mechanisms
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Rate limiting configuration
const RATE_LIMIT = {
    requestsPerMinute: 20,  // Slightly higher for testing
    requestsPerDay: 1500,   // Daily limit
    delayBetweenRequests: 2000, // 2 seconds between requests (reduced)
    retryAttempts: 3,
    retryDelay: 3000 // 3 seconds between retries (reduced)
};

// Rate limiting state
let requestHistory = {
    requests: [],
    dailyCount: 0,
    lastResetDate: new Date().toDateString()
};

// Rate limiting utility functions
function isRateLimited() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Reset daily count if new day
    const today = new Date().toDateString();
    if (requestHistory.lastResetDate !== today) {
        requestHistory.dailyCount = 0;
        requestHistory.lastResetDate = today;
    }
    
    // Filter recent requests
    requestHistory.requests = requestHistory.requests.filter(time => time > oneMinuteAgo);
    
    // Check limits
    if (requestHistory.requests.length >= RATE_LIMIT.requestsPerMinute) {
        return { limited: true, reason: 'Per-minute limit exceeded' };
    }
    
    if (requestHistory.dailyCount >= RATE_LIMIT.requestsPerDay) {
        return { limited: true, reason: 'Daily limit exceeded' };
    }
    
    return { limited: false };
}

function recordRequest() {
    const now = Date.now();
    requestHistory.requests.push(now);
    requestHistory.dailyCount++;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for Gemini API calls
async function callGeminiWithRetry(operation, maxRetries = RATE_LIMIT.retryAttempts) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check rate limiting before each attempt
            const rateLimitCheck = isRateLimited();
            if (rateLimitCheck.limited) {
                console.log(`Rate limited: ${rateLimitCheck.reason}. Waiting...`);
                await delay(RATE_LIMIT.delayBetweenRequests * 2);
                continue;
            }
            
            recordRequest();
            const result = await operation();
            
            // Add delay between successful requests
            if (attempt === 1) {
                await delay(RATE_LIMIT.delayBetweenRequests);
            }
            
            return result;
            
        } catch (error) {
            console.log(`Attempt ${attempt} failed:`, error.message);
            
            if (error.message.includes('429') || error.message.includes('quota')) {
                console.log(`Rate limit hit on attempt ${attempt}. Waiting longer...`);
                await delay(RATE_LIMIT.retryDelay * attempt); // Exponential backoff
            } else if (attempt === maxRetries) {
                throw error;
            } else {
                await delay(RATE_LIMIT.retryDelay);
            }
        }
    }
    
    throw new Error('Max retries exceeded');
}

// In-memory vector store (simplified for rate limiting)
let vectorStore = {
    schemes: [],
    embeddings: [],
    ready: false
};

// Load schemes dataset
async function loadSchemes() {
    try {
        // Use minimal dataset for quick testing, fallback to others
        const minimalPath = path.join(__dirname, '../data/raw/test_schemes_minimal.json');
        const expandedPath = path.join(__dirname, '../data/raw/test_schemes_expanded.json');
        const smallPath = path.join(__dirname, '../data/raw/test_schemes_small.json');
        
        let actualPath = minimalPath;
        try {
            await fs.access(minimalPath);
        } catch {
            try {
                await fs.access(expandedPath);
                actualPath = expandedPath;
            } catch {
                actualPath = smallPath;
            }
        }
        
        const data = await fs.readFile(actualPath, 'utf8');
        const parsed = JSON.parse(data);
        
        console.log(`📊 Loaded ${parsed.schemes.length} schemes from ${path.basename(actualPath)}`);
        return parsed.schemes || [];
        
    } catch (error) {
        console.error('Error loading schemes:', error);
        return [];
    }
}

// Simplified embedding function
async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    return await callGeminiWithRetry(async () => {
        const result = await model.embedContent(text);
        return result.embedding.values;
    });
}

// Generate response using Gemini
async function generateResponse(prompt) {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
        }
    });
    
    return await callGeminiWithRetry(async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
}

// Simple similarity search (cosine similarity)
function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

async function searchRelevantSchemes(queryEmbedding, topK = 5) {
    if (!vectorStore.ready) {
        return [];
    }
    
    const similarities = vectorStore.embeddings.map((embedding, index) => ({
        scheme: vectorStore.schemes[index],
        similarity: cosineSimilarity(queryEmbedding, embedding),
        index
    }));
    
    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(item => item.scheme);
}

// API Routes

app.get('/', (req, res) => {
    res.json({
        message: 'Government Schemes RAG API with @google/generative-ai',
        version: '5.0.0',
        framework: '@google/generative-ai + Express',
        status: 'online',
        vectorStoreReady: vectorStore.ready,
        docs: '/docs'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        framework: '@google/generative-ai + Express',
        rag_system_ready: vectorStore.ready,
        implementation: 'Node.js with rate limiting',
        rateLimit: {
            requestsThisMinute: requestHistory.requests.length,
            dailyCount: requestHistory.dailyCount,
            maxPerMinute: RATE_LIMIT.requestsPerMinute,
            maxPerDay: RATE_LIMIT.requestsPerDay
        }
    });
});

app.post('/setup', async (req, res) => {
    try {
        console.log('🚀 Setting up RAG system with rate limiting...');
        
        // Load schemes
        const schemes = await loadSchemes();
        if (schemes.length === 0) {
            return res.status(404).json({
                error: 'No schemes found. Please check dataset files.',
                success: false
            });
        }
        
        // Generate embeddings with rate limiting
        console.log('📝 Generating embeddings with rate limiting...');
        vectorStore.schemes = schemes;
        vectorStore.embeddings = [];
        
        const batchSize = 5; // Process in small batches
        for (let i = 0; i < schemes.length; i += batchSize) {
            const batch = schemes.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schemes.length / batchSize)}`);
            
            for (const scheme of batch) {
                try {
                    const text = `${scheme.scheme_name} ${scheme.category} ${scheme.description || ''}`;
                    const embedding = await getEmbedding(text);
                    vectorStore.embeddings.push(embedding);
                    
                    console.log(`✅ Embedded: ${scheme.scheme_name}`);
                } catch (error) {
                    console.error(`❌ Failed to embed: ${scheme.scheme_name}`, error.message);
                    // Add zero vector as fallback
                    vectorStore.embeddings.push(new Array(768).fill(0));
                }
            }
            
            // Shorter delay between batches for small datasets
            if (i + batchSize < schemes.length) {
                console.log('⏳ Waiting between batches...');
                const delay_time = schemes.length <= 20 ? 3000 : 10000; // 3s for small, 10s for large
                await delay(delay_time);
            }
        }
        
        vectorStore.ready = true;
        console.log('✅ RAG system setup complete!');
        
        res.json({
            message: 'RAG system setup completed with rate limiting',
            totalSchemes: schemes.length,
            implementation: '@google/generative-ai',
            success: true
        });
        
    } catch (error) {
        console.error('Setup failed:', error);
        res.status(500).json({
            error: `Setup failed: ${error.message}`,
            success: false
        });
    }
});

app.post('/query', async (req, res) => {
    try {
        const { query, include_sources = true } = req.body;
        
        if (!query) {
            return res.status(400).json({
                error: 'Query is required',
                success: false
            });
        }
        
        if (!vectorStore.ready) {
            return res.status(400).json({
                error: 'RAG system not ready. Please run /setup first.',
                success: false
            });
        }
        
        console.log(`🔍 Processing query: ${query}`);
        
        // Get query embedding
        const queryEmbedding = await getEmbedding(query);
        
        // Search for relevant schemes
        const relevantSchemes = await searchRelevantSchemes(queryEmbedding, 5);
        
        if (relevantSchemes.length === 0) {
            return res.json({
                answer: 'I could not find any relevant government schemes for your query. Please try rephrasing your question.',
                sources: [],
                total_sources: 0,
                success: true
            });
        }
        
        // Create context from relevant schemes
        const context = relevantSchemes.map((scheme, index) => 
            `${index + 1}. Scheme: ${scheme.scheme_name}\n` +
            `   Category: ${scheme.category}\n` +
            `   State: ${scheme.state_name || 'National'}\n` +
            `   Description: ${scheme.description || 'No description available'}\n`
        ).join('\n');
        
        // Generate response
        const prompt = `You are a helpful assistant for Indian Government Schemes. Based on the following relevant schemes, answer the user's question.

Relevant Government Schemes:
${context}

User Question: ${query}

Please provide a helpful answer that:
1. Directly addresses the user's question
2. Mentions the most relevant schemes by name
3. Includes key details when available
4. Is clear and actionable

Answer:`;
        
        const answer = await generateResponse(prompt);
        
        // Format sources
        const sources = include_sources ? relevantSchemes.map(scheme => ({
            scheme_name: scheme.scheme_name,
            category: scheme.category,
            state: scheme.state_name || 'National',
            ministry: scheme.implementing_ministry || 'N/A',
            scheme_id: scheme.scheme_id || 'N/A'
        })) : [];
        
        console.log('✅ Query processed successfully');
        
        res.json({
            answer,
            sources,
            total_sources: relevantSchemes.length,
            success: true
        });
        
    } catch (error) {
        console.error('Query failed:', error);
        res.status(500).json({
            error: `Query processing failed: ${error.message}`,
            success: false
        });
    }
});

app.get('/stats', (req, res) => {
    res.json({
        gemini_enabled: !!process.env.GOOGLE_API_KEY,
        vector_store_ready: vectorStore.ready,
        total_documents: vectorStore.schemes.length,
        status: vectorStore.ready ? 'ready' : 'needs setup',
        embedding_model: 'embedding-001',
        llm_model: 'gemini-2.0-flash-exp',
        implementation: '@google/generative-ai with rate limiting',
        rateLimit: {
            requestsThisMinute: requestHistory.requests.length,
            dailyCount: requestHistory.dailyCount,
            maxPerMinute: RATE_LIMIT.requestsPerMinute,
            maxPerDay: RATE_LIMIT.requestsPerDay
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RAG Server with @google/generative-ai running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Setup: POST http://localhost:${PORT}/setup`);
    console.log(`💬 Query: POST http://localhost:${PORT}/query`);
    console.log(`⚡ Rate limiting: ${RATE_LIMIT.requestsPerMinute}/min, ${RATE_LIMIT.requestsPerDay}/day`);
});
