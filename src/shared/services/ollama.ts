/**
 * Ollama Service - Local LLM Integration
 *
 * Ollama is a free, open-source tool to run LLMs locally on your Mac.
 *
 * Setup:
 * 1. Install Ollama: brew install ollama
 * 2. Pull a model: ollama pull llama3.2
 * 3. Ollama runs at http://localhost:11434
 *
 * Popular models:
 * - llama3.2:3b (4GB, fast, good quality)
 * - mistral:7b (4GB, very fast)
 * - phi3:mini (2GB, fastest)
 * - llama3.2:1b (1GB, ultra fast but lower quality)
 */

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private defaultModel = 'llama3.2:3b';

  /**
   * Check if Ollama is running
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  /**
   * Generate text with Ollama
   */
  async generate(prompt: string, model?: string, options?: any): Promise<string> {
    const request: OllamaGenerateRequest = {
      model: model || this.defaultModel,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.7,
        num_predict: options?.maxTokens || 500
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30s timeout
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  /**
   * Summarize an article
   */
  async summarizeArticle(title: string, url: string): Promise<string> {
    const prompt = `Summarize this article in 2-3 sentences:

Title: ${title}
URL: ${url}

Provide a clear, concise summary focusing on the main points. Be direct and informative.

Summary:`;

    return this.generate(prompt, undefined, { maxTokens: 200 });
  }

  /**
   * Generate tags for an article
   */
  async generateTags(title: string, domain: string): Promise<string[]> {
    const prompt = `Generate 3-5 relevant tags for this article:

Title: ${title}
Domain: ${domain}

Return ONLY the tags as a comma-separated list, nothing else.

Tags:`;

    const response = await this.generate(prompt, undefined, { maxTokens: 100 });

    // Parse comma-separated tags
    return response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 30)
      .slice(0, 5);
  }

  /**
   * Generate weekly reading report with AI
   */
  async generateWeeklyReport(stats: {
    totalPages: number;
    topCategories: Array<{ category: string; count: number; percentage: number }>;
    topEmotions: Array<{ emotion: string; count: number; percentage: number }>;
    productivityScore: number;
    streak: number;
    topDomains: Array<{ domain: string; count: number }>;
  }): Promise<string> {
    const prompt = `You are a thoughtful reading coach analyzing someone's weekly reading habits.

Here's their data for the past week:
- Read ${stats.totalPages} articles
- Top categories: ${stats.topCategories.slice(0, 3).map(c => `${c.category} (${c.percentage.toFixed(0)}%)`).join(', ')}
- Top emotions: ${stats.topEmotions.slice(0, 3).map(e => `${e.emotion} (${e.percentage.toFixed(0)}%)`).join(', ')}
- Productivity score: ${stats.productivityScore.toFixed(0)}%
- Current streak: ${stats.streak} days
- Most read domains: ${stats.topDomains.slice(0, 3).map(d => d.domain).join(', ')}

Write a warm, encouraging 3-4 paragraph summary that:
1. Celebrates their progress and highlights interesting patterns
2. Connects their reading topics to their emotions (what content makes them feel what)
3. Offers ONE specific, actionable suggestion for next week
4. Ends with motivation to keep learning

Keep it personal, insightful, and under 200 words. Be specific using the data provided.

Weekly Summary:`;

    return this.generate(prompt, undefined, { maxTokens: 400, temperature: 0.8 });
  }

  /**
   * Suggest similar articles based on interests
   */
  async suggestTopics(recentTopics: string[]): Promise<string[]> {
    const prompt = `Based on someone's reading interests: ${recentTopics.slice(0, 5).join(', ')}

Suggest 5 related topics they might want to explore next. Be specific and actionable.

Return ONLY the topic suggestions as a comma-separated list, nothing else.

Suggestions:`;

    const response = await this.generate(prompt, undefined, { maxTokens: 150 });

    return response
      .split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0)
      .slice(0, 5);
  }

  /**
   * Analyze emotion-content correlation with AI
   */
  async analyzeEmotionPattern(data: {
    category: string;
    emotions: Array<{ emotion: string; percentage: number }>;
  }): Promise<string> {
    const emotionList = data.emotions
      .map(e => `${e.emotion} (${e.percentage.toFixed(0)}%)`)
      .join(', ');

    const prompt = `Analyze this pattern:

When reading ${data.category} content, the reader tends to feel: ${emotionList}

In 1-2 sentences, provide an insightful interpretation of what this pattern reveals about their relationship with this type of content. Be thoughtful and supportive.

Insight:`;

    return this.generate(prompt, undefined, { maxTokens: 150 });
  }

  /**
   * Generate personalized motivation message
   */
  async generateMotivation(streak: number, totalArticles: number): Promise<string> {
    const prompt = `Generate a short, motivating message (1-2 sentences) for someone who:
- Has a ${streak}-day reading streak
- Has read ${totalArticles} articles total

Make it encouraging and specific to their achievement. Keep it under 50 words.

Message:`;

    return this.generate(prompt, undefined, { maxTokens: 100, temperature: 0.9 });
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  /**
   * Get setup instructions
   */
  getSetupInstructions(): {
    installed: string;
    notInstalled: string;
  } {
    return {
      notInstalled: `
Ollama is not installed or not running.

To enable AI features:
1. Install Ollama: brew install ollama
2. Pull a model: ollama pull llama3.2:3b
3. Start Ollama: ollama serve

Recommended models:
- llama3.2:3b (4GB) - Best balance of speed and quality
- phi3:mini (2GB) - Fastest, good for quick summaries
- mistral:7b (4GB) - Great for detailed analysis

Once installed, restart the app to use AI features!
      `.trim(),
      installed: `
Ollama is running! 🎉

Available models will be listed in settings.
Try pulling more models:
- ollama pull llama3.2:3b
- ollama pull mistral:7b
- ollama pull phi3:mini

Each model has different strengths - experiment to find your favorite!
      `.trim()
    };
  }
}

export const ollamaService = new OllamaService();
