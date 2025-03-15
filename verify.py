import pickle
import numpy as np

# Load the preprocessed data
with open("preprocessed_data.pkl", "rb") as file:
    X_train, X_test, y_train, y_test, label_map = pickle.load(file)  # Unpack correctly

# Verify shapes of the data
print("X_train shape:", X_train.shape)  # Should be (num_samples, 128, 128, 1)
print("X_test shape:", X_test.shape)    # Should be (num_samples, 128, 128, 1)
print("y_train shape:", y_train.shape)  # Should be (num_samples,)
print("y_test shape:", y_test.shape)    # Should be (num_samples,)

# Print label map
print("Label Map:", label_map)

# Check if the data is in the correct range
print("Max value in X_train:", np.max(X_train))
print("Min value in X_train:", np.min(X_train))