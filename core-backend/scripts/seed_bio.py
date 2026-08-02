import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.repositories.profile_repo import ProfileRepo

def seed_bio():
    repo = ProfileRepo()
    
    bio_data = {
        "summary": "A backend-focused engineer passionate about distributed systems, cloud architecture, and building reliable solutions that scale. I enjoy solving complex problems with simple, efficient designs and creating technology that makes a real-world impact.",
        "about_intro": "Computer Engineering student at ZCOER Pune with a strong interest in building scalable web applications and designing efficient backend systems. I enjoy turning ideas into practical, real-world technology solutions that create meaningful impact.\n\nPreviously, I completed an AI research internship where I worked on machine learning concepts and deep learning systems, strengthening my analytical thinking and problem-solving skills. I thrive at the intersection of technology, innovation, and leadership, combining technical expertise with teamwork and initiative.",
        "story": "I am currently a Computer Engineering student at ZCOER Pune. My journey started with simple Python scripts and evolved into architecting complex serverless backends and real-time IoT systems.\n\nI follow a mindset I call Brutalist Engineering keeping systems simple, robust, and effective rather than overcomplicated. In the past, I completed an AI research internship where I explored machine learning theory and deep learning concepts, which strengthened my analytical thinking and system design approach.Beyond coding, I enjoy leading communities, organizing events, and taking initiative in activities that combine leadership with technology.",
        "highlights": [
            "NEC 2025 Finalist",
            "Fashion Club President",
            "Rising Star @ Bhumi NGO",
            "Hacktoberfest"
        ]
    }
    
    print("Seeding bio data...")
    success = repo.update_bio(bio_data)
    if success:
        print("Bio seeded successfully!")
    else:
        print("Failed to seed bio.")

if __name__ == "__main__":
    seed_bio()
