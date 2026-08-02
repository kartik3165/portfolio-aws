import os
import boto3
from typing import TYPE_CHECKING
from dotenv import load_dotenv

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource

load_dotenv()

_dynamodb: "DynamoDBServiceResource | None" = None


def get_region():
    return os.getenv("AWS_REGION", "ap-south-1")


def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource(
            "dynamodb",
            region_name=get_region(),
            endpoint_url=os.getenv("DYNAMODB_ENDPOINT") or None,
        )
    return _dynamodb


def get_table(env_name: str):
    name = os.getenv(env_name)
    if not name:
        raise RuntimeError(f"{env_name} not set")
    return get_dynamodb().Table(name)


def blogs_table():
    return get_table("BLOG_TABLE")


def comments_table():
    return get_table("COMMENTS_TABLE")


def skills_table():
    return get_table("SKILL_TABLE")


def projects_table():
    return get_table("PROJECTS_TABLE")


def profile_table():
    return get_table("PROFILE_TABLE")
