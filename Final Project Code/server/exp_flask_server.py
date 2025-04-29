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

###########################  WORKS  ###########################

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

###########################  WORKS  ###########################



def clean_data(value):
    # if isinstance(value, str):
    #     # Remove % and other non-numeric characters except for the negative sign and decimal point
    #     cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
    #     try:
    #         # Convert to float first to preserve any decimals
    #         return float(cleaned)
    #     except ValueError:
    #         return None  # Return None if conversion fails
    # elif isinstance(value, (int, float)):  # Handle numeric types that might be directly usable or NaN
    #     return value if not pd.isna(value) else None
    # return None  # Ensure that all other types are converted to None if not specifically handled

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
    # column_name = request.args.get('column', 'GDP per capita')
    
    # if column_name not in data.columns:
    #     return jsonify({'error': 'Column not found'}), 404

    # scatter_plot_data = {
    #     'ladder_score': [],
    #     column_name: [],
    #     'country_name': []
    # }
    
    # try:
    #     for _, row in data.iterrows():
    #         ladder_score = clean_data(row['Ladder score'])
    #         column_value = clean_data(row[column_name])
            
    #         if ladder_score is not None and column_value is not None:  # Check both values are not None
    #             scatter_plot_data['ladder_score'].append(ladder_score)
    #             scatter_plot_data[column_name].append(column_value)
    #             scatter_plot_data['country_name'].append(row['Country name'])

    #     return jsonify(scatter_plot_data)
    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500

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
    # region_group = data.groupby('Region')['Ladder score'].mean().reset_index()
    # result = region_group.to_dict(orient='records')  # Converts DataFrame to list of dicts
    # return jsonify(result)

    # Group by discovery method column and count planets
    # Using 'discoverymethod' as the categorical column in exoplanets data
    method_col = 'discoverymethod'
    if method_col not in data.columns:
        return jsonify({'error': f'Column "{method_col}" not found'}), 404
    pie_df = data.groupby(method_col).size().reset_index(name='count')
    return jsonify(pie_df.to_dict(orient='records'))

###########################  WORKS  ###########################


def clean_data_pcp(value):
    # if isinstance(value, str):
    #     # Remove % and other non-numeric characters except for the negative sign and decimal point
    #     cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
    #     try:
    #         # Convert to float first to preserve any decimals, then to int if needed
    #         return float(cleaned)
    #     except ValueError:
    #         return None  # Return None if conversion fails
    # return value

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


@app.route('/pcp')
def pcp_data():
    # # Manually specify the columns to send
    # cleaned_data = clean_data_pcp(data.copy())
    # categorical_columns = ['Country name', 'Region', 'Income Category']  # List categorical columns
    # mappings = {}
    # for column in categorical_columns:
    #     # pandas factorize returns two objects: an array and an Index of unique labels
    #     cleaned_data[column], labels = pd.factorize(cleaned_data[column])
    #     mappings[column] = dict(enumerate(labels))
    # columns_to_send = ['Country name', 'Ladder score', 'GDP per capita', 'Social support','Healthy life expectancy','Freedom to make life choices',
    #                    'Generosity','Perceptions of corruption', 'Region', 'Income Category']
    # filtered_data = cleaned_data[columns_to_send]

    # return jsonify({'data': filtered_data.to_dict(orient='records'), 'mappings': mappings})

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
