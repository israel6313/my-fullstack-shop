import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { ShoppingCart, X, Trash2, Plus, User, LogOut, Loader } from 'lucide-react';

function App() {
  // --- הגדרת כתובת השרת ---
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // --- הגדרת משתנים (States) ---
  
  // 1. תיקון קריטי: טעינת המשתמש ישירות בהגדרה (מונע את השגיאה)
  // הפונקציה בתוך useState רצה רק פעם אחת כשהדף עולה
  const [user, setUser] = useState(() => localStorage.getItem('username'));

  // 2. שאר המשתנים
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 3. משתנים לאימות (Auth)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");

  // --- טעינה ראשונית (useEffect) ---
  useEffect(() => {
    // טעינת מוצרים מהשרת בלבד
    axios.get(`${API_URL}/api/products`)
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading products:", err);
        setLoading(false);
      });
      
    // שים לב: מחקנו מכאן את הקוד של setUser שגרם לשגיאה!
    // הוא עבר למעלה לשורה של useState.
  }, []);

  // --- פונקציות עזר (Logic) ---

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(item => item._id === product._id);
      return exist 
        ? prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item)
        : [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item._id !== id));
  
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isLoginMode ? '/api/login' : '/api/register';
    const payload = isLoginMode ? { email, password } : { username, email, password };

    try {
      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      
      if (isLoginMode) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setUser(data.username);
        setIsAuthModalOpen(false);
      } else {
        setIsLoginMode(true);
        setAuthError("הרשמה הצליחה! התחבר כעת.");
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || "שגיאה בתקשורת");
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setCart([]);
  };

  // --- תצוגה (JSX) ---
  return (
    <div className="app-wrapper">
      
      {/* Header */}
      <header className="shop-header">
        <div className="logo-area"><h1>MyShop</h1></div>
        <div className="nav-actions">
          {user ? (
            <div className="user-info">
              <span>{user}</span>
              <button className="icon-btn" onClick={logout} title="התנתק"><LogOut size={20} /></button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthModalOpen(true)}>
              <User size={18} /> התחבר
            </button>
          )}
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="shop-container">
        {loading ? <div className="loader"><Loader className="spin"/> טוען מוצרים...</div> : (
          <div className="products-grid">
            {products.map((p) => (
              <article key={p._id} className="product-card">
                <div className="img-wrapper"><img src={p.image} alt={p.name} loading="lazy" /></div>
                <div className="product-info">
                  <div className="info-top">
                    <h3>{p.name}</h3>
                    <p className="category-tag">{p.category || 'כללי'}</p>
                  </div>
                  <div className="info-bottom">
                    <span className="price">₪{p.price}</span>
                    <button className="add-btn-icon" onClick={() => addToCart(p)}>
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
      <aside className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header"><h2>העגלה ({totalItems})</h2><button className="close-btn" onClick={() => setIsCartOpen(false)}><X size={24}/></button></div>
        <div className="cart-items">
          {cart.length === 0 && <div className="empty-msg">העגלה ריקה</div>}
          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <img src={item.image} alt={item.name} />
              <div className="item-details"><h4>{item.name}</h4><div className="item-pricing"><span>₪{item.price}</span><span className="qty-badge">x{item.qty}</span></div></div>
              <button className="remove-btn" onClick={() => removeFromCart(item._id)}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="total-row"><span>סה"כ:</span><span className="total-price">₪{totalPrice}</span></div>
          <button className="checkout-btn" disabled={cart.length === 0}>{user ? "לתשלום" : "התחבר לתשלום"}</button>
        </div>
      </aside>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="auth-overlay">
          <div className="auth-box">
            <button className="close-auth" onClick={() => setIsAuthModalOpen(false)}><X size={20}/></button>
            <h2>{isLoginMode ? "התחברות" : "הרשמה"}</h2>
            <form onSubmit={handleAuth}>
              {!isLoginMode && <input type="text" placeholder="שם משתמש" value={username} onChange={e => setUsername(e.target.value)} required />}
              <input type="email" placeholder="אימייל" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" className="auth-submit-btn">{isLoginMode ? "התחבר" : "הירשם"}</button>
            </form>
            {authError && <p className="auth-error">{authError}</p>}
            <p className="auth-switch" onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); }}>
              {isLoginMode ? "אין לך חשבון? הירשם" : "כבר רשום? התחבר"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;