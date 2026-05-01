import pandas as pd
import os

dataset_path = "dataset.xlsx"
if os.path.exists(dataset_path):
    df = pd.read_excel(dataset_path, nrows=5)
    print("Columns in dataset.xlsx:")
    print(df.columns.tolist())
else:
    print("dataset.xlsx not found in the current directory.")
