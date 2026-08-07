from datetime import datetime
import os
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from app.db.dynamo import blogs_table
from app.schemas.blog import BlogCreate, BlogDelete, BlogUpdate
from uuid import UUID
from uuid6 import uuid7

from dotenv import load_dotenv
load_dotenv()

class BlogRepo:

    def __init__(self):
        self.table = blogs_table()

    async def list_blogs(self, include_drafts: bool = False, email: str = None):
        try:
            res = self.table.query(
                KeyConditionExpression=Key("PK").eq("BLOG")
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code == "ResourceNotFoundException":
                return []
            raise
        items = res.get("Items", [])
        
        # Filter drafts if not permitted
        if not include_drafts:
             items = [item for item in items if not item.get("is_draft", False)]

        for item in items:
            if "slug" not in item:
                item["slug"] = item["id"]
        return items

    async def get_blog(self, id_or_slug: str, email: str = None):
        from boto3.dynamodb.conditions import Attr
        # Try getting by ID first
        try:
            res = self.table.get_item(
                Key={"PK": "BLOG", "SK": f"BLOG#{id_or_slug}"}
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code == "ResourceNotFoundException":
                return None
            raise
        item = res.get("Item")
        if item:
            return item
            
        # Try getting by slug
        try:
            res = self.table.query(
                KeyConditionExpression=Key("PK").eq("BLOG"),
                FilterExpression=Attr("slug").eq(id_or_slug)
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code == "ResourceNotFoundException":
                return None
            raise
        items = res.get("Items", [])
        return items[0] if items else None

    async def create_blog(self, blog: dict, email: str):
        now = datetime.now().isoformat()
        blog_id = uuid7()

        item = {
            "PK": "BLOG",
            "SK": f"BLOG#{str(blog_id)}",
            "id": str(blog_id),
            "title": blog["title"],
            "slug": blog["slug"],
            "excerpt": blog["excerpt"],
            "author": blog["author"],
            "date": blog["date"],
            "readtime": blog["readtime"],
            "image": blog["image"],
            "is_draft": blog.get("is_draft", False),
            "gallery": blog.get("gallery", []),
            "tags": blog["tags"],
            "content": blog["content"],
            "created_at": now,
            "updated_at": now,
        }

        self.table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)"
            )
        
        return item

    async def update_blog(self, blog_id: str, updates: dict, email: str):
        now = datetime.now().isoformat()

        update_expr_parts = []
        expr_attr_name = {}
        expr_attr_values = {}


        def add_field(field: str, value):
            name_key = f"#{field}"
            value_key = f":{field}"
            update_expr_parts.append(f"{name_key} = {value_key}")
            expr_attr_name[name_key] = field
            expr_attr_values[value_key] = value

        for field in [
            "title", "slug", "excerpt", "author", "date",
            "readtime", "image", "gallery", "tags", "content", "is_draft"
        ]:
            if field in updates and updates[field] is not None:
                add_field(field, updates[field])
        
        add_field("updated_at", now)

        if not update_expr_parts:  # pragma: no cover
            return await self.get_blog(blog_id, email)

        # Resolve ID if slug is passed
        real_id = blog_id
        current_blog = await self.get_blog(blog_id, email)
        if current_blog and current_blog.get('id'):
            real_id = current_blog.get('id')
        elif not current_blog:
            return None

        res = self.table.update_item(
            Key={"PK": "BLOG", "SK": f"BLOG#{str(real_id)}"},
            UpdateExpression="SET " + ", ".join(update_expr_parts),
            ExpressionAttributeNames=expr_attr_name,
            ExpressionAttributeValues=expr_attr_values,
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
            ReturnValues="ALL_NEW",
        )
    
        return res["Attributes"]

    async def delete_blog(self, blog_id: str, email: str):
        self.table.delete_item(
            Key={"PK": "BLOG", "SK": f"BLOG#{blog_id}"},
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
        )
        return True

            
        
