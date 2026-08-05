def test_get_home_data(client, mock_dynamo_table):
    def get_item_side_effect(**kwargs):
        key = kwargs["Key"]
        if key.get("SKILLS") == "SKILLS":
            return {"Item": {"skills": ["Python", "AWS"]}}
        return {"Item": {"summary": "Sum", "hero_image": "hero.webp"}}

    def query_side_effect(**kwargs):
        expr = kwargs["KeyConditionExpression"]
        pk_value = expr._values[1]
        if pk_value == "BLOG":
            return {"Items": [{"id": "b1", "slug": "blog-1", "title": "Blog 1"}]}
        return {"Items": [{"id": "p1", "slug": "proj-1", "name": "Proj 1"}]}

    mock_dynamo_table.get_item.side_effect = get_item_side_effect
    mock_dynamo_table.query.side_effect = query_side_effect

    response = client.get("/public/home")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["bio"]["summary"] == "Sum"
    assert data["bio"]["hero_image"] == "hero.webp"
    assert data["skills"] == ["Python", "AWS"]
    assert data["projects"][0]["name"] == "Proj 1"
    assert data["blogs"][0]["slug"] == "blog-1"
