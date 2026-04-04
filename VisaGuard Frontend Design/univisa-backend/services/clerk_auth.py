"""Verify Clerk session JWTs for DSO routes (JWKS)."""
from __future__ import annotations

import os
from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

_bearer = HTTPBearer(auto_error=False)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    url = os.getenv("CLERK_JWKS_URL", "").strip()
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Server missing CLERK_JWKS_URL (Clerk Dashboard → API Keys → JWKS URL).",
        )
    if _jwks_client is None:
        _jwks_client = PyJWKClient(url)
    return _jwks_client


def _issuer() -> str | None:
    v = os.getenv("CLERK_JWT_ISSUER", "").strip()
    return v or None


def decode_clerk_token(token: str) -> dict[str, Any]:
    """Validate JWT and return payload (includes sub = Clerk user id)."""
    client = _get_jwks_client()
    try:
        signing_key = client.get_signing_key_from_jwt(token)
    except PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e!s}") from e

    issuer = _issuer()
    opts: dict = {"verify_aud": False}
    if not issuer:
        opts["verify_iss"] = False
    try:
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            **({"issuer": issuer} if issuer else {}),
            options=opts,
        )
    except PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e!s}") from e

    return payload


def clerk_email_from_payload(payload: dict[str, Any]) -> str | None:
    """Best-effort primary email from Clerk JWT (template may need to include email claims)."""
    email = payload.get("email")
    if isinstance(email, str) and email.strip():
        return email.strip().lower()
    nested = payload.get("primary_email_address")
    if isinstance(nested, str) and nested.strip():
        return nested.strip().lower()
    return None


def get_clerk_payload(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token")
    return decode_clerk_token(creds.credentials)


def get_clerk_user_id(payload: dict[str, Any] = Depends(get_clerk_payload)) -> str:
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise HTTPException(status_code=401, detail="Token missing sub")
    return sub
