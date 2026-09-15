const apiBaseUrl = "http://localhost:4000/api";

const registerForm = document.querySelector("#register-form");
const loginForm = document.querySelector("#login-form");
const messageBox = document.querySelector("#message");
const userList = document.querySelector("#user-list");

function showMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.style.color = isError ? "#b00020" : "#0b6b2b";
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาด");
  }

  return data;
}

async function loadUsers() {
  const users = await request("/users");

  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.name} (${user.email})`;
    userList.appendChild(li);
  });
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = new FormData(registerForm);

  try {
    const user = await request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    showMessage(`สมัครสมาชิกสำเร็จ: ${user.name}`);
    registerForm.reset();
    await loadUsers();
  } catch (error) {
    showMessage(error.message, true);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = new FormData(loginForm);

  try {
    const result = await request("/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    showMessage(`${result.message}: สวัสดี ${result.user.name}`);
    loginForm.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
});

loadUsers().catch(() => {
  showMessage("ยังเชื่อมต่อ backend ไม่ได้ ลองเช็กว่า docker compose up แล้วหรือยัง", true);
});

