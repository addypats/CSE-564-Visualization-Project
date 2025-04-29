import os
from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import numpy as np
import logging
import json

# Initialize Flask app pointing to React build directory
# app = Flask(
#     __name__,
#     static_folder='frontend/build',
#     template_folder='frontend/build'
# )
# CORS(app)


app = Flask(__name__)
CORS(app)


# --------------------
# Data Loading & Processing
# --------------------

# Load data
data = pd.read_csv('data_exo.csv')



@app.route('/columns', methods=['GET'])
def get_columns():
    # Extract column names from the DataFrame
    column_names = data.columns.tolist()
    return jsonify(column_names)



def clean_percentage(value):
    """Convert percentage strings to float numbers."""
    if isinstance(value, str) and '%' in value:
        # Remove the percentage sign and convert to float
        return float(value.replace('%', ''))
    return value


@app.route('/getdata', methods=['GET'])
def get_data():
    column_name = request.args.get('column', 'GDP per capita')

    if column_name not in data.columns:
        return jsonify({'error': 'Column not found'}), 404

    # Apply cleaning function to the column if it contains percentage signs
    if data[column_name].dtype == 'object' and '%' in data[column_name].iloc[0]:
        data[column_name] = data[column_name].apply(clean_percentage)

    # Prepare data to be JSON serializable, including only non-NaN entries
    response_data = data[['Country name', column_name]].dropna().to_dict(orient='records')
    return jsonify(response_data)


# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Set the logging level to DEBUG


# Clean data
def clean_data(value):
    if isinstance(value, str):
        # Remove % and other non-numeric characters except for the negative sign and decimal point
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            # Convert to float first to preserve any decimals
            return float(cleaned)
        except ValueError:
            return None  # Return None if conversion fails
    elif isinstance(value, (int, float)):  # Handle numeric types that might be directly usable or NaN
        return value if not pd.isna(value) else None
    return None  # Ensure that all other types are converted to None if not specifically handled


def clean_data_pcp(value):
    if isinstance(value, str):
        # Remove % and other non-numeric characters except for the negative sign and decimal point
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            # Convert to float first to preserve any decimals, then to int if needed
            return float(cleaned)
        except ValueError:
            return None  # Return None if conversion fails
    return value



# Example data-shaping: summary statistics by planet type
def get_planet_type_summary():
    summary_df = (
        df.groupby('planet_type')
          .agg(
              count=('planet_name', 'count'),
              mean_radius=('radius', 'mean'),
              mean_mass=('mass', 'mean')
          )
          .reset_index()
    )
    return summary_df.to_dict(orient='records')

def get_planet_details(planet_id):
    rec = df[df['planet_id'] == planet_id]
    if rec.empty:
        return {}
    return rec.to_dict(orient='records')[0]



# --------------------
# API Endpoints for React + D3.js
# --------------------
@app.route('/api/summary', methods=['GET'])
def api_summary():
    """Return aggregated summary for top-level dashboard chart"""
    data = get_planet_type_summary()
    return jsonify(data)

@app.route('/api/details/<int:planet_id>', methods=['GET'])
def api_details(planet_id):
    """Return detailed data for a single planet when user drills down"""
    data = get_planet_details(planet_id)
    return jsonify(data)

@app.route('/api/raw-data', methods=['GET'])
def api_raw_data():
    """Serve the entire raw dataset if needed"""
    return jsonify(df.to_dict(orient='records'))

# # --------------------
# # Serve React Frontend
# # --------------------
# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def serve_react(path):
#     """Serve React build files or index.html for SPA routing"""
#     if path != '' and os.path.exists(os.path.join(app.static_folder, path)):
#         return send_from_directory(app.static_folder, path)
#     return send_from_directory(app.static_folder, 'index.html')

# --------------------
# Main Entrypoint
# --------------------
if __name__ == '__main__':
    # For production, disable debug and consider a WSGI server
    app.run(host='0.0.0.0', port=5000, debug=True)
