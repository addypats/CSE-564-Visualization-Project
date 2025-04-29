from flask import Flask, json, jsonify, render_template
import csv
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import pandas as pd


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('dashboard.html')


@app.route('/data/map')
def map_data():
    # Assume you have a function to get your GeoJSON data
    worldData = get_geojson_data()
    observatoryLocationData = get_observatory_location_data()
    data = merge_features(worldData,[observatoryLocationData])
    return jsonify(data)

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

    with open('static/csv/data.csv', mode='r', encoding='utf-8') as file:
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
    with open('static/csv/data.csv', mode='r', encoding='utf-8') as file:
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

@app.route('/data/parallelCoordinatesPlot/<string:filterByObservatoryName>')
def parallel_coordinates_plot_data(filterByObservatoryName):
    parallel_coordinates_plot_data = []
    with open('static/csv/data.csv', mode='r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            try:

                if filterByObservatoryName != 'undefined' and row['disc_facility'] != filterByObservatoryName:
                    continue

                hostname = row['pl_name'] if row['hostname'] else None
                st_met = row['st_met'] if row['st_met'] else None
                st_logg = row['st_logg'] if row['st_logg'] else None
                pl_orbeccen = row['pl_orbeccen'] if row['pl_orbeccen'] else None
                pl_orbsmax = row['pl_orbsmax'] if row['pl_orbsmax'] else None
                pl_insol = row['pl_insol'] if row['pl_insol'] else None
                pl_name = row['pl_name'] if row['pl_name'] else None

                if hostname is not None and st_met is not None and st_logg is not None and pl_orbeccen is not None and pl_orbsmax is not None and pl_insol is not None:
                    dataPoint = {
                        "hostname": hostname,
                        "st_logg":st_logg,
                        "pl_orbeccen": pl_orbeccen,
                        "pl_orbsmax": pl_orbsmax,
                        "pl_insol": pl_insol,
                        "st_met": st_met,
                        "pl_name": pl_name                      
                    }
                    parallel_coordinates_plot_data.append(dataPoint)
            except ValueError:
                print(f"Skipping row with invalid data: {row}")
    return parallel_coordinates_plot_data

def merge_features(target_json, source_jsons):
    for json in source_jsons:
        target_json['features'] = target_json['features'] + json['features']
    return target_json

def get_observatory_location_data():
    df = pd.read_csv('static/csv/data.csv')

    geojson_features = []
    with open('static/csv/data.csv', mode='r', encoding='utf-8') as file:
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
    with open('static/json/geo.json', 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    return geojson_data

if __name__ == '__main__':
    app.run(debug=True)
