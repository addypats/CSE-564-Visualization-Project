import os
from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import numpy as np
import logging
import json
import csv


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

@app.route('/planet-info', methods=['GET'])
def get_planet_info():
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

###########################  WORKS  ###########################



def clean_data(value):
    """Normalize string or numeric inputs to float, handling percentages and NaNs."""
    # Handle string inputs (e.g., "12.3%" or "-45.6")
    if isinstance(value, str):
        # Keep digits, decimal point, and minus sign
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            return float(cleaned)
        except ValueError:
            return None
    # Handle numeric types, converting NaN to None
    if isinstance(value, (int, float)):
        try:
            return None if pd.isna(value) else float(value)
        except Exception:
            return None
    # Fallback for other types
    return None


###########################  WORKS  ###########################




@app.route('/scatter_data')
def scatter_data():
    # Fixed x-axis column
    x_column = 'pl_orbeccen'
    # Dynamic y-axis provided via query, default to 'pl_rade'
    y_column = request.args.get('column', 'pl_rade')

    # Verify columns exist
    if x_column not in data.columns or y_column not in data.columns:
        return jsonify({'error': 'Column not found'}), 404

    scatter_plot_data = {
        x_column: [],
        y_column: [],
        'pl_name': []
    }

    # Iterate and collect non-null pairs
    for _, row in data.iterrows():
        x = row[x_column]
        y = row[y_column]
        if pd.notnull(x) and pd.notnull(y):
            scatter_plot_data[x_column].append(x)
            scatter_plot_data[y_column].append(y)
            scatter_plot_data['pl_name'].append(row['pl_name'])

    return jsonify(scatter_plot_data)

###########################  WORKS  ###########################


@app.route('/pie-chart')
def pie_chart():
    method_col = 'discoverymethod'
    if method_col not in data.columns:
        return jsonify({'error': f'Column "{method_col}" not found'}), 404
    pie_df = data.groupby(method_col).size().reset_index(name='count')
    return jsonify(pie_df.to_dict(orient='records'))

###########################  WORKS  ###########################


def clean_data_pcp(value):
    """Normalize string or numeric inputs for PCP, preserving decimals and negatives."""
    if isinstance(value, str):
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            return float(cleaned)
        except ValueError:
            return None
    if isinstance(value, (int, float)):
        return None if pd.isna(value) else value
    return None

###########################  WORKS  ###########################

@app.route('/pcp')
def pcp_data():
    # Copy and clean numeric fields
    cleaned_df = data.copy()
    numeric_cols = ['pl_orbeccen', 'pl_rade', 'pl_bmasse', 'pl_orbper', 'sy_dist']
    for col in numeric_cols:
        if col in cleaned_df.columns:
            cleaned_df[col] = cleaned_df[col].apply(clean_data_pcp)
    # Define categorical columns and generate mappings
    categorical_columns = ['discoverymethod', 'hostname']
    mappings = {}
    for column in categorical_columns:
        if column in cleaned_df.columns:
            cleaned_df[column], labels = pd.factorize(cleaned_df[column])
            mappings[column] = dict(enumerate(labels))
    # Select relevant columns for PCP
    columns_to_send = [*categorical_columns, *numeric_cols]
    filtered_data = cleaned_df[columns_to_send]
    return jsonify({'data': filtered_data.to_dict(orient='records'), 'mappings': mappings})


###########################  WORKS  ###########################


@app.route('/data/map')
def map_data():
    # Assume you have a function to get your GeoJSON data
    worldData = get_geojson_data()
    observatoryLocationData = get_observatory_location_data()
    data = merge_features(worldData,[observatoryLocationData])
    return jsonify(data)



# map_data helper functions

def merge_features(target_json, source_jsons):
    for json in source_jsons:
        target_json['features'] = target_json['features'] + json['features']
    return target_json

def get_observatory_location_data():
    df = pd.read_csv('data_exo.csv')

    geojson_features = []
    with open('data_exo.csv', mode='r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            try:
                # Convert latitude and longitude to float
                latitude = float(row['lat']) if row['lat'] else None
                longitude = float(row['long']) if row['long'] else None
                
                # Skip rows with missing latitude or longitude
                if latitude is not None and longitude is not None:
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]
                        },
                        "properties": {
                            "name": row['disc_facility']
                        }
                    }
                    geojson_features.append(feature)
            except ValueError:
                print(f"Skipping row with invalid data: {row}")
        
        geojson_features = {
            "type" : "FeatureCollection",
            "features" : geojson_features
        }

        return geojson_features

def get_geojson_data():
    with open('geo.json', 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    return geojson_data



# --------------------
# Main Entrypoint
# --------------------
if __name__ == '__main__':
    # For production, disable debug and consider a WSGI server
    app.run(host='0.0.0.0', port=5001, debug=True)

###########################  WORKS  ###########################