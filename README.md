<h1 align="center" style="color:#FF69B4; font-size: 3em;">
🌸 𝐼𝓀𝑜 𝐶𝒽𝒶𝓉𝒷𝑜𝓉 𝒫𝓇𝑜𝒿𝑒𝒸𝓉 🌸
</h1>


Iko is a sassy, charming AI chatbot. This project demonstrates integrating **Groq AI** with a Spring Boot backend and a React frontend.

---

##  Features

🌸  Conversational AI with attitude

🌸  API key protected with environment variables

🌸  Spring Boot backend + React frontend

🌸  PostgreSQL database support for user accounts

---

##  Prerequisites

Before running the project locally, make sure you have:

- **Java 21** and **Maven** installed
- **Node.js** and **npm** for the frontend
- **PostgreSQL** for database (if you use DB features)
- **TADS Workbench** (if working on TADS extension features)

---

## Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/DBatziou/Iko-AI.git
```

2. **Set your API key as an environment variable**

Open Command Prompt as Admin:
```
setx GROQ_API_KEY "YOUR_API_KEY_HERE"
```

3. **Spring Boot backend**
```
cd ./spring-api
mvn clean install
mvn spring-boot:run
```

4. **Frontend**
```
cd ./frontend
npm install
npm run dev
```

5. **Database migrations (if using PostgreSQL)**

Ensure your database exists and complete your credentials in **application.properties**

Run migrations or schema setup as needed

# How to Use

Open the frontend in your browser (http://localhost:3000 by default).

Choose *Sign In* or *Sign Up*.

Chat with Iko and enjoy her sass and charm.

# Security Notes

🌸 Do not commit API keys in the repository.

🌸 Keep your .env file or environment variables local.

🌸 Consider regenerating API keys if exposed publicly.

# Tech Stack

🌸 Backend: Spring Boot, Java 21, Maven

🌸 Frontend: React, HTML/CSS/JS

🌸 Database: PostgreSQL

🌸 AI: Groq API

# Screens

While using Iko you'll get to see the following pages.

##  🦋Login/Sign up Page
<br>
Here, you can use your credentials to log in to your account, or you can create a new account.
<br>
<br>
<img width="1919" height="869" alt="Screenshot_8" src="https://github.com/user-attachments/assets/8d227c82-93dc-4545-8910-4ec6137be3f7" />
<br>
<br>
<img width="1918" height="875" alt="Screenshot_1" src="https://github.com/user-attachments/assets/a87895f1-0081-43a3-92c7-534a9b2ee172" />
<br>
<br>

##  🦋Home Page
<br>
On this page, you can chat with Iko:

- You can change the AI model from the menu at the top-left of the screen.

- You can create a new chat by clicking *+ New Chat*, or revisit an old conversation.

- You can edit your message and regenerate Iko's response.

- You can log out by pressing the *Logout button* at the bottom-left of the screen.

- You can also access your profile by pressing the *Profile button*.
  <br>
  <br>
  <img width="1918" height="874" alt="Screenshot_2" src="https://github.com/user-attachments/assets/a24539d1-128d-4e46-9057-af72b330b2bc" />
  <br>
  <br>

##  🦋Profile Page
<br>
On your profile page, you can manage your account information:

- You can change your username, name, and email by clicking the *Edit Profile* button.

- You can change your password by clicking the *Change Password* button.

- You can delete your account by clicking the *Delete Account* button.

- You can log out from your account.

- Or you can go back to the home page.
  <br>
  <br>
  <img width="1919" height="878" alt="Screenshot_3" src="https://github.com/user-attachments/assets/b5006c0d-edb6-4cf1-a88d-d2862298229b" />
  <br>
  <br>
  <img width="1919" height="852" alt="Screenshot_4" src="https://github.com/user-attachments/assets/f791e254-0bee-4bdd-bf6c-54da4914217f" />
  <br>
  <br>

## Demo
[🎥 Watch the demo](Iko_Demo.mp4)






