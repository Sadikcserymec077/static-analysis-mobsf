# 📱 MobSF Static Analysis UI

A lightweight **React + Node.js proxy UI** for [MobSF (Mobile Security Framework)](https://github.com/MobSF/Mobile-Security-Framework-MobSF).  
The backend securely proxies all API calls to MobSF — your **MobSF API key never touches the frontend**.  
It also **caches JSON/PDF reports** locally for faster access and offline review.

---

## 🚀 Features
- Secure proxy for MobSF API (hides API key)
- Upload & scan APK/IPA files from a simple UI
- View scan progress and logs
- Download or view cached JSON/PDF reports
- Automatically saves reports to `/reports` folder

---

## 📁 Project Structure

mobsf-project/
├─ mobsf-ui-backend/
│ ├─ server.js
│ ├─ package.json
│ ├─ .env.example
│ ├─ reports/ (created automatically)
│ └─ ...
├─ mobsf-frontend/
│ ├─ src/
│ │ ├─ api.js
│ │ ├─ components/
│ │ │ ├─ UploadForm.js
│ │ │ ├─ ScansList.js
│ │ │ ├─ ReportView.js
│ │ └─ App.js
│ ├─ package.json
│ ├─ .env.local.example
│ └─ ...
└─ README.md


---

## 🧩 Prerequisites
Before you start:
- **Node.js 18+** and npm
- **install docker desktop**

- **MobSF** running locally or accessible (default: `http://localhost:8000`)
- (Optional) Git & GitHub for version control

---

## 🖥️  Setup(backend + frontend)
```bash
# 1. Go to backend folder
cd mobsf-ui-backend


# 2. Install dependencies
npm install

# 3. paste mobsf-api-key
install docker desktop
open  terminal and run below commands

docker pull opensecurity/mobile-security-framework-mobsf:latest
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest

# open localhost:8000 
Default username and password: mobsf/mobsf

got to api docs copy apikey and paste in .env file

# 5. Start backend (development mode)
npm run dev

---

## 🖥️ frontend Setup (mobsf-frontend)
```bash
# 1. Go to frontend folder
cd mobsf-frontend


# 2. Install dependencies
npm install

# 3. Start frontend (development mode)
npm start

# 4. Open the app in browser
# URL: http://localhost:3000

---
🔄 How It Works
| Step | Description                                                                  |
| ---- | ---------------------------------------------------------------------------- |
| 1️⃣  | User uploads APK/IPA → `POST /api/upload`                                    |
| 2️⃣  | Backend forwards to MobSF, returns `hash`                                    |
| 3️⃣  | Backend triggers scan → `POST /api/scan`                                     |
| 4️⃣  | Frontend polls `POST /api/scan_logs` for progress                            |
| 5️⃣  | When complete, backend fetches reports (JSON/PDF) and saves under `/reports` |

mobsf-ui-backend/reports/
├─ json/<hash>.json
└─ pdf/<hash>.pdf

🔗 Key Endpoints
| Method   | Endpoint                             | Description                       |
| -------- | ------------------------------------ | --------------------------------- |
| **POST** | `/api/upload`                        | Upload file (multipart/form-data) |
| **POST** | `/api/scan`                          | Start scan `{ hash }`             |
| **POST** | `/api/scan_logs`                     | Get scan progress logs            |
| **GET**  | `/api/report_json/save?hash=<hash>`  | Fetch & cache JSON report         |
| **GET**  | `/reports/json/<hash>`               | Access cached JSON report         |
| **GET**  | `/api/download_pdf/save?hash=<hash>` | Fetch & cache PDF                 |
| **GET**  | `/reports/pdf/<hash>`                | Access cached PDF report          |
| **GET**  | `/api/reports`                       | List cached reports               |

🧰 Troubleshooting

| Problem                | Solution                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `401 Unauthorized`     | Check `MOBSF_API_KEY` and restart backend                                          |
| `404 Report not Found` | Wait for MobSF to finish analysis — keep polling `/api/scan_logs`                  |
| Report too large       | Use `/api/report_json/save?hash=<hash>` to save locally and open the JSON manually |

🧾 Example Workflow

# Upload APK and start scan
curl -F "file=@/path/to/app.apk" http://localhost:4000/api/upload

# Poll logs until "Generating Report" or "Completed"
curl -X POST http://localhost:4000/api/scan_logs -d "hash=<hash>"

# Save JSON report
curl "http://localhost:4000/api/report_json/save?hash=<hash>"

# Download PDF report
curl "http://localhost:4000/api/download_pdf/save?hash=<hash>"

🧠 Next Steps

✅ Test full flow (upload → scan → report)

🔒 Add authentication before deploying publicly

🧹 Create scripts/setup-local.sh for one-click environment setup

🚀 Optionally deploy on internal network for team use

🏷️ License

This project is for educational and research purposes.
Always comply with MobSF’s license and your organization’s security policies.

---

