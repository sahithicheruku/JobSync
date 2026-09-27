"""Smoke-check the pinned FastAPI/multipart integration without loading ML models.
Run: python -m unittest discover -s tests
Requires FastAPI, python-multipart, and httpx<0.28 (Starlette 0.27 test client).
"""
import unittest
from fastapi import FastAPI, File, UploadFile
from fastapi.testclient import TestClient


class MultipartCompatibilityTest(unittest.TestCase):
    def test_upload_parser(self):
        app = FastAPI()

        @app.post('/upload')
        async def upload(file: UploadFile = File(...)):
            return {'filename': file.filename, 'size': len(await file.read())}

        with TestClient(app) as client:
            response = client.post('/upload', files={'file': ('resume.pdf', b'%PDF-test', 'application/pdf')})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {'filename': 'resume.pdf', 'size': 9})
            self.assertEqual(client.post('/upload').status_code, 422)


if __name__ == '__main__':
    unittest.main()
