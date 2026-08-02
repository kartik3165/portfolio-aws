import boto3
import os
from botocore.config import Config
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

class StorageService:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key_id = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.public_base_url = os.getenv("R2_PUBLIC_BASE_URL")

        if not all([self.account_id, self.access_key_id, self.secret_access_key, self.bucket_name]):
            raise RuntimeError("R2 credentials not set")

        r2_api_endpoint = f"https://{self.account_id}.r2.cloudflarestorage.com"
        
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=r2_api_endpoint,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def generate_presigned_url(self, key: str, content_type: str) -> Dict[str, str]:
        """
        Generate a presigned URL for PUT operation.
        """
        try:
            upload_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=3600,  # 1 hour
            )
            
            base_url = (self.public_base_url or "").rstrip("/")
            public_url = f"{base_url}/{key}"
            
            return {
                "upload_url": upload_url,
                "public_url": public_url,
                "key": key
            }
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            raise e
