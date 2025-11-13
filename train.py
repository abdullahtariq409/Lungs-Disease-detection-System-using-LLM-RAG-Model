import tensorflow as tf
import os
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tkinter import filedialog
from tkinter import Tk

# Suppress the root Tkinter window
root = Tk()
root.withdraw()

# Paths to the dataset
base_path = r"E:\chest_xray"
train_path = os.path.join(base_path, "train")
val_path = os.path.join(base_path, "val")
test_path = os.path.join(base_path, "test")

# Load datasets
train_dataset = tf.keras.utils.image_dataset_from_directory(
    train_path,
    labels="inferred",
    label_mode="int",
    batch_size=32,
    image_size=(150, 150),
    seed=123
)

val_dataset = tf.keras.utils.image_dataset_from_directory(
    val_path,
    labels="inferred",
    label_mode="int",
    batch_size=32,
    image_size=(150, 150),
    seed=123
)

test_dataset = tf.keras.utils.image_dataset_from_directory(
    test_path,
    labels="inferred",
    label_mode="int",
    batch_size=32,
    image_size=(150, 150),
    seed=123
)

# Normalize pixel values
def normalize_data(image, label):
    image = tf.cast(image, tf.float32) / 255.0  # Normalize to [0, 1]
    return image, label

train_dataset = train_dataset.map(normalize_data)
val_dataset = val_dataset.map(normalize_data)
test_dataset = test_dataset.map(normalize_data)

# Define the CNN model
model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(1, activation='sigmoid')  # Binary classification
])

# Compile the model
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Train the model
history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=10
)

# Save the trained model to the specified folder
model_save_path = os.path.join(base_path, "trained_model")
os.makedirs(model_save_path, exist_ok=True)
model_file = os.path.join(model_save_path, "lung_cancer_detection_model.h5")
model.save(model_file)
print(f"\nModel has been saved to: {model_file}")

# Evaluate the model
test_loss, test_accuracy = model.evaluate(test_dataset)
print(f"\nTest Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy * 100:.2f}%")

# Let the user choose an input image
file_path = filedialog.askopenfilename(title="Select an Image")
if file_path:
    print(f"Selected file: {file_path}")

    # Load and preprocess the image
    input_image = load_img(file_path, target_size=(150, 150))
    input_array = img_to_array(input_image) / 255.0
    input_array = np.expand_dims(input_array, axis=0)  # Add batch dimension

    # Predict the class
    prediction = model.predict(input_array)
    class_label = "PNEUMONIA" if prediction[0][0] > 0.5 else "NORMAL"
    print(f"The predicted class is: {class_label}")

    # Visualize the input image
    plt.imshow(input_image)
    plt.title(f"Predicted: {class_label}")
    plt.axis("off")
    plt.show()

    # Confusion Matrix for User Input
    true_labels = [1] if "PNEUMONIA" in file_path.upper() else [0]  # Assuming filenames have class info
    predicted_labels = [1 if prediction[0][0] > 0.5 else 0]

    cm = confusion_matrix(true_labels, predicted_labels)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["NORMAL", "PNEUMONIA"], yticklabels=["NORMAL", "PNEUMONIA"])
    plt.xlabel("Predicted Labels")
    plt.ylabel("True Labels")
    plt.title("Confusion Matrix for Input")
    plt.show()

    # Classification Report for User Input
    print("\nClassification Report:")
    print(classification_report(true_labels, predicted_labels, target_names=["NORMAL", "PNEUMONIA"]))
