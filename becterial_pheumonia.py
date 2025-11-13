import tensorflow as tf
import os
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tkinter import filedialog, Tk
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pandas as pd
# ------------------ ✅ Paths ------------------ #
base_path = r"E:\chest_xray\Lung Disease Dataset"
train_path = os.path.join(base_path, "train")
val_path = os.path.join(base_path, "val")
test_path = os.path.join(base_path, "test")
model_save_path = os.path.join(base_path, "trained_model")
model_file = os.path.join(model_save_path, "lung_disease_model1.h5")

# ------------------ ✅ Load Datasets ------------------ #
if not os.path.exists(train_path):
    raise FileNotFoundError(f"❌ Directory not found: {train_path}")

train_dataset_raw = tf.keras.utils.image_dataset_from_directory(
    train_path, labels="inferred", label_mode="int", batch_size=32,
    image_size=(150, 150), seed=123
)
class_names = train_dataset_raw.class_names
num_classes = len(class_names)
print(f"\n✅ Found Classes: {class_names}")

def normalize_data(image, label):
    return tf.cast(image, tf.float32) / 255.0, label

# ------------------ ✅ Load or Train Model ------------------ #
if os.path.exists(model_file):
    print(f"\n✅ Found trained model at: {model_file}")
    model = tf.keras.models.load_model(model_file)

    test_dataset_raw = tf.keras.utils.image_dataset_from_directory(
        test_path, labels="inferred", label_mode="int", batch_size=32,
        image_size=(150, 150), seed=123
    )
    test_dataset = test_dataset_raw.map(normalize_data)
    test_loss, test_accuracy = model.evaluate(test_dataset)
    print(f"\n✅ Loaded model evaluation:")
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")

else:
    print("\n⚙️ No trained model found. Starting training...")

    val_dataset_raw = tf.keras.utils.image_dataset_from_directory(
        val_path, labels="inferred", label_mode="int", batch_size=32,
        image_size=(150, 150), seed=123
    )
    test_dataset_raw = tf.keras.utils.image_dataset_from_directory(
        test_path, labels="inferred", label_mode="int", batch_size=32,
        image_size=(150, 150), seed=123
    )

    train_dataset = train_dataset_raw.map(normalize_data)
    val_dataset = val_dataset_raw.map(normalize_data)
    test_dataset = test_dataset_raw.map(normalize_data)

    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(256, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    lr_scheduler = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)

    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=50,
        callbacks=[early_stop, lr_scheduler]
    )

    os.makedirs(model_save_path, exist_ok=True)
    model.save(model_file)
    print(f"\n✅ Model has been saved to: {model_file}")
    test_loss, test_accuracy = model.evaluate(test_dataset)
    print(f"\nTest Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")

# ------------------ ✅ Predict for Single Image ------------------ #
def predict_single_image():
    root = Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title="📂 Select a Chest X-ray Image")

    if not file_path:
        print("❌ No file selected.")
        return

    print(f"\n📂 Selected file: {file_path}")

    input_image = load_img(file_path, target_size=(150, 150))
    input_array = img_to_array(input_image) / 255.0
    input_array = np.expand_dims(input_array, axis=0)

    prediction = model.predict(input_array)
    predicted_class = np.argmax(prediction[0])
    confidence = np.max(prediction[0]) * 100
    class_label = class_names[predicted_class]

    print(f"\n🔹 Predicted Class: {class_label}")
    print(f"🔸 Confidence: {confidence:.2f}%")
    print(f"🔸 Model Overall Test Accuracy: {test_accuracy * 100:.2f}%")

    plt.imshow(input_image)
    plt.title(f"Predicted: {class_label} ({confidence:.2f}%)")
    plt.axis("off")
    plt.show()

# ------------------ ✅ Run Prediction ------------------ #
predict_single_image()