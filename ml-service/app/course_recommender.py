import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict
import os

class CourseRecommender:
    def __init__(self, data_path: str = "./data"):
        """Initialize the course recommender with pre-trained model and data"""
        self.data_path = data_path
        self.model = None
        self.courses_df = None
        self._load_model()
        self._load_courses()

    def _load_model(self):
        """Load the sentence transformer model"""
        print("Loading sentence transformer model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded successfully!")

    def _load_courses(self):
        """Load course data with embeddings"""
        pkl_path = os.path.join(self.data_path, "Coursera_after_embeddings.pkl")
        csv_path = os.path.join(self.data_path, "Coursera_Completed_Data.csv")

        try:
            # Try to load pickle file with embeddings first
            print(f"Loading course data from {pkl_path}...")
            self.courses_df = pd.read_pickle(pkl_path)
            # Ensure embeddings are numpy arrays
            if 'Embeddings skills' in self.courses_df.columns:
                self.courses_df['Embeddings skills'] = self.courses_df['Embeddings skills'].apply(np.array)
            print(f"Loaded {len(self.courses_df)} courses with embeddings!")
        except Exception as e:
            print(f"Could not load pickle file: {e}")
            print(f"Loading from CSV: {csv_path}...")
            self.courses_df = pd.read_csv(csv_path)
            # Generate embeddings for courses if not present
            if 'Embeddings skills' not in self.courses_df.columns:
                print("Generating embeddings for courses...")
                self.courses_df['Embeddings skills'] = self.courses_df['Skills Gained'].apply(
                    lambda x: self.model.encode(str(x))
                )
            else:
                # Parse string embeddings to numpy arrays
                print("Parsing embeddings from CSV...")
                def parse_embedding(emb):
                    if isinstance(emb, str):
                        return np.fromstring(emb.strip('[]'), sep=' ')
                    elif isinstance(emb, np.ndarray):
                        return emb
                    else:
                        return np.array(emb)
                self.courses_df['Embeddings skills'] = self.courses_df['Embeddings skills'].apply(parse_embedding)
            print(f"Loaded {len(self.courses_df)} courses!")

    def recommend_courses(
        self,
        missing_skills: List[str],
        top_n: int = 10
    ) -> List[Dict]:
        """
        Recommend courses based on missing skills

        Args:
            missing_skills: List of skills the user is missing
            top_n: Number of courses to recommend

        Returns:
            List of recommended courses with metadata
        """
        if not missing_skills:
            return []

        # Create embedding for missing skills
        missing_skills_text = " ".join(missing_skills)
        missing_skills_embedding = self.model.encode(missing_skills_text)

        # Get course embeddings
        # Ensure embeddings are numpy arrays (handle string representations)
        embeddings_list = []
        for emb in self.courses_df['Embeddings skills'].values:
            if isinstance(emb, str):
                # Parse string representation of array
                emb = np.fromstring(emb.strip('[]'), sep=' ')
            elif not isinstance(emb, np.ndarray):
                emb = np.array(emb)
            embeddings_list.append(emb)
        course_embeddings = np.vstack(embeddings_list)

        # Calculate cosine similarity
        similarities = cosine_similarity([missing_skills_embedding], course_embeddings)[0]

        # Add similarity scores to dataframe
        self.courses_df['Similarity'] = similarities

        # Sort by similarity and get top N
        top_courses = self.courses_df.nlargest(top_n, 'Similarity')

        # Format results
        recommendations = []
        for _, course in top_courses.iterrows():
            recommendations.append({
                'course_name': course['Course Name'],
                'provider': course['Provider'],
                'skills_gained': course['Skills Gained'],
                'rating': float(course['Rating Score']) if pd.notna(course['Rating Score']) else None,
                'level_duration': course.get('Level & Duration', 'N/A'),
                'course_url': course['Course Link'],
                'course_image': course.get('Course Image', ''),
                'provider_image': course.get('Provider Image', ''),
                'similarity_score': float(course['Similarity']),
                'match_percentage': round(float(course['Similarity']) * 100, 2)
            })

        return recommendations

    def recommend_for_job(
        self,
        job_description: str,
        resume_skills: List[str],
        top_n: int = 10
    ) -> Dict:
        """
        Recommend courses based on job description and current skills

        Args:
            job_description: The job description text
            resume_skills: Skills the user currently has
            top_n: Number of courses to recommend

        Returns:
            Dictionary with skill gap analysis and course recommendations
        """
        # Extract skills from job description using simple keyword matching
        from .skill_extractor import SkillExtractor

        extractor = SkillExtractor()
        required_skills = extractor.extract_from_job_description(job_description)

        # Compare skills
        skill_comparison = extractor.compare_skills(resume_skills, required_skills)

        # Get course recommendations for missing skills
        recommendations = self.recommend_courses(
            skill_comparison['missing_skills'],
            top_n=top_n
        )

        return {
            'skill_analysis': skill_comparison,
            'recommended_courses': recommendations,
            'missing_skills_count': len(skill_comparison['missing_skills']),
            'match_percentage': skill_comparison['match_percentage']
        }

    def search_courses(self, query: str, top_n: int = 10) -> List[Dict]:
        """
        Search courses by query string

        Args:
            query: Search query
            top_n: Number of results to return

        Returns:
            List of matching courses
        """
        query_embedding = self.model.encode(query)

        # Ensure embeddings are numpy arrays (handle string representations)
        embeddings_list = []
        for emb in self.courses_df['Embeddings skills'].values:
            if isinstance(emb, str):
                emb = np.fromstring(emb.strip('[]'), sep=' ')
            elif not isinstance(emb, np.ndarray):
                emb = np.array(emb)
            embeddings_list.append(emb)
        course_embeddings = np.vstack(embeddings_list)

        similarities = cosine_similarity([query_embedding], course_embeddings)[0]
        self.courses_df['Similarity'] = similarities

        top_courses = self.courses_df.nlargest(top_n, 'Similarity')

        results = []
        for _, course in top_courses.iterrows():
            results.append({
                'course_name': course['Course Name'],
                'provider': course['Provider'],
                'skills_gained': course['Skills Gained'],
                'rating': float(course['Rating Score']) if pd.notna(course['Rating Score']) else None,
                'level_duration': course.get('Level & Duration', 'N/A'),
                'course_url': course['Course Link'],
                'course_image': course.get('Course Image', ''),
                'similarity_score': float(course['Similarity'])
            })

        return results

    def get_course_by_skill(self, skill: str, top_n: int = 5) -> List[Dict]:
        """
        Get courses that teach a specific skill

        Args:
            skill: The skill to search for
            top_n: Number of courses to return

        Returns:
            List of courses teaching that skill
        """
        return self.search_courses(skill, top_n=top_n)
