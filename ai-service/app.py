from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import io
import base64

app = Flask(__name__)

# Model Load
try:
    model = YOLO("best.pt")
except:
    from ultralytics import RTDETR
    model = RTDETR("best.pt")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "Online",
        "message": "ScreenSense AI Engine is running perfectly on Hugging Face!"
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        # 1. Image Load
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # 2. Inference
        results = model(img)
        # 3. Annotated Image Generation
        res_plotted = results[0].plot()
        # Convert BGR to RGB
        res_image = Image.fromarray(res_plotted[..., ::-1]) 

        # 4. JSON Data Extraction
        detections = []
        max_conf = 0.0
        status = "Clean"
        defect_type = "None"

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = result.names[cls_id]
                
                if conf > max_conf:
                    max_conf = conf
                
                detections.append({
                    "class": cls_name,
                    "confidence": conf,
                    "bbox": box.xyxy[0].tolist()
                })
        
        if len(detections) > 0:
            status = "Defect Detected"
            defect_type = detections[0]['class']

        # 5. Convert Image to Base64
        buffered = io.BytesIO()
        res_image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            "prediction": status,
            "confidence": max_conf,
            "defect_type": defect_type,
            "annotated_image": img_str,
            "details": detections
        })

    except Exception as e:
        print("CRASH LOG:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)