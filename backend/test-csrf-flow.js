// Test CSRF flow manually
import axios from "axios";

const baseURL = "http://localhost:5000";

async function testCSRFFlow() {
  try {
    console.log("1. Fetching CSRF token...");
    const tokenResponse = await axios.get(`${baseURL}/api/csrf-token`, {
      withCredentials: true,
    });

    const csrfToken = tokenResponse.data.csrfToken;
    const cookies = tokenResponse.headers["set-cookie"];

    console.log("✅ CSRF Token:", csrfToken);
    console.log("✅ Cookies:", cookies);

    // Extract cookie value
    const cookieHeader = cookies ? cookies.join("; ") : "";

    console.log("\n2. Attempting registration with CSRF token...");
    const registerResponse = await axios.post(
      `${baseURL}/api/auth/register`,
      {
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "password123",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: cookieHeader,
        },
        withCredentials: true,
      }
    );

    console.log("✅ Registration successful:", registerResponse.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message || error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }
  }
}

testCSRFFlow();
