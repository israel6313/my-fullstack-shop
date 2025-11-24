require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// חיבור למסד הנתונים (מדלג אם אין חיבור כדי לא לתקוע את השרת)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Warning:', err.message));

// --- סכימות (Schemas) ---
const productSchema = new mongoose.Schema({
    name: String, price: Number, description: String, image: String, category: String
});
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- נתיבים (Routes) ---

// 1. מוצרים
app.get('/api/products', async (req, res) => {
    try {
        // אם אין חיבור למונגו, נחזיר מערך ריק או שגיאה מבוקרת
        if (mongoose.connection.readyState !== 1) {
            return res.json([
                { _id: '1', name: 'מוצר דמוי (אין DB)', price: 100, image: 'https://via.placeholder.com/150', category: 'בדיקה' }
            ]);
        }
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "שגיאה בטעינת מוצרים" });
    }
});

// 2. אימות (Auth)
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "המייל כבר קיים" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "נרשמת בהצלחה" });
    } catch (error) {
        res.status(500).json({ error: "שגיאה בהרשמה" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "פרטים שגויים" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "פרטים שגויים" });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "שגיאה בהתחברות" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));