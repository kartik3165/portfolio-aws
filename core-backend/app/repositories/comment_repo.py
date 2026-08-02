from datetime import datetime, timezone
from uuid import UUID
from uuid6 import uuid7
from boto3.dynamodb.conditions import Key
# We need ClientError for delete_comment exception handling
from botocore.exceptions import ClientError

from app.db.dynamo import comments_table


class CommentRepo:
    def __init__(self):
        self.table = comments_table()

    async def list_comments(self, blog_id: UUID):
        res = self.table.query(
            KeyConditionExpression=Key("PK").eq(f"BLOG#{blog_id}")
        )
        return res.get("Items", [])

    async def create_comment(self, blog_id: UUID, name: str, body: str):
        now = datetime.now(timezone.utc)
        comment_id = uuid7()

        item = {
            "PK": f"BLOG#{blog_id}",
            "SK": f"TIME#{now.isoformat()}#{comment_id.hex[:6]}",
            "id": str(comment_id),
            "name": name,
            "body": body,
            "date": now.strftime("%d %b %Y"),
            "timestamp": now.isoformat(),
        }

        self.table.put_item(Item=item)
        return item

    async def delete_comment(self, blog_id: str, comment_id: str, email: str):
        from boto3.dynamodb.conditions import Attr
        
        try:
            # Query the blog partition and filter by id
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(f"BLOG#{blog_id}"),
                FilterExpression=Attr("id").eq(comment_id)
            )
            items = response.get("Items", [])
            
            if not items:
                return False
                
            comment = items[0]
            
            self.table.delete_item(
                Key={
                    "PK": comment["PK"],
                    "SK": comment["SK"]
                }
            )
            return True
        except Exception as e:
            print(f"Error deleting comment: {e}")
            return False