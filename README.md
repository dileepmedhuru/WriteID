# WriteID — AI Handwriting Intelligence Platform

> Forensic-grade handwriting verification powered by Siamese Neural Networks, OpenCV, and Flask.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Siamese Neural Network** | MobileNetV2-based deep learning writer identification |
| 🔍 **Forgery Detection** | Classifies as Genuine / Forged / Traced with confidence score |
| 📊 **Detailed Report** | Stroke similarity, neural embedding, slant & spacing metrics |
| ✍️ **Signature Verification** | Dedicated signature authentication module |
| 📷 **Camera Capture** | WebRTC mobile camera with auto-crop document scanner |
| 🖼️ **Smart Enhancement** | Bilateral filter, CLAHE, auto-deskew preprocessing pipeline |
| 🌐 **Multi-language** | Supports English and regional scripts |
| 📄 **PDF Export** | Download full forensic report as a styled PDF |

---

## 🛠️ Tech Stack

**Backend**
- Python 3.11, Flask 3.x
- TensorFlow (CPU) + Keras — Siamese MobileNetV2
- OpenCV Headless — image preprocessing
- SQLite — user authentication
- Gunicorn — production WSGI server

**Frontend**
- Vanilla HTML / CSS / JavaScript
- Bootstrap Icons
- jsPDF — client-side PDF generation
- WebRTC — mobile camera capture

---

## 📂 Project Structure

```
WriteID/
├── app.py                  # Flask API server
├── handwriting_match.py    # Hybrid AI matching engine
├── preprocess.py           # Image enhancement pipeline
├── requirements.txt        # Python dependencies
├── Procfile                # Render/Gunicorn startup
├── render.yaml             # Render.com deployment config
├── frontend/
│   ├── index.html          # Landing page
│   ├── home.html           # Dashboard
│   ├── upload.html         # Handwriting comparison
│   ├── signature.html      # Signature verification
│   ├── login.html          # Authentication
│   ├── signup.html         # Registration
│   ├── profile.html        # User profile
│   ├── style.css           # Premium dark UI stylesheet
│   └── script.js           # Frontend logic + PDF generator
└── backend/
    └── uploads/            # Temp image storage
```

---

## 🚀 Local Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/WriteID.git
cd WriteID

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run server
python app.py

# 5. Open in browser
# http://localhost:5000
```

---

## ☁️ Deploy to Render.com

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**
5. Wait ~5 mins for TensorFlow to install
6. Your app is live at `https://writeid.onrender.com` 🎉

> **Note:** First request after a cold start may take ~30s while TensorFlow loads the model.

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/login` | User login |
| `POST` | `/signup` | User registration |
| `POST` | `/process-handwriting` | Run handwriting/signature analysis |

---

## 👤 Author

**Dileep Medhuru** — medhurudileep@gmail.com
