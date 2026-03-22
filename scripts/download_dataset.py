import kagglehub
import os

def download_plantvillage():
    print("Starting download of PlantVillage dataset...")
    # This downloads the dataset from kaggle
    path = kagglehub.dataset_download("abdallahalidev/plantvillage-dataset")
    print(f"✅ Success! Dataset downloaded to: {path}")
    
    # You can now use this path to train a custom YOLO/PyTorch model!
    
if __name__ == "__main__":
    download_plantvillage()
