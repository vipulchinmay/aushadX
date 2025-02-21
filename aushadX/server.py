from flask import Flask, request, jsonify
import easyocr
import base64
from langchain_ollama import OllamaLLM
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Initialize OCR Model Once
reader = easyocr.Reader(['en'])

# Initialize AI Model
model = OllamaLLM(model="seekhan")

# Server code
@app.route('/scan', methods=['POST'])
def scan_medicine():
    try:
        print("✅ Image received. Starting the OCR processing...")

        data = request.json
        if not data or "image" not in data:
            print("❌ No image received.")
            return jsonify({"error": "No image received"}), 400

        base64_str = data["image"]
        print("✅ Received Image Base64 Length:", len(base64_str))

        # Convert Base64 to Image
        image_bytes = base64.b64decode(base64_str)
        image = Image.open(BytesIO(image_bytes))

        # OCR Processing
        print("🔍 Starting OCR...")
        ocr_result = reader.readtext(image, detail=0)
        extracted_text = " ".join(ocr_result)
        print("🔍 OCR Extracted Text:", extracted_text)

        if not extracted_text:
            print("❌ No text found in the image.")
            return jsonify({"error": "No text found in the image"}), 400

        # AI Processing with Seekhan
        print("🤖 Sending extracted text to AI model for processing...")
        prompt = f"""{extracted_text}
        The above is the extracted data from a medicine. From this information, I want you to take the correct information and Tell things like the
        medicine name, and also provide a 2 line description about the medicine. Also provide the manufacturing date(Which is usually labeled as MFD) and the Expiry Date (which is usually labeled as EXP)
        from the Extracted text.
        """
        response = model.invoke(input=prompt)
        print("🤖 AI Response:", response)

        if response:
            return jsonify({"raw_response": response.strip()}), 200
        else:
            print("❌ AI model failed to extract valid details.")
            return jsonify({"error": "AI model failed to extract valid details"}), 500

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": str(e)}), 500

def scan_medicine():
    try:
        print("✅ Image received. Starting the OCR processing...")

        # Get Image from Request
        data = request.json
        if not data or "image" not in data:
            print("❌ No image received.")
            return jsonify({"error": "No image received"}), 400

        base64_str = data["image"]
        print("✅ Received Image Base64 Length:", len(base64_str))

        # Convert Base64 to Image
        image_bytes = base64.b64decode(base64_str)
        image = Image.open(BytesIO(image_bytes))

        # OCR Processing
        print("🔍 Starting OCR...")
        ocr_result = reader.readtext(image, detail=0)
        extracted_text = " ".join(ocr_result)
        print("🔍 OCR Extracted Text:", extracted_text)

        if not extracted_text:
            print("❌ No text found in the image.")
            return jsonify({"error": "No text found in the image"}), 400

        # AI Processing with Seekhan (Updated prompt format)
        print("🤖 Sending extracted text to AI model for processing...")
        prompt = f"""{extracted_text}
        The above is the extracted data from a medicine. From this information, I want you to take the correct information and Tell things like the
        medicine name, and also provide a 2 line description about the medicine. Also provide the manufacturing date(Which is usually labeled as MFD) and the Expiry Date (which is usually labeled as EXP)
        from the Extracted text. 
        """

        response = model.invoke(input=prompt)
        print("🤖 AI Response:", response)

        # Directly return AI Response without regex parsing
        if response:
            return jsonify({"raw_response": response.strip()}), 200
        else:
            print("❌ AI model failed to extract valid details.")
            return jsonify({"error": "AI model failed to extract valid details"}), 500

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)