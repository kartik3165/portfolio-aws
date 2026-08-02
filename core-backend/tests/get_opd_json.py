import sys
import os
import json
from decimal import Decimal

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.repositories.project_repo import ProjectRepo

# Helper to handle Decimal serialization from DynamoDB
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        return super(DecimalEncoder, self).default(o)

def get_opd_project_json():
    project_id = "019c1329-006a-74f1-8dd1-b49470a4f5ce"
    try:
        repo = ProjectRepo()
        project = repo.get_project(project_id)
        if project:
            if "PK" in project: del project["PK"]
            if "SK" in project: del project["SK"]
            
            print(json.dumps(project, indent=2, cls=DecimalEncoder))
        else:
            print("Project not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_opd_project_json()
