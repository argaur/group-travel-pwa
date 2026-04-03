"""Places search/details facade — uses Google Places API (New) when configured, else sample data."""
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user
from config import get_settings

router = APIRouter()

SAMPLE_SEARCH: list[dict[str, Any]] = [
    {
        "place_id": "sample_chapora_fort",
        "name": "Chapora Fort, Goa",
        "formatted_address": "Chapora, North Goa, Goa 403509, India",
        "rating": 4.5,
        "user_ratings_total": 12840,
        "primary_photo_url": "https://placehold.co/600x360/e2e8f0/1e293b?text=Goa+Fort",
    },
    {
        "place_id": "sample_palolem",
        "name": "Palolem Beach",
        "formatted_address": "Palolem, Canacona, Goa 403702, India",
        "rating": 4.6,
        "user_ratings_total": 9200,
        "primary_photo_url": "https://placehold.co/600x360/fee2e2/991b1b?text=Beach",
    },
]

SAMPLE_DETAILS: dict[str, Any] = {
    "place_id": "sample_chapora_fort",
    "name": "Chapora Fort, Goa",
    "formatted_address": "Chapora, North Goa, Goa 403509, India",
    "rating": 4.5,
    "user_ratings_total": 12840,
    "reviews": [
        {"author": "Demo Traveller", "rating": 5, "text": "Sunset views are worth the climb — go early to beat heat."},
        {"author": "Family Planner", "rating": 4, "text": "Kids managed the steps fine; carry water."},
    ],
    "photos": [
        "https://placehold.co/800x480/e2e8f0/1e293b?text=Photo+1",
        "https://placehold.co/800x480/cffafe/0e7490?text=Photo+2",
    ],
    "source": "sample",
}


def _map_place_result(p: dict) -> dict[str, Any]:
    disp = p.get("displayName") or {}
    name = disp.get("text") if isinstance(disp, dict) else str(disp)
    photos = p.get("photos") or []
    primary = None
    if photos and isinstance(photos[0], dict):
        rid = photos[0].get("name")
        if rid:
            primary = f"https://places.googleapis.com/v1/{rid}/media?maxWidthPx=800"
    return {
        "place_id": p.get("id", "").replace("places/", ""),
        "name": name,
        "formatted_address": p.get("formattedAddress"),
        "rating": p.get("rating"),
        "user_ratings_total": p.get("userRatingCount"),
        "primary_photo_url": primary,
    }


@router.get("/search")
async def search_places(
    q: str = Query(..., min_length=1),
    user=Depends(get_current_user),
):
    _ = user
    settings = get_settings()
    if not settings.google_maps_api_key.strip():
        return {"results": SAMPLE_SEARCH, "source": "sample"}

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, headers=headers, json={"textQuery": q})
        if r.status_code != 200:
            return {"results": SAMPLE_SEARCH, "source": "sample_error", "detail": r.text[:200]}
        data = r.json()
        places = data.get("places") or []
        return {"results": [_map_place_result(p) for p in places[:8]], "source": "google"}
    except Exception:
        return {"results": SAMPLE_SEARCH, "source": "sample_error"}


@router.get("/{place_id}")
async def place_details(
    place_id: str,
    user=Depends(get_current_user),
):
    _ = user
    settings = get_settings()
    if not settings.google_maps_api_key.strip() or place_id.startswith("sample_"):
        return {**SAMPLE_DETAILS, "place_id": place_id, "source": "sample"}

    name = place_id if place_id.startswith("places/") else f"places/{place_id}"
    url = f"https://places.googleapis.com/v1/{name}"
    headers = {
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,reviews,reviews.rating,reviews.text,reviews.authorAttribution,photos",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url, headers=headers)
        if r.status_code != 200:
            return {**SAMPLE_DETAILS, "place_id": place_id, "source": "sample_error"}
        p = r.json()
        disp = p.get("displayName") or {}
        name_txt = disp.get("text") if isinstance(disp, dict) else ""
        revs = []
        for rv in (p.get("reviews") or [])[:5]:
            att = rv.get("authorAttribution") or {}
            revs.append({
                "author": att.get("displayName", "Reviewer"),
                "rating": rv.get("rating"),
                "text": rv.get("text", {}).get("text") if isinstance(rv.get("text"), dict) else rv.get("text"),
            })
        photos = []
        for ph in (p.get("photos") or [])[:4]:
            pid = ph.get("name")
            if pid:
                photos.append(f"https://places.googleapis.com/v1/{pid}/media?maxWidthPx=800")
        return {
            "place_id": p.get("id", "").replace("places/", ""),
            "name": name_txt,
            "formatted_address": p.get("formattedAddress"),
            "rating": p.get("rating"),
            "user_ratings_total": p.get("userRatingCount"),
            "reviews": revs,
            "photos": photos,
            "source": "google",
        }
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="places_unavailable")
