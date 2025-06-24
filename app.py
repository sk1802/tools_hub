from flask import Flask, render_template, jsonify
import json
import os
import pandas as pd
from datetime import datetime, timedelta
import random 

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/team-structure')
def get_team_structure():
    """API endpoint to serve team structure data"""
    try:
        with open('static/data/team_structure.json', 'r') as f:
            team_data = json.load(f)
        return jsonify(team_data)
    except FileNotFoundError:
        # Return sample data if file doesn't exist
        sample_data = {
            "name": "PCIe Tools Team",
            "role": "Team Lead",
            "avatar": "https://via.placeholder.com/60/4f46e5/ffffff?text=TL",
            "children": [
                {
                    "name": "Senior Developer 1",
                    "role": "Senior Engineer",
                    "avatar": "https://via.placeholder.com/60/059669/ffffff?text=SD1",
                    "children": [
                        {
                            "name": "Developer A",
                            "role": "Software Engineer",
                            "avatar": "https://via.placeholder.com/60/dc2626/ffffff?text=DA"
                        },
                        {
                            "name": "Developer B",
                            "role": "Software Engineer",
                            "avatar": "https://via.placeholder.com/60/ea580c/ffffff?text=DB"
                        }
                    ]
                },
                {
                    "name": "Senior Developer 2",
                    "role": "Senior Engineer",
                    "avatar": "https://via.placeholder.com/60/7c3aed/ffffff?text=SD2",
                    "children": [
                        {
                            "name": "Developer C",
                            "role": "Software Engineer",
                            "avatar": "https://via.placeholder.com/60/0891b2/ffffff?text=DC"
                        }
                    ]
                }
            ]
        }
        return jsonify(sample_data)

# Sample CR Database data - replace with your actual data source
def generate_sample_data():
    """Generate sample CR database data"""
    statuses = ['Open', 'Closed', 'In Review', 'Merged', 'Abandoned']
    priorities = ['High', 'Medium', 'Low', 'Critical']
    components = ['PCIe Core', 'Driver', 'Firmware', 'Documentation', 'Testing']
    reviewers = ['john.doe', 'jane.smith', 'mike.johnson', 'sarah.wilson', 'alex.brown']
    authors = ['sk1802', 'dev1', 'dev2', 'dev3', 'dev4', 'dev5']
    
    data = []
    for i in range(100):
        created_date = datetime.now() - timedelta(days=random.randint(1, 365))
        updated_date = created_date + timedelta(days=random.randint(0, 30))
        
        data.append({
            'id': f'CR-{1000 + i}',
            'title': f'PCIe Enhancement #{i+1}',
            'author': random.choice(authors),
            'reviewer': random.choice(reviewers),
            'status': random.choice(statuses),
            'priority': random.choice(priorities),
            'component': random.choice(components),
            'created_date': created_date.strftime('%Y-%m-%d'),
            'updated_date': updated_date.strftime('%Y-%m-%d'),
            'lines_added': random.randint(5, 500),
            'lines_removed': random.randint(0, 200),
            'comments': random.randint(0, 25),
            'score': random.randint(-2, 2),
            'branch': random.choice(['main', 'develop', 'feature/pcie-v4', 'hotfix/critical']),
            'description': f'This is a sample CR description for enhancement #{i+1}. It includes various PCIe related improvements and fixes.'
        })
    
    return data

@app.route('/tools/cr-database')
def cr_database():
    return render_template('cr_database.html')

@app.route('/api/cr-data')
def get_cr_data():
    """API endpoint to get CR database data"""
    try:
        # In production, load from your actual database
        data = generate_sample_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
data = generate_sample_data()
df = pd.DataFrame(data)
def get_monthly_trend(df):
    """Calculate monthly CR trend"""
    df['created_date'] = pd.to_datetime(df['created_date'])
    monthly_counts = df.groupby(df['created_date'].dt.to_period('M')).size()
    return {str(period): count for period, count in monthly_counts.items()}

analytics = {
            'status_distribution': df['status'].value_counts().to_dict(),
            'priority_distribution': df['priority'].value_counts().to_dict(),
            'component_distribution': df['component'].value_counts().to_dict(),
            'author_distribution': df['author'].value_counts().to_dict(),
            'monthly_trend': get_monthly_trend(df),
            'lines_stats': {
                'total_added': int(df['lines_added'].sum()),
                'total_removed': int(df['lines_removed'].sum()),
                'avg_added': int(df['lines_added'].mean()),
                'avg_removed': int(df['lines_removed'].mean())
            }
        }
@app.route('/api/cr-analytics')
def get_cr_analytics():
    """API endpoint to get analytics data for charts"""
    try:
        return jsonify(analytics)
    except Exception as e:
        print(f"Error generating analytics: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    app.run(debug=True)