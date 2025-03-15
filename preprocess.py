import os
import cv2
import numpy as np
import pickle
from sklearn.model_selection import train_test_split  # To split the data

# Set dataset path
DATASET_PATH = os.path.abspath("datasets/train")

IMAGE_SIZE = (128, 128)  # Resize images to 128x128

def load_data(data_dir):
    """
    Load images from dataset, preprocess them, and return X (features) and y (labels).
    """
    X = []  # Features (image data)
    y = []  # Labels (person ID)
    label_map = {}  # Mapping of person names to numerical labels
    label_counter = 0

    # Debugging: Check if path exists
    if not os.path.exists(data_dir):
        print(f"❌ Path NOT found: {data_dir}")
        return None, None, None

    print(f"✅ Loading dataset from: {data_dir}")
    
    # Iterate through each person's folder
    for person in os.listdir(data_dir):
        person_path = os.path.join(data_dir, person)
        if os.path.isdir(person_path):  # Ensure it's a folder
            if person not in label_map:
                label_map[person] = label_counter
                label_counter += 1

            # Iterate through images in each person's folder
            for img_name in os.listdir(person_path):
                img_path = os.path.join(person_path, img_name)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)  # Convert to grayscale
                
                if img is None:
                    print(f"⚠ Skipping invalid image: {img_path}")
                    continue
                
                img = cv2.resize(img, IMAGE_SIZE)  # Resize image
                img = img / 255.0  # Normalize pixel values (0 to 1)
                
                X.append(img)
                y.append(label_map[person])

    # Convert to NumPy arrays
    X = np.array(X).reshape(-1, IMAGE_SIZE[0], IMAGE_SIZE[1], 1)  # Reshape for CNN
    y = np.array(y)

    print(f"✅ Loaded {len(X)} images from {len(label_map)} classes.")
    return X, y, label_map

# Load and preprocess dataset
X_train, y_train, label_map = load_data(DATASET_PATH)

# Split data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X_train, y_train, test_size=0.2, random_state=42)

# Print the shapes of the datasets
print("X_train:", X_train.shape)
print("X_test:", X_test.shape)
print("y_train:", y_train.shape)
print("y_test:", y_test.shape)

# Save processed data
if X_train is not None and y_train is not None:
    with open("preprocessed_data.pkl", "wb") as f:
        pickle.dump((X_train, X_test, y_train, y_test, label_map), f)  # Save all data
    print("✅ Preprocessed data saved as 'preprocessed_data.pkl'.")
else:
    print("❌ Data preprocessing failed. Check dataset structure.")