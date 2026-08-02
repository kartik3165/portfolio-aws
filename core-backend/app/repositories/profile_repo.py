import os
from datetime import datetime
from uuid6 import uuid7
from botocore.exceptions import ClientError
from app.db.dynamo import profile_table
from app.db.keys import (
    pk_profile,
    sk_exp,
    sk_paper,
    sk_ach,
    pk_bio,
    sk_bio
)


class ProfileRepo:
    def __init__(self):
        self.table = profile_table()
    
    async def list_experience(self):
        try:
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues={
                    ":pk": pk_profile(),
                    ":sk": "EXP#"
                }
            )
            return response.get("Items", [])
        except ClientError as e:
            print(f"Error listing experience: {e}")
            return []
    
    async def create_experience(self, data: dict, email: str):
        exp_id = str(uuid7())
        item = {
            "PK": pk_profile(),
            "SK": sk_exp(exp_id),
            "id": exp_id,
            **data
        }
        self.table.put_item(Item=item)
        return item

    async def update_experience(self, exp_id: str, updates: dict, email: str):
        update_expr = []
        expr_attr_names = {}
        expr_attr_values = {}

        for key, value in updates.items():
            if value is not None:
                attr_name = f"#{key}"
                attr_value = f":{key}"
                update_expr.append(f"{attr_name} = {attr_value}")
                expr_attr_names[attr_name] = key
                expr_attr_values[attr_value] = value

        update_expr.append("#updated_by = :_updated_by")
        expr_attr_names["#updated_by"] = "updated_by"
        expr_attr_values[":_updated_by"] = email
        update_expr.append("#updated_at = :_updated_at")
        expr_attr_names["#updated_at"] = "updated_at"
        expr_attr_values[":_updated_at"] = datetime.now().isoformat()

        if not update_expr:
            return None

        try:
            response = self.table.update_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_exp(exp_id)
                },
                UpdateExpression="SET " + ", ".join(update_expr),
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
                ReturnValues="ALL_NEW",
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return response.get("Attributes")
        except ClientError:
            return None

    async def delete_experience(self, exp_id: str, email: str):
        try:
            self.table.delete_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_exp(exp_id)
                },
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return True
        except ClientError:
            return False

    async def list_papers(self):
        try:
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues={
                    ":pk": pk_profile(),
                    ":sk": "PAPER#"
                }
            )
            return response.get("Items", [])
        except ClientError as e:
            print(f"Error listing papers: {e}")
            return []

    async def create_paper(self, data: dict, email: str):
        paper_id = str(uuid7())
        item = {
            "PK": pk_profile(),
            "SK": sk_paper(paper_id),
            "id": paper_id,
            **data
        }
        self.table.put_item(Item=item)
        return item

    async def update_paper(self, paper_id: str, updates: dict, email: str):
        update_expr = []
        expr_attr_names = {}
        expr_attr_values = {}

        for key, value in updates.items():
            if value is not None:
                attr_name = f"#{key}"
                attr_value = f":{key}"
                update_expr.append(f"{attr_name} = {attr_value}")
                expr_attr_names[attr_name] = key
                expr_attr_values[attr_value] = value

        update_expr.append("#updated_by = :_updated_by")
        expr_attr_names["#updated_by"] = "updated_by"
        expr_attr_values[":_updated_by"] = email
        update_expr.append("#updated_at = :_updated_at")
        expr_attr_names["#updated_at"] = "updated_at"
        expr_attr_values[":_updated_at"] = datetime.now().isoformat()

        if not update_expr:
            return None

        try:
            response = self.table.update_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_paper(paper_id)
                },
                UpdateExpression="SET " + ", ".join(update_expr),
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
                ReturnValues="ALL_NEW",
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return response.get("Attributes")
        except ClientError:
            return None

    async def delete_paper(self, paper_id: str, email: str):
        try:
            self.table.delete_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_paper(paper_id)
                },
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return True
        except ClientError:
            return False

    async def list_achievements(self):
        try:
            response = self.table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues={
                    ":pk": pk_profile(),
                    ":sk": "ACH#"
                }
            )
            return response.get("Items", [])
        except ClientError as e:
            print(f"Error listing achievements: {e}")
            return []

    async def create_achievement(self, data: dict, email: str):
        ach_id = str(uuid7())
        item = {
            "PK": pk_profile(),
            "SK": sk_ach(ach_id),
            "id": ach_id,
            **data
        }
        self.table.put_item(Item=item)
        return item

    async def update_achievement(self, ach_id: str, updates: dict, email: str):
        update_expr = []
        expr_attr_names = {}
        expr_attr_values = {}

        for key, value in updates.items():
            if value is not None:
                attr_name = f"#{key}"
                attr_value = f":{key}"
                update_expr.append(f"{attr_name} = {attr_value}")
                expr_attr_names[attr_name] = key
                expr_attr_values[attr_value] = value

        update_expr.append("#updated_by = :_updated_by")
        expr_attr_names["#updated_by"] = "updated_by"
        expr_attr_values[":_updated_by"] = email
        update_expr.append("#updated_at = :_updated_at")
        expr_attr_names["#updated_at"] = "updated_at"
        expr_attr_values[":_updated_at"] = datetime.now().isoformat()

        if not update_expr:
            return None

        try:
            response = self.table.update_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_ach(ach_id)
                },
                UpdateExpression="SET " + ", ".join(update_expr),
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
                ReturnValues="ALL_NEW",
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return response.get("Attributes")
        except ClientError:
            return None

    async def delete_achievement(self, ach_id: str, email: str):
        try:
            self.table.delete_item(
                Key={
                    "PK": pk_profile(),
                    "SK": sk_ach(ach_id)
                },
                ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)"
            )
            return True
        except ClientError:
            return False

    async def get_bio(self):
        try:
            response = self.table.get_item(
                Key={
                    "PK": pk_bio(),
                    "SK": sk_bio()
                }
            )
            item = response.get("Item")
            if item:
                # remove internal keys
                item.pop("PK", None)
                item.pop("SK", None)
                return item
            return {}
        except ClientError as e:
            print(f"Error getting bio: {e}")
            return {}

    async def update_bio(self, data: dict, email: str):
        item = {
            "PK": pk_bio(),
            "SK": sk_bio(),
            "updated_by": email,
            "updated_at": datetime.now().isoformat(),
            **data
        }
        try:
            self.table.put_item(Item=item)
            return True
        except ClientError as e:
            print(f"Error updating bio: {e}")
            return False
