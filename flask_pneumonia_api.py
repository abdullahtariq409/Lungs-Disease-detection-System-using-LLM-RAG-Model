from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from flask_cors import CORS
import io
import traceback
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = r"E:\chest_xray\Lung Disease Dataset\trained_model\lung_disease_model1.h5"
TRAIN_DIR = r"E:\chest_xray\Lung Disease Dataset\train"
TEST_DIR = r"E:\chest_xray\Lung Disease Dataset\test"

# Add: Load class names from the dataset directory
def get_class_names_from_dir(data_dir):
    # Only include directories (class folders)
    return sorted([
        d for d in os.listdir(data_dir)
        if os.path.isdir(os.path.join(data_dir, d))
    ])

# Update CLASS_NAMES to be loaded from the train directory
CLASS_NAMES = get_class_names_from_dir(TRAIN_DIR)

model = tf.keras.models.load_model(MODEL_PATH)

# Evaluate model on test set at startup and store test accuracy
def get_test_accuracy(model, test_dir):
    test_dataset = tf.keras.utils.image_dataset_from_directory(
        test_dir, labels="inferred", label_mode="int", batch_size=32,
        image_size=(150, 150), shuffle=False
    )
    test_dataset = test_dataset.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y))
    loss, acc = model.evaluate(test_dataset, verbose=0)
    return float(acc)

test_accuracy = get_test_accuracy(model, TEST_DIR)

def prepare_image(file, target_size=(150, 150)):
    # Read file bytes and wrap in BytesIO for load_img
    img_bytes = file.read()
    img = load_img(io.BytesIO(img_bytes), target_size=target_size)
    img_array = img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        img_array = prepare_image(file)
        prediction = model.predict(img_array)
        print("Model prediction output:", prediction)  # Debug print
        predicted_class = int(np.argmax(prediction[0]))
        print("Predicted class index:", predicted_class)  # Debug print
        confidence = float(np.max(prediction[0]) * 100)
        if predicted_class < 0 or predicted_class >= len(CLASS_NAMES):
            return jsonify({
                'error': f'Predicted class index {predicted_class} out of range for CLASS_NAMES',
                'prediction': prediction.tolist(),
                'predicted_class': predicted_class
            }), 500
        class_label = CLASS_NAMES[predicted_class]
        # Prepare all disease predictions with confidence
        disease_confidences = [
            {'disease': CLASS_NAMES[i], 'confidence': float(prediction[0][i]) * 100}
            for i in range(len(CLASS_NAMES))
        ]
        return jsonify({
            'predicted_class': class_label,
            'confidence': confidence,
            'disease_confidences': disease_confidences
        })
    except Exception as e:
        print("Error in /predict:", e)
        traceback.print_exc()  # Print full stack trace to server log
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    return jsonify({
        'class_names': CLASS_NAMES,
        'test_accuracy': test_accuracy
    })

if __name__ == '__main__':
    app.run(debug=True)