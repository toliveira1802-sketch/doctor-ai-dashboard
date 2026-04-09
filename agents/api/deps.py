"""Authentication dependencies for FastAPI routes."""

import hmac
import os

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

API_SECRET = os.getenv("API_SECRET", "")

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(_api_key_header)) -> str:
    """Validate the API key from the X-API-Key header.

    - If API_SECRET is not configured, ALL requests are rejected (fail-closed).
    - Uses hmac.compare_digest to prevent timing attacks.
    """
    if not API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server misconfigured: API_SECRET not set. All requests blocked.",
        )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header.",
        )

    if not hmac.compare_digest(api_key.encode(), API_SECRET.encode()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )

    return api_key
