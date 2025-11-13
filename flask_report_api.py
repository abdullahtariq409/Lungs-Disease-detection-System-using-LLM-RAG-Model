import os
import uuid
import json
import re
from datetime import datetime
import io

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db
from fpdf import FPDF
import requests

# ----------------- Load Environment Variables -----------------
load_dotenv()

# ----------------- Firebase Initialization -----------------
cred = credentials.Certificate('firebase.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://xray-8a239-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# ----------------- OpenRouter Setup -----------------
openrouter_api_key = ""

def generate_disease_report(disease):
    # ...existing code from database.py...
    prompt = (
        f"Act like a medical assistant. Return the response in JSON format only.\n"
        f"Generate a diagnostic report for a patient diagnosed with '{disease}'.\n"
        f"Return this format:\n"
        f"{{\n"
        f"  \"technique\": \"...\",\n"
        f"  \"findings\": \"...\",\n"
        f"  \"impression\": \"...\"\n"
        f"}}"
    )
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost"
    }
    data = {
        "model": "mistralai/mixtral-8x7b-instruct",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()["choices"][0]["message"]["content"]
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return parsed.get("technique", "N/A"), parsed.get("findings", "N/A"), parsed.get("impression", "N/A")
            except json.JSONDecodeError:
                print("⚠️ JSON parse error.")
        return "N/A", "N/A", "N/A"
    else:
        print(f"❌ OpenRouter API failed: {response.status_code}")
        print(response.text)
        return "N/A", "N/A", "N/A"

class MedicalPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'Diagnostic Medical Report', ln=True, align='C')
        self.ln(2)
        self.line(10, 22, 200, 22)
        self.ln(5)
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, 'Report generated automatically', align='C')

app = Flask(__name__)
CORS(app)

@app.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.json
    name = data.get('name')
    address = data.get('address')
    phone = data.get('phone')
    disease = data.get('disease')
    sex = data.get('sex')
    uid = data.get('uid')  # Get UID from request

    if not uid:
        return jsonify({"error": "User not authenticated"}), 401

    # Use /reports/{uid}/ as the path
    user_reports_ref = db.reference(f'reports/{uid}')
    all_reports = user_reports_ref.order_by_child('phone').equal_to(phone).get()

    pdf = MedicalPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=11)

    if all_reports:
        sorted_reports = sorted(all_reports.items(), key=lambda x: x[1].get('timestamp', ''))
        last_report = sorted_reports[-1][1]
        for field in ['name', 'address', 'phone', 'disease', 'sex', 'report_id']:
            pdf.cell(0, 8, f"{field.capitalize()}: {last_report.get(field, '')}", ln=True)
        pdf.ln(4)
        sections = {
            "Technique": last_report.get('technique_description', ''),
            "FINDINGS": last_report.get('findings_description', ''),
            "IMPRESSION": "Findings are suggestive of:\n" + last_report.get('impression_text', '')
        }
        for title, content in sections.items():
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 8, f'{title}:', ln=True)
            pdf.set_font('Arial', '', 11)
            pdf.multi_cell(0, 7, content)
            pdf.ln(2)
    else:
        report_id = str(uuid.uuid4())
        technique_description, findings_description, impression_text = generate_disease_report(disease)
        data_to_save = {
            "name": name,
            "address": address,
            "phone": phone,
            "disease": disease,
            "sex": sex,
            "report_id": report_id,
            "technique_description": technique_description,
            "findings_description": findings_description,
            "impression_text": impression_text,
            "timestamp": datetime.now().isoformat()
        }
        user_reports_ref.push(data_to_save)
        for label, value in [("Name", name), ("Address", address), ("Phone", phone), ("Disease", disease), ("Sex", sex), ("Report ID", report_id)]:
            pdf.cell(0, 8, f"{label}: {value}", ln=True)
        pdf.ln(4)
        sections = {
            "Technique": technique_description,
            "FINDINGS": findings_description,
            "IMPRESSION": "Findings are suggestive of:\n" + impression_text
        }
        for title, content in sections.items():
            pdf.set_font('Arial', 'B', 12)
            pdf.cell(0, 8, f'{title}:', ln=True)
            pdf.set_font('Arial', '', 11)
            pdf.multi_cell(0, 7, content)
            pdf.ln(2)

    # Output PDF to memory and send as response
    pdf_bytes = pdf.output(dest='S').encode('latin1')
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='patient_report.pdf'
    )

if __name__ == '__main__':
    app.run(debug=True, port=5001)
