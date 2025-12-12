from starlette.requests import Request
from starlette.responses import StreamingResponse
from starlette.routing import Route


async def media_proxy(request: Request) -> StreamingResponse:
    path = request.url.path
    
    # We use the existing http client
    client = request.state.http_client
    
    url = f"https://i.redd.it{path}"
    
    req = client.build_request("GET", url)
    r = await client.send(req, stream=True)
    
    return StreamingResponse(
        r.aiter_raw(),
        status_code=r.status_code,
        headers={
            "Content-Type": r.headers.get("Content-Type", "application/octet-stream"),
            "Cache-Control": r.headers.get("Cache-Control", "public, max-age=31536000"),
        },
        background=r.aclose,
    )


routes = [
    Route("/{id}.jpg", endpoint=media_proxy, methods=["GET"]),
    Route("/{id}.jpeg", endpoint=media_proxy, methods=["GET"]),
    Route("/{id}.png", endpoint=media_proxy, methods=["GET"]),
    Route("/{id}.gif", endpoint=media_proxy, methods=["GET"]),
    Route("/{id}.webp", endpoint=media_proxy, methods=["GET"]),
]
