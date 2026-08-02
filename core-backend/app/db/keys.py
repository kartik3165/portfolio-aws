def pk_profile():
    return "PROFILE"


def sk_profile_meta():
    return "METADATA"


def sk_edu(edu_id: str):
    return f"EDU#{edu_id}"


def sk_exp(exp_id: str):
    return f"EXP#{exp_id}"


def sk_ach(ach_id: str):
    return f"ACH#{ach_id}"


def sk_paper(paper_id: str):
    return f"PAPER#{paper_id}"


def pk_user():
    return "USER"


def sk_user(username: str):
    return f"USER#{username}"


def pk_toolbox():
    return "TOOLBOX"


def sk_skills():
    return "SKILLS"


def pk_projects():
    return "PROJECTS"


def sk_project(proj_id: str):
    return f"PROJ#{proj_id}"


def pk_blogs():
    return "BLOGS"


def sk_blog(blog_id: str):
    return f"BLOG#{blog_id}"


def pk_comment(blog_id: str):
    return f"COMM#{blog_id}"


def sk_comment(timestamp: str, comment_id: str):
    return f"TIME#{timestamp}#{comment_id}"


def pk_contact():
    return "CONTACT"


def sk_message(timestamp: str):
    return f"MSG#{timestamp}"


def pk_bio():
    return "METADATA#BIO"


def sk_bio():
    return "PROFILE"
