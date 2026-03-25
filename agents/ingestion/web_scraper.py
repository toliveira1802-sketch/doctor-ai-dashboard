"""Web scraper for extracting content from URLs for RAG ingestion."""

import httpx
from bs4 import BeautifulSoup


class WebScraper:
    """Scrape web pages and extract clean text content."""

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    }

    # Tags to remove (noise)
    REMOVE_TAGS = [
        "script", "style", "nav", "footer", "header",
        "aside", "iframe", "noscript", "form",
    ]

    async def scrape(self, url: str, timeout: int = 30) -> dict:
        """Scrape a URL and return clean text content.

        Returns dict with 'text', 'title', 'url', 'word_count'.
        """
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True, headers=self.HEADERS
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Extract title
        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        # Remove noise tags
        for tag_name in self.REMOVE_TAGS:
            for tag in soup.find_all(tag_name):
                tag.decompose()

        # Try to find main content area
        main_content = (
            soup.find("article")
            or soup.find("main")
            or soup.find(role="main")
            or soup.find(class_=lambda c: c and ("content" in c or "article" in c))
            or soup.body
        )

        if not main_content:
            main_content = soup

        # Extract text
        text = main_content.get_text(separator="\n", strip=True)

        # Clean up multiple blank lines
        lines = [line.strip() for line in text.splitlines()]
        text = "\n".join(line for line in lines if line)

        return {
            "text": text,
            "title": title,
            "url": url,
            "word_count": len(text.split()),
        }

    async def scrape_multiple(self, urls: list[str]) -> list[dict]:
        """Scrape multiple URLs."""
        results = []
        for url in urls:
            try:
                result = await self.scrape(url)
                results.append(result)
            except Exception as e:
                results.append({"url": url, "error": str(e), "text": ""})
        return results


web_scraper = WebScraper()
