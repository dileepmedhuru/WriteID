import pickle
import keras
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
import numpy as np

# ✅ Step 1: Load Preprocessed Data
with open('preprocessed_data.pkl', 'rb') as file:
    data = pickle.load(file)

# Ensure correct unpacking
if isinstance(data, (tuple, list)) and len(data) == 4:
    X_train, X_test, y_train, y_test = data
    label_map = {i: i for i in np.unique(y_train)}  # Auto-generate label map
elif isinstance(data, (tuple, list)) and len(data) == 5:
    X_train, X_test, y_train, y_test, label_map = data
elif isinstance(data, dict):
    X_train = data['X_train']
    X_test = data['X_test']
    y_train = data['y_train']
    y_test = data['y_test']
    label_map = data.get('label_map', {i: i for i in np.unique(y_train)})
else:
    raise ValueError("Unexpected data format in 'preprocessed_data.pkl'.")

print("✅ Data loaded successfully!")

# ✅ Step 2: Define CNN Model (Using Pure Keras)
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 1)),
    MaxPooling2D((2, 2)),

    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),

    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),

    Flatten(),
    Dense(128, activation='relu'),
    Dense(len(label_map), activation='softmax')  # Output layer (Number of classes)
])

# ✅ Step 3: Compile Model
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# ✅ Step 4: Train Model
model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

# ✅ Step 5: Save Model
model.save('writeid_model.h5')

# ✅ Step 6: Save Label Map for Inference
with open('label_map.pkl', 'wb') as file:
    pickle.dump(label_map, file)

print("✅ Model training completed and saved as 'writeid_model.h5'")