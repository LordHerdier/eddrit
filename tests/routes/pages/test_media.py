import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from starlette.testclient import TestClient
import httpx

# We need to patch the client that is created in the app lifespan
# OR we can just mock the client.send method if we can access it.
# Since we can't easily access the client instance from the app object (it's in a closure/internal state),
# we will create a fresh app instance for this test to control the lifespan.

from eddrit.app import app

@pytest.fixture
def mock_client_send():
    with patch("httpx.AsyncClient.send", new_callable=AsyncMock) as mock:
        yield mock

def test_media_proxy_jpg(mock_client_send):
    # Setup the mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000"}
    
    # aiter_raw needs to be an async iterator
    async def async_iter():
        yield b"fake_image_data"
    
    mock_response.aiter_raw = MagicMock(return_value=async_iter())
    mock_response.aclose = AsyncMock()
    
    mock_client_send.return_value = mock_response

    # Create a TestClient. 
    # Note: TestClient(app) triggers lifespan.
    # Our patch on httpx.AsyncClient.send should affect the client created inside lifespan 
    # IF the client is created when TestClient starts context.
    # TestClient DOES start lifespan on __enter__.
    
    with TestClient(app) as client:
        response = client.get("/123.jpg")
        
        assert response.status_code == 200
        assert response.path == "/123.jpg" # Not real, but verifying request
        assert response.headers["content-type"] == "image/jpeg"
        assert response.content == b"fake_image_data"
        
        # Verify the mock was called with correct url
        args, kwargs = mock_client_send.call_args
        request = args[0]
        assert str(request.url) == "https://i.redd.it/123.jpg"

def test_media_proxy_404_on_non_image():
    # Attempt to access a non-image file should result in 404 (handled by Starlette routing, not our proxy)
    # Because we only defined handling for jpg, png, etc.
    with TestClient(app) as client:
        response = client.get("/123.txt")
        assert response.status_code == 404
