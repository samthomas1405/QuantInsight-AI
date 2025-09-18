from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer
import requests
from bs4 import BeautifulSoup
from typing import Optional, List, Dict
import re
import nltk
from collections import Counter
import logging

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    try:
        nltk.download('punkt_tab')
    except:
        # Fallback to punkt if punkt_tab is not available
        try:
            nltk.download('punkt')
        except:
            pass

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize sentiment pipeline with a more detailed model
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")

class SentimentInput(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None

class SentimentReasoning(BaseModel):
    category: str  # e.g., "keywords", "tone", "context"
    description: str
    evidence: List[str]
    impact: str  # "positive", "negative", or "neutral"

class SentimentOutput(BaseModel):
    label: str
    score: float
    source_type: str  # "text" or "url"
    reasoning: List[SentimentReasoning]
    summary: str
    key_phrases: List[str]

def extract_text_from_url(url: str) -> str:
    """Extract text content from a URL"""
    try:
        # Add more comprehensive headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }
        
        # Create a session to handle cookies
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML content
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text from common article containers
        article_text = ""
        
        # Try to find article content in common containers
        article_containers = soup.find_all(['article', 'main', 'div'], class_=re.compile(r'(article|content|post|entry|story)'))
        
        if article_containers:
            for container in article_containers:
                article_text += container.get_text(separator=' ', strip=True) + " "
        else:
            # Fallback to body text
            body = soup.find('body')
            if body:
                article_text = body.get_text(separator=' ', strip=True)
            else:
                article_text = soup.get_text(separator=' ', strip=True)
        
        # Clean up text
        article_text = re.sub(r'\s+', ' ', article_text)
        article_text = article_text.strip()
        
        # Limit text length for transformer model (max 512 tokens)
        if len(article_text) > 2000:
            article_text = article_text[:2000] + "..."
        
        return article_text
        
    except requests.HTTPError as e:
        if e.response.status_code == 403 or e.response.status_code == 401:
            raise HTTPException(
                status_code=400, 
                detail="This website has blocked automated access. Please copy and paste the article text directly instead."
            )
        else:
            raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing content: {str(e)}")

def analyze_keywords(text: str, is_positive: bool) -> SentimentReasoning:
    """Analyze positive/negative keywords in the text"""
    # Define keyword sets
    positive_keywords = {
        'finance': ['growth', 'profit', 'gains', 'surge', 'rally', 'bullish', 'outperform', 
                    'breakthrough', 'innovation', 'expansion', 'record high', 'beat expectations',
                    'strong earnings', 'revenue growth', 'market leader', 'upgraded', 'optimistic'],
        'general': ['success', 'improve', 'advance', 'positive', 'excellent', 'outstanding',
                    'achieve', 'milestone', 'progress', 'opportunity', 'favorable', 'robust']
    }
    
    negative_keywords = {
        'finance': ['loss', 'decline', 'fall', 'bearish', 'crash', 'recession', 'downturn',
                    'underperform', 'miss expectations', 'debt', 'bankruptcy', 'layoffs',
                    'downgraded', 'warning', 'volatile', 'uncertainty', 'risk', 'concern'],
        'general': ['fail', 'problem', 'negative', 'poor', 'weak', 'struggle', 'difficult',
                    'challenge', 'threat', 'worst', 'critical', 'disappointing']
    }
    
    text_lower = text.lower()
    found_positive = []
    found_negative = []
    
    # Search for keywords
    for category in positive_keywords:
        for keyword in positive_keywords[category]:
            if keyword in text_lower:
                found_positive.append(keyword)
    
    for category in negative_keywords:
        for keyword in negative_keywords[category]:
            if keyword in text_lower:
                found_negative.append(keyword)
    
    # Determine impact
    if is_positive:
        primary_found = found_positive
        opposite_found = found_negative
        impact = "positive"
    else:
        primary_found = found_negative
        opposite_found = found_positive
        impact = "negative"
    
    # Create reasoning
    evidence = primary_found[:5]  # Limit to top 5 keywords
    if opposite_found:
        evidence.append(f"(Note: {len(opposite_found)} contrasting terms also found)")
    
    return SentimentReasoning(
        category="Keywords & Terminology",
        description=f"The text contains {'positive' if is_positive else 'negative'} keywords that indicate {'optimistic' if is_positive else 'pessimistic'} sentiment.",
        evidence=evidence,
        impact=impact
    )

def analyze_tone_and_structure(text: str, is_positive: bool) -> SentimentReasoning:
    """Analyze the tone and structure of the text"""
    try:
        sentences = nltk.sent_tokenize(text)
    except LookupError:
        # Fallback to simple sentence splitting if NLTK data is not available
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    # Analyze sentence patterns
    exclamation_count = text.count('!')
    question_count = text.count('?')
    
    # Check for comparative language
    comparative_patterns = ['better than', 'worse than', 'compared to', 'versus', 'outperform', 'underperform']
    comparisons = [p for p in comparative_patterns if p in text.lower()]
    
    # Check for certainty/uncertainty language
    certainty_words = ['definitely', 'certainly', 'clearly', 'obviously', 'undoubtedly']
    uncertainty_words = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'uncertain']
    
    certainty_count = sum(1 for word in certainty_words if word in text.lower())
    uncertainty_count = sum(1 for word in uncertainty_words if word in text.lower())
    
    evidence = []
    
    if exclamation_count > 2:
        evidence.append(f"Uses {exclamation_count} exclamation marks (emphatic tone)")
    if question_count > 3:
        evidence.append(f"Contains {question_count} questions (uncertainty or speculation)")
    if comparisons:
        evidence.append(f"Comparative language: {', '.join(comparisons[:2])}")
    if certainty_count > uncertainty_count:
        evidence.append("Strong, confident language used")
    elif uncertainty_count > certainty_count:
        evidence.append("Tentative, uncertain language detected")
    
    # Determine the tone description
    if is_positive:
        tone_desc = "confident and optimistic" if certainty_count > uncertainty_count else "cautiously optimistic"
    else:
        tone_desc = "strongly negative" if certainty_count > uncertainty_count else "concerned and uncertain"
    
    return SentimentReasoning(
        category="Tone & Language Style",
        description=f"The writing style appears {tone_desc}, which reinforces the {('positive' if is_positive else 'negative')} sentiment.",
        evidence=evidence if evidence else ["Neutral, factual tone throughout"],
        impact="positive" if is_positive else "negative"
    )

