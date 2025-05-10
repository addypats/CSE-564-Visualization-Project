import csv
import os
from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import numpy as np
import logging
import json

from sklearn.discriminant_analysis import StandardScaler
from sklearn.cluster import DBSCAN


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
    # Extract x and y axis column names from query parameters
    x_column = request.args.get('x', 'pl_orbeccen')  # Default: pl_orbeccen
    y_column = request.args.get('y', 'pl_rade')      # Default: pl_rade

    # Check if both columns exist in the dataset
    if x_column not in data.columns or y_column not in data.columns:
        return jsonify({'error': 'One or both columns not found'}), 404

    scatter_plot_data = {
        x_column: [],
        y_column: [],
        'pl_name': []
    }

    # Collect non-null data for both columns
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


@app.route('/data/dbscanChart/<string:filterByObservatoryName>')
def dbscan_chart_data(filterByObservatoryName):
    chart_data = []    
    distances = []
    earth = {
        "st_met": 0.012,
        "pl_orbper": 365.256363,
        "pl_orbeccen": 0.0167,
        "pl_bmasse": 1,
        "pl_insol": 1
    }

    with open('data_exo.csv', mode='r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            try:
                if filterByObservatoryName != 'undefined' and row['disc_facility'] != filterByObservatoryName:
                    continue
                
                pl_name = row['pl_name'] if row['pl_name'] else None
                st_met = row['st_met'] if row['st_met'] else None
                pl_orbper = float(row['pl_orbper']) if row['pl_orbper'] else None
                pl_orbeccen = float(row['pl_orbeccen']) if row['pl_orbeccen'] else None
                pl_bmasse = float(row['pl_bmasse']) if row['pl_bmasse'] else None
                pl_insol = float(row['pl_insol']) if row['pl_insol'] else None

                if pl_name is not None and st_met is not None and pl_orbper is not None and pl_orbeccen is not None and pl_bmasse is not None and pl_insol is not None:
                    dataPoint = {
                        "pl_name": pl_name,
                        "st_met": st_met,
                        "pl_orbper": pl_orbper,
                        "pl_orbeccen": pl_orbeccen,
                        "pl_bmasse":pl_bmasse,
                        "pl_insol": pl_insol
                    }
                    distance = calculate_distance(dataPoint, earth)
                    distances.append(distance)
                    chart_data.append(dataPoint)
            except ValueError:
           
                print(f"Skipping row with invalid data: {row}")
    


    # Normalize distances and perform DBSCAN clustering
    scaler = StandardScaler()
    normalized_distances = scaler.fit_transform(np.array(distances).reshape(-1, 1))
    dbscan = DBSCAN(eps=0.3, min_samples=2)
    cluster_labels = dbscan.fit_predict(normalized_distances)

    # Combine data points, distances, and their cluster labels
    for index, data_point in enumerate(chart_data):
        data_point['distance_from_earth'] = distances[index]
        data_point['cluster'] = int(cluster_labels[index])

    return chart_data

def calculate_distance(planet, earth):
    return np.sqrt(
        (float(planet['st_met']) - earth['st_met']) ** 2 +
        (planet['pl_orbper'] - earth['pl_orbper']) ** 2 +
        (planet['pl_orbeccen'] - earth['pl_orbeccen']) ** 2 +
        (planet['pl_bmasse'] - earth['pl_bmasse']) ** 2 +
        (planet['pl_insol'] - earth['pl_insol']) ** 2
    )

@app.route('/data/bubbleChart/<string:filterByObservatoryName>')
def bubble_chart_data(filterByObservatoryName):
    bubble_chart_data = []
    with open('data_exo.csv', mode='r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            try:
                if filterByObservatoryName != 'undefined' and row['disc_facility'] != filterByObservatoryName:
                    continue

                pl_name = row['pl_name'] if row['pl_name'] else None
                pl_bmasse = float(row['pl_bmasse']) if row['pl_bmasse'] else None
                sy_dist = float(row['sy_dist']) if row['sy_dist'] else None
                pl_rade = float(row['pl_rade']) if row['pl_rade'] else None

                if pl_name is not None and pl_bmasse is not None and sy_dist is not None and pl_rade is not None:
                    dataPoint = {
                        "pl_name": pl_name,
                        "pl_bmasse": pl_bmasse,
                        "sy_dist": sy_dist,
                        "pl_rade":pl_rade
                    }
                    bubble_chart_data.append(dataPoint)
            except ValueError:
                print(f"Skipping row with invalid data: {row}")
    return bubble_chart_data



# --------------------
# Main Entrypoint
# --------------------
if __name__ == '__main__':
    # For production, disable debug and consider a WSGI server
    app.run(host='0.0.0.0', port=5001, debug=True)

###########################  WORKS  ###########################