# DuitAI - Smart Financial Tracker 💸

DuitAI is a modern, intelligent financial tracking application powered by **Google Gemini AI**. It allows you to record transactions simply by chatting, making expense tracking as easy as sending a message.

![DuitAI Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

- **🗣️ AI-Powered Entry**: Just type "Makan siang 50rb pake dompet utama" and let AI handle the rest.
- **👛 Multi-Wallet**: Manage multiple sources of funds (Cash, Bank, E-Wallet).
- **📊 Interactive Charts**: Visual reports of your income and expenses.
- **💰 Budgeting**: Set monthly limits for specific categories.
- **🔒 Privacy First**: All data is stored locally in your browser (LocalStorage).
- **🐳 Docker Support**: Ready for containerized deployment.
- **📱 Responsive Design**: Works beautifully on mobile and desktop.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Icons**: Heroicons

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Google Gemini API Key ([Get it here](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/duitai.git
    cd duitai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    Create a `.env.local` file in the root directory:
    ```env
    gemini_api_key=YOUR_API_KEY_HERE
    ```
    *Alternatively, you can skip this and configure the API Key directly in the app Settings.*

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

You can run DuitAI as a lightweight Docker container.

### Build and Run

1.  **Build the image**
    ```bash
    docker build -t duitai-app .
    ```

2.  **Run the container**
    ```bash
    docker run -p 8080:80 duitai-app
    ```

3.  Access at [http://localhost:8080](http://localhost:8080).

## 💾 Backup & Restore

Since data is stored locally, it's important to backup your data if you clear your browser cache or switch devices.

1.  Go to **Settings**.
2.  Click **Backup (Ekspor JSON)** to download your data.
3.  On a new device, click **Restore (Impor JSON)** and select your backup file.

## 📝 License

MIT License. Free to use and modify.
# Duit-AI