def analyze_context_and_implications(text: str, is_positive: bool) -> SentimentReasoning:
    """Analyze the context and implications of the sentiment"""
    text_lower = text.lower()
    
    # Financial context indicators
    financial_indicators = {
        'earnings': ['earnings', 'revenue', 'profit', 'income', 'sales'],
        'market': ['market', 'stock', 'shares', 'trading', 'investors'],
        'future': ['forecast', 'outlook', 'guidance', 'expects', 'anticipate', 'project'],
        'comparison': ['year-over-year', 'quarter', 'growth', 'decline', 'increase', 'decrease']
    }
    
    contexts_found = []
    for category, keywords in financial_indicators.items():
        if any(keyword in text_lower for keyword in keywords):
            contexts_found.append(category)
    
    # Analyze implications
    evidence = []
    if 'earnings' in contexts_found:
        evidence.append("Discusses financial performance metrics")
    if 'future' in contexts_found:
        evidence.append("Contains forward-looking statements")
    if 'market' in contexts_found:
        evidence.append("References market conditions or investor sentiment")
    if 'comparison' in contexts_found:
        evidence.append("Includes period-over-period comparisons")
    
    # Determine impact description
    if is_positive:
        if len(contexts_found) >= 3:
            desc = "Comprehensive positive indicators across multiple business areas"
        else:
            desc = "Positive sentiment focused on specific aspects of performance"
    else:
        if len(contexts_found) >= 3:
            desc = "Widespread concerns affecting multiple business dimensions"
        else:
            desc = "Negative sentiment concentrated in particular areas"
    
    return SentimentReasoning(
        category="Business Context",
        description=desc,
        evidence=evidence if evidence else ["General business discussion without specific metrics"],
        impact="positive" if is_positive else "negative"
    )

