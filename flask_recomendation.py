from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = ""
MODEL = "mistralai/mixtral-8x7b-instruct"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "HTTP-Referer": "http://localhost",
    "Content-Type": "application/json"
}

questions = [
    "1. What is your age and gender?",
    "2. Do you smoke or have a history of smoking?",
    "3. Have you been exposed to dust, asbestos, or pollutants at work?",
    "4. Are you experiencing shortness of breath?",
    "5. Do you have a persistent cough? If yes, for how long?",
    "6. Have you noticed blood in your sputum?",
    "7. Do you feel chest pain when breathing or coughing?",
    "8. Are you experiencing wheezing or noisy breathing?",
    "9. Have you had any recent weight loss or fatigue?",
    "10. Do you have a history of asthma, COPD, or lung infections?",
    "11. Has anyone in your family had lung cancer or chronic lung disease?",
    "12. Do you live in an area with poor air quality?",
    "13. Have you been exposed to second-hand smoke frequently?",
    "14. Have you done a recent chest X-ray, CT scan, or spirometry test?",
    "15. Are you currently on any medications for respiratory issues?"
]

@app.route('/recommendation', methods=['POST'])
def recommendation():
    data = request.get_json()
    answers = data.get('answers', [])
    if not answers or len(answers) != len(questions):
        return jsonify({"error": "Please provide answers for all questions."}), 400

    user_profile = "\n".join(
        f"{q} {a}" for q, a in zip(questions, answers)
    )

    prompt = f"""
I am a medical assistant AI. The following are answers to lung health questions from a patient.

{user_profile}

Based on this information:
1. Provide DIET recommendations line-by-line (keep diet strong).
2. Provide HEALTH or lifestyle recommendations (e.g. jogging, avoiding pollution).
3. Return a final concise medical-style report using the above data.

Respond in the format, with all headings text bold (e.g.,  Health Recommendations:):
 Diet Recommendations:
- ...
 Health Recommendations:
- ...
 Report:
- ...
"""

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        reply = response.json()["choices"][0]["message"]["content"]
        return jsonify({"recommendation": reply})
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == '__main__':
    app.run(debug=True, port=5002)
