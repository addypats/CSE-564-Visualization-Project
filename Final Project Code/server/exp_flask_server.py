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

###########################  WORKS  ###########################

@app.route('/columns', methods=['GET'])
def get_columns():
    # Extract column names from the DataFrame
    column_names = data.columns.tolist()
    return jsonify(column_names)

###########################  WORKS  ###########################

def clean_percentage(value):
    """Convert percentage strings to float numbers."""
    if isinstance(value, str) and '%' in value:
        # Remove the percentage sign and convert to float
        return float(value.replace('%', ''))
    return value


###########################  WORKS  ###########################

@app.route('/getdata', methods=['GET'])
def get_data():
    # column_name = request.args.get('column', 'pl_orbeccen')
    # print("#######################################\n")
    # print(column_name)
    # print("#######################################\n")
    # print(data.columns)
    # print("#######################################\n")

    # if column_name not in data.columns:
    #     return jsonify({'error': 'Column not found'}), 404

    # # Apply cleaning function to the column if it contains percentage signs
    # if data[column_name].dtype == 'object' and '%' in data[column_name].iloc[0]:
    #     data[column_name] = data[column_name].apply(clean_percentage)

    # # Prepare data to be JSON serializable, including only non-NaN entries
    # response_data = data[['Country name', column_name]].dropna().to_dict(orient='records')
    # return jsonify(response_data)

    """Return name + arbitrary column values for exoplanet data"""
    column_name = request.args.get('column', 'pl_orbeccen')

    print("#######################################\n")
    print(column_name)
    print("#######################################\n")
    print(data.columns)
    print("#######################################\n")

    # app.logger.debug(f"Requested column: {column_name}")
    # app.logger.debug(f"Available columns: {data.columns.tolist()}")

    if column_name not in data.columns:
        return jsonify({'error': 'Column not found'}), 404

    series = data[column_name]
    # Clean percentage strings if present
    if series.dtype == object and series.str.contains('%').any():
        series = series.apply(clean_percentage)

    payload = (
        data[['pl_name', column_name]]
        .dropna()
        .to_dict(orient='records')
    )
    return jsonify(payload)


###########################  WORKS  ###########################

# Configure logging
# logging.basicConfig(level=logging.DEBUG)  # Set the logging level to DEBUG


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



@app.route('/planet-info', methods=['GET'])
def get_planet_info():
    # selected_countries_str = request.args.get('countries', '')

    # # Split the selected countries by comma
    # selected_countries = [country.strip().lower() for country in selected_countries_str.split(',') if country.strip()]

    # logging.debug(f"Selected countries: {selected_countries}")

    # # Convert all country names in the dataset to lowercase for case-insensitive comparison
    # valid_countries = set(data['Country name'].str.strip().str.lower())

    # # Convert all country names in the dataset to lowercase for case-insensitive comparison
    # invalid_countries = [country for country in selected_countries if country.lower() not in valid_countries]

    # if invalid_countries:
    #     error_message = f"Invalid countries: {', '.join(invalid_countries)}"
    #     logging.error(error_message)
    #     return jsonify({"error": error_message}), 400

    # # Extract information for the selected countries
    # result = {}
    # for country in selected_countries:
    #     country_info = data[data['Country name'].str.strip().str.lower() == country.lower()].to_dict(orient='records')[0]
        
    #     # Handle NaN values in country_info
    #     country_info = {k: v if not isinstance(v, float) or not np.isnan(v) else None for k, v in country_info.items()}
        
    #     result[country] = country_info

    # return jsonify(result)

    # Build a mapping from planet name to full record
    records = data.to_dict(orient='records')
    result = {}
    for rec in records:
        name = rec.get('pl_name')
        if name:
            # Replace NaN with None for JSON compatibility
            clean_rec = {k: (None if (isinstance(v, float) and np.isnan(v)) else v)
                         for k, v in rec.items()}
            result[name] = clean_rec
    return jsonify(result)




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
    app.run(host='0.0.0.0', port=5001, debug=True)
