import os
import json
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm
import time
import re

# Initialize Sentence Transformer model
model = SentenceTransformer('all-mpnet-base-v2')  # 768 dimensions, matches your Pinecone index

# Initialize Pinecone with the new API
PINECONE_API_KEY = "pcsk_7go2e_KA1R7n698TVxy8hvzW8N6vWFB3miVDRGufrEb8BSbkkEDxWV7FftmuZZbaP4WWs"  # Replace with your API key
INDEX_NAME = "roth-davies-legal"

# Create Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Get the index - if it doesn't exist yet, create it
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=768,  # dimension of all-MiniLM-L6-v2
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")  # Adjust region as needed
    )

# Connect to index
index = pc.Index(INDEX_NAME)

def extract_content_from_url(url):
    """Extract title, content and metadata from a URL"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = soup.title.string if soup.title else ""
        
        # Extract main content - adjust selectors based on the website structure
        content_selectors = ['article', '.post-content', '.entry-content', 'main', '#content']
        content = ""
        for selector in content_selectors:
            content_element = soup.select_one(selector)
            if content_element:
                # Remove script, style, and nav elements
                for element in content_element.select('script, style, nav, header, footer'):
                    element.decompose()
                content = content_element.get_text(separator=' ', strip=True)
                break
        
        # Clean up content
        content = re.sub(r'\s+', ' ', content).strip()
        
        # Determine category based on URL path
        category = "general"
        if "personal-injury" in url:
            category = "personal-injury"
        elif "criminal-defense" in url:
            category = "criminal-defense"
        elif "family-law" in url:
            category = "family-law"
        elif "dui" in url or "dwi" in url:
            category = "dui-dwi"
        
        return {
            "url": url,
            "title": title,
            "content": content[:1000],  # Truncate content to keep vector size manageable
            "category": category
        }
    except Exception as e:
        print(f"Error processing {url}: {e}")
        return None

def process_sitemap(sitemap_url):
    """Process sitemap and extract all URLs"""
    try:
        response = requests.get(sitemap_url)
        soup = BeautifulSoup(response.content, 'lxml-xml')
        urls = []
        
        # Check if this is a sitemap index
        sitemapTags = soup.find_all('sitemap')
        if sitemapTags:
            print("This is a sitemap index. Processing each sitemap...")
            for sitemap in sitemapTags:
                loc = sitemap.find('loc')
                if loc:
                    sub_sitemap_url = loc.text
                    print(f"Processing sub-sitemap: {sub_sitemap_url}")
                    # Recursively process each sitemap
                    sub_urls = process_sitemap(sub_sitemap_url)
                    urls.extend(sub_urls)
        else:
            # This is a regular sitemap
            for url in soup.find_all('url'):
                loc = url.find('loc')
                if loc:
                    urls.append(loc.text)
        
        print(f"Found {len(urls)} URLs in sitemap")
        return urls
    except Exception as e:
        print(f"Error processing sitemap: {e}")
        return []

def batch_upsert_to_pinecone(items, batch_size=100):
    """Batch upsert items to Pinecone"""
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        try:
            # Convert to the format expected by the new API
            records = [(item["id"], item["values"], item["metadata"]) for item in batch]
            index.upsert(vectors=records)
            print(f"Upserted batch {i//batch_size + 1}/{(len(items) + batch_size - 1)//batch_size}")
        except Exception as e:
            print(f"Error upserting batch: {e}")
        
        # Rate limiting to avoid overwhelming the API
        time.sleep(1)

def main():
    # Replace with your actual sitemap URL
    sitemap_url = "https://rothdavies.com/sitemap.xml"
    
    # Process sitemap to get URLs
    urls = process_sitemap(sitemap_url)
    
    # Process each URL and generate embeddings
    vectors_to_upsert = []
    
    for idx, url in enumerate(tqdm(urls)):
        page_data = extract_content_from_url(url)
        if not page_data:
            continue
        
        # Create text to embed (title + truncated content)
        text_to_embed = f"{page_data['title']} {page_data['content']}"
        
        # Generate embedding
        embedding = model.encode(text_to_embed).tolist()
        
        # Create vector entry for Pinecone
        vector_entry = {
            "id": f"page_{idx}",
            "values": embedding,
            "metadata": {
                "url": page_data["url"],
                "title": page_data["title"],
                "category": page_data["category"],
                "snippet": page_data["content"][:200] + "..."  # Short preview
            }
        }
        
        vectors_to_upsert.append(vector_entry)
    
    # Batch upsert to Pinecone
    print(f"Upserting {len(vectors_to_upsert)} vectors to Pinecone...")
    batch_upsert_to_pinecone(vectors_to_upsert)
    
    print("Done! All content has been indexed in Pinecone.")

if __name__ == "__main__":
    main()