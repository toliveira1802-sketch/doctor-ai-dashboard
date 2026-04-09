from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Auth
    api_secret: str = ""

    # CORS
    allowed_origins: str = ""  # comma-separated list, e.g. "https://app.example.com,https://admin.example.com"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8100

    # LLM Providers
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    deepseek_api_key: str = ""

    # Research
    perplexity_api_key: str = ""

    # Document Processing
    kimi_api_key: str = ""

    # Embedding
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # Kommo CRM
    kommo_token: str = ""
    kommo_domain: str = ""

    # Chunking
    chunk_size: int = 512
    chunk_overlap: int = 64

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