def extract_key_phrases(text: str, num_phrases: int = 5) -> List[str]:
    """Extract key phrases from the text"""
    try:
        sentences = nltk.sent_tokenize(text)
    except LookupError:
        # Fallback to simple sentence splitting if NLTK data is not available
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    # Simple extraction of important phrases
    important_patterns = [
        r'expects? to \w+',
        r'announced \w+',
        r'reported \w+',
        r'growth of \d+%?',
        r'decline of \d+%?',
        r'increase[ds]? \w+',
        r'decrease[ds]? \w+',
        r'\d+% (increase|decrease|growth|decline)',
    ]
    
    key_phrases = []
    for sentence in sentences[:10]:  # Focus on first 10 sentences
        for pattern in important_patterns:
            matches = re.findall(pattern, sentence, re.IGNORECASE)
            key_phrases.extend(matches)
    
    # Also extract sentences with strong sentiment words
    strong_words = ['significant', 'major', 'critical', 'exceptional', 'unprecedented']
    for sentence in sentences:
        if any(word in sentence.lower() for word in strong_words) and len(sentence) < 100:
            key_phrases.append(sentence.strip())
    
    # Remove duplicates and limit
    seen = set()
    unique_phrases = []
    for phrase in key_phrases:
        if phrase.lower() not in seen:
            seen.add(phrase.lower())
            unique_phrases.append(phrase)
    
    return unique_phrases[:num_phrases]

def generate_summary(text: str, sentiment_label: str, score: float, reasoning: List[SentimentReasoning]) -> str:
    """Generate a comprehensive summary of the sentiment analysis"""
    is_positive = 'positive' in sentiment_label.lower()
    confidence_level = "very high" if score > 0.9 else "high" if score > 0.7 else "moderate"
    
    # Count evidence points
    total_evidence = sum(len(r.evidence) for r in reasoning)
    
    summary = f"The sentiment analysis indicates a {sentiment_label.lower()} sentiment with {confidence_level} confidence ({score*100:.1f}%). "
    
    if is_positive:
        summary += f"This conclusion is supported by {total_evidence} positive indicators across language, tone, and context. "
        summary += "The text suggests favorable conditions or outcomes, with optimistic language and constructive framing."
    else:
        summary += f"This assessment is based on {total_evidence} concerning indicators found in the text. "
        summary += "The content reveals challenges, risks, or negative developments that warrant attention."
    
    return summary

@router.post("/", response_model=SentimentOutput)
def analyze_sentiment(input: SentimentInput):
    if not input.text and not input.url:
        raise HTTPException(status_code=400, detail="Either text or URL must be provided")
    
    if input.url:
        # Extract text from URL
        text_to_analyze = extract_text_from_url(input.url)
        source_type = "url"
    else:
        text_to_analyze = input.text
        source_type = "text"
    
    if not text_to_analyze or len(text_to_analyze.strip()) == 0:
        raise HTTPException(status_code=400, detail="No text content found to analyze")
    
    # Analyze sentiment
    result = sentiment_pipeline(text_to_analyze)[0]
    
    # Determine if sentiment is positive
    is_positive = result["label"] == "POSITIVE"
    
    # Generate detailed reasoning
    reasoning = []
    
    # 1. Analyze keywords
    keyword_reasoning = analyze_keywords(text_to_analyze, is_positive)
    reasoning.append(keyword_reasoning)
    
    # 2. Analyze tone and structure
    tone_reasoning = analyze_tone_and_structure(text_to_analyze, is_positive)
    reasoning.append(tone_reasoning)
    
    # 3. Analyze context and implications
    context_reasoning = analyze_context_and_implications(text_to_analyze, is_positive)
    reasoning.append(context_reasoning)
    
    # 4. Extract key phrases
    key_phrases = extract_key_phrases(text_to_analyze)
    
    # 5. Generate summary
    summary = generate_summary(text_to_analyze, result["label"], result["score"], reasoning)
    
    return {
        "label": result["label"],
        "score": result["score"],
        "source_type": source_type,
        "reasoning": reasoning,
        "summary": summary,
        "key_phrases": key_phrases
    }
