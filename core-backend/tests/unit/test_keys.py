from app.db import keys


def test_profile_keys():
    assert keys.pk_profile() == "PROFILE"
    assert keys.sk_profile_meta() == "METADATA"
    assert keys.sk_edu("x") == "EDU#x"
    assert keys.sk_exp("x") == "EXP#x"
    assert keys.sk_ach("x") == "ACH#x"
    assert keys.sk_paper("x") == "PAPER#x"


def test_user_keys():
    assert keys.pk_user() == "USER"
    assert keys.sk_user("k") == "USER#k"
    assert keys.pk_toolbox() == "TOOLBOX"
    assert keys.sk_skills() == "SKILLS"


def test_project_keys():
    assert keys.pk_projects() == "PROJECTS"
    assert keys.sk_project("x") == "PROJ#x"


def test_blog_keys():
    assert keys.pk_blogs() == "BLOGS"
    assert keys.sk_blog("x") == "BLOG#x"


def test_comment_keys():
    assert keys.pk_comment("b") == "COMM#b"
    assert keys.sk_comment("t", "c") == "TIME#t#c"


def test_contact_keys():
    assert keys.pk_contact() == "CONTACT"
    assert keys.sk_message("t") == "MSG#t"


def test_bio_keys():
    assert keys.pk_bio() == "METADATA#BIO"
    assert keys.sk_bio() == "PROFILE"