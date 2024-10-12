import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

def main():
    data = read_data()
    data = clean_data(data)
    explore_data(data)

def read_data(path="./archive/AmesHousing.csv"):
    data = pd.read_csv(path)
    return data

def clean_data(data):
    # Handle missing values
    for col in data.select_dtypes(include=['number']).columns:
        data[col].fillna(data[col].median(), inplace=True)
    
    for col in data.select_dtypes(include=['object']).columns:
        data[col].fillna(data[col].mode()[0], inplace=True)
    
    # Remove outliers using IQR method
    for col in data.select_dtypes(include=['number']).columns:
        Q1 = data[col].quantile(0.25)
        Q3 = data[col].quantile(0.75)
        IQR = Q3 - Q1
        data = data[~((data[col] < (Q1 - 1.5 * IQR)) | (data[col] > (Q3 + 1.5 * IQR)))]
    
    # Apply log transformation to skewed distributions
    for col in data.select_dtypes(include=['number']).columns:
        if data[col].skew() > 1:
            data[col] = np.log1p(data[col])
    
    return data

def explore_data(data):
    # Identify variable types
    categorical_vars = data.select_dtypes(include=['object']).columns
    numerical_vars = data.select_dtypes(include=['number']).columns
    print("Categorical Variables:", categorical_vars)
    print("Numerical Variables:", numerical_vars)
    
    # Check for missing values
    missing_values = data.isnull().sum()
    print("Missing Values:\n", missing_values[missing_values > 0])

def feature_engineering(data):
    # Create new features
    if 'YearBuilt' in data.columns and 'YearSold' in data.columns:
        data['HouseAge'] = data['YearSold'] - data['YearBuilt']
    
    # Separate features and target if applicable
    # Assuming 'SalePrice' is the target variable
    if 'SalePrice' in data.columns:
        X = data.drop('SalePrice', axis=1)
        y = data['SalePrice']
    else:
        X = data
        y = None
    
    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=['object']).columns
    numerical_cols = X.select_dtypes(include=['number']).columns
    
    # Preprocessing for numerical data
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Preprocessing for categorical data
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # Bundle preprocessing for numerical and categorical data
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_cols),
            ('cat', categorical_transformer, categorical_cols)
        ])
    
    # Apply transformations
    X_preprocessed = preprocessor.fit_transform(X)
    
    # Convert back to DataFrame
    X_preprocessed = pd.DataFrame(X_preprocessed, columns=numerical_cols.tolist() + preprocessor.named_transformers_['cat']['onehot'].get_feature_names_out(categorical_cols).tolist())
    
    if y is not None:
        data = pd.concat([X_preprocessed, y.reset_index(drop=True)], axis=1)
    else:
        data = X_preprocessed
    
    return data

if __name__ == "__main__":
    main()