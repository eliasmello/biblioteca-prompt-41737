import { ParsedPrompt } from "@/types/prompt";

// Regex patterns for extracting different elements from prompts
const PROMPT_PATTERNS = {
  category: /\*\*\[(.*?)\]\*\*/,
  number: /\*\*(\d+)\.\s*Prompt:\s*\*\*/,
  styleTags: /(hyper-realistic|cinematic|golden hour|4K|photorealistic|macro lens|shallow depth|vintage|nostalgic|professional|studio lighting|clean|modern|atmospheric|high contrast)/gi,
  subjectTags: /(woman|man|forest|billboard|diorama|portrait|landscape|studio|executive|office|suit|corporate|city|skyscrapers|neon lights|rain)/gi,
  technicalTags: /(4:3|vertical|horizontal|close-up|wide shot|macro|telephoto|85mm|f\/2\.8|shallow depth of field)/gi,
  moodTags: /(confident|approachable|authoritative|mysterious|high-tech|dystopian|reflective|peaceful|bittersweet)/gi
};

export const parsePromptContent = (rawPrompt: string): ParsedPrompt => {
  const categoryMatch = rawPrompt.match(PROMPT_PATTERNS.category);
  const numberMatch = rawPrompt.match(PROMPT_PATTERNS.number);
  
  let category = '';
  let subcategory = '';
  
  if (categoryMatch) {
    const parts = categoryMatch[1].split('/').map(p => p.trim());
    category = parts[0];
    subcategory = parts[1] || '';
  }
  
  // Extract various types of tags
  const styleTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.styleTags)]
    .map(match => match[0].toLowerCase())
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
    
  const subjectTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.subjectTags)]
    .map(match => match[0].toLowerCase())
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
    
  const technicalTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.technicalTags)]
    .map(match => match[0].toLowerCase())
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
  
  return {
    category,
    subcategory,
    number: numberMatch ? parseInt(numberMatch[1]) : undefined,
    content: rawPrompt,
    extractedTags: {
      style: styleTags,
      subject: subjectTags,
      technical: technicalTags
    }
  };
};

export class PromptParser {
  /**
   * Parse a raw prompt string and extract structured information
   */
  static parsePrompt(rawPrompt: string): ParsedPrompt {
    const categoryMatch = rawPrompt.match(PROMPT_PATTERNS.category);
    const numberMatch = rawPrompt.match(PROMPT_PATTERNS.number);
    
    let category = '';
    let subcategory = '';
    
    if (categoryMatch) {
      const parts = categoryMatch[1].split('/').map(p => p.trim());
      category = parts[0];
      subcategory = parts[1] || '';
    }
    
    // Extract various types of tags
    const styleTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.styleTags)]
      .map(match => match[0].toLowerCase())
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
      
    const subjectTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.subjectTags)]
      .map(match => match[0].toLowerCase())
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
      
    const technicalTags = [...rawPrompt.matchAll(PROMPT_PATTERNS.technicalTags)]
      .map(match => match[0].toLowerCase())
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
    
    return {
      category,
      subcategory,
      number: numberMatch ? parseInt(numberMatch[1]) : undefined,
      content: rawPrompt,
      extractedTags: {
        style: styleTags,
        subject: subjectTags,
        technical: technicalTags
      }
    };
  }

  /**
   * Extract keywords from prompt content for search indexing
   */
  static extractKeywords(content: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
    ]);
    
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
    
    return words;
  }

  /**
   * Determine the complexity of a prompt based on various factors
   */
  static assessComplexity(content: string): 'Simple' | 'Medium' | 'Complex' {
    const wordCount = content.split(/\s+/).length;
    const elementCount = (content.match(/[.,:;]/g) || []).length;
    const detailLevel = (content.match(/(detailed?|specific|intricate|complex)/gi) || []).length;
    
    let score = 0;
    
    // Word count scoring
    if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;
    
    // Element count scoring (commas, periods, etc.)
    if (elementCount > 10) score += 2;
    else if (elementCount > 5) score += 1;
    
    // Detail level scoring
    score += detailLevel;
    
    if (score >= 5) return 'Complex';
    if (score >= 2) return 'Medium';
    return 'Simple';
  }

  /**
   * Format prompt content for display with syntax highlighting
   */
  static formatForDisplay(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-muted-foreground">$1</em>')
      .replace(/(Scene:|Central figure:|Props:|Lighting:|Camera:|Mood:|Background:)/g, '<strong class="text-accent">$1</strong>');
  }

  /**
   * Generate a title from prompt content if not provided
   */
  static generateTitle(content: string, category?: string): string {
    // Extract the first meaningful phrase or sentence
    const firstSentence = content.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 6); // Take first 6 words
    
    let title = words.join(' ');
    
    // Clean up the title
    title = title.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Add category prefix if available
    if (category) {
      title = `${category}: ${title}`;
    }
    
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }
}