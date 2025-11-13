import os
import uuid
import json
import re
from datetime import datetime
import requests

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db
from fpdf import FPDF

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
    prompt = (
     f"Act as a medical assistant. Return the response in JSON format only.\n"
    f"Generate a detailed diagnostic report for a patient diagnosed with '{disease}'.\n"
    f"For each section (technique, findings, impression), provide thorough and informative content, "
    f"with multiple sentences and relevant details, but keep the overall report concise enough to fit on a single A4 page.\n"
    f"Do not include unnecessary repetition or filler. Be clear and professional.\n"
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

# ----------------- User Input -----------------
name = input("Enter your name: ")
address = input("Enter your address: ")
phone = input("Enter your phone number: ")
disease = input("Enter disease: ")
sex = input("Enter your sex (M/F): ")

ref = db.reference('reports')
all_reports = ref.order_by_child('phone').equal_to(phone).get()

# ----------------- PDF Generator -----------------
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

pdf = MedicalPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.set_font("Arial", size=11)

# ----------------- Existing or New Report -----------------
if all_reports:
    sorted_reports = sorted(all_reports.items(), key=lambda x: x[1].get('timestamp', ''))
    last_report = sorted_reports[-1][1]
    print("\n📁 Existing report found. Generating PDF...")

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
    print("\n📄 No existing report found. Generating new one...")
    report_id = str(uuid.uuid4())
    technique_description, findings_description, impression_text = generate_disease_report(disease)

    data = {
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
    ref.push(data)
    print(f"✅ Report saved to Firebase with ID: {report_id}")

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

    print("\n--- 🧾 Chat-style Diagnostic Summary ---")
    print(f"\n🩺 Disease: {disease}")
    print(f"\n📘 Technique:\n{technique_description}")
    print(f"\n🧪 Findings:\n{findings_description}")
    print(f"\n🩻 Impression:\n{impression_text}")

# ----------------- Save PDF -----------------
if input("\nDo you want to download your report as PDF? (yes/no): ").lower() == 'yes':
    pdf.output('patient_report.pdf')
    print("\n✅ PDF generated successfully! (Saved as 'patient_report.pdf')")
else:
    print("\n📌 PDF not downloaded. Process finished.")
