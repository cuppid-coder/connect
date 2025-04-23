import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { AuthContext } from "../contexts/authContextDef";
import "../styles/pages/Login.css";

const Login = () => {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions

    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (isLogin) {
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required");
        }
      } else {
        if (!formData.email || !formData.password || !formData.name) {
          throw new Error("All fields are required");
        }

        // Validate password
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
      }

      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        navigate("/");
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      setLoading(false); // Reset loading state on error
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? "Sign In" : "Create Account"}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {!isLogin && (
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            <FontAwesomeIcon
              icon={isLogin ? faSignInAlt : faUserPlus}
              className="me-2"
            />
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign in"
              : "Create account"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>

        <div className="social-buttons">
          <button className="social-button">
            <FontAwesomeIcon icon={faGoogle} className="icon" />
            Continue with Google
          </button>
          <button className="social-button">
            <FontAwesomeIcon icon={faGithub} className="icon" />
            Continue with GitHub
          </button>
        </div>

        <button className="mode-toggle" onClick={toggleMode}>
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default Login;
