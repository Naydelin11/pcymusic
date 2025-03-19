const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar CORS
app.use(cors());

// Middleware para JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pcy_music'
});

// Verificar conexión
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos');
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('ESO LEONAAA!');
});

// Obtener todos los productos
app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err);
      return res.status(500).json({ error: 'Error al obtener los productos' });
    }
    res.json(results);
  });
});

// Registrar usuario
app.post('/register', (req, res) => {
  const { fullname, birthdate, username, email, password } = req.body;

  if (!fullname || !birthdate || !username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Encriptar la contraseña antes de almacenarla
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error al encriptar la contraseña:', err);
      return res.status(500).json({ error: 'Error al encriptar la contraseña' });
    }

    const sql = 'INSERT INTO users (fullname, birthdate, username, email, password) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [fullname, birthdate, username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error al registrar usuario:', err);
        return res.status(500).json({ error: 'Error al registrar usuario' });
      }
      res.json({ message: 'Usuario registrado correctamente' });
    });
  });
});



// Iniciar sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error en el login:', err);
      return res.status(500).json({ error: 'Error en el login' });
    }

    if (results.length > 0) {
      // Compara la contraseña proporcionada con la almacenada en la base de datos
      bcrypt.compare(password, results[0].password, (err, match) => {
        if (err) {
          console.error('Error al comparar contraseñas:', err);
          return res.status(500).json({ error: 'Error al verificar la contraseña' });
        }

        if (match) {
          res.json({ message: 'Login exitoso', user: results[0] });
        } else {
          res.status(401).json({ error: 'Credenciales incorrectas' });
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  });
});

// Comprar un producto
app.post('/comprar', (req, res) => {
  const { userId, productId, quantity } = req.body;
  
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ error: 'Faltan datos de la compra' });
  }

  const sql = 'INSERT INTO compras (user_id, product_id, quantity) VALUES (?, ?, ?)';
  db.query(sql, [userId, productId, quantity], (err, result) => {
    if (err) {
      console.error('Error al registrar compra:', err);
      return res.status(500).json({ error: 'Error en la compra' });
    }
    res.json({ message: 'Compra registrada correctamente' });
  });
});

// Obtener historial de compras de un usuario
app.get('/compras/:userId', (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT c.id, p.name AS product, c.quantity, c.date 
    FROM compras c 
    JOIN productos p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error al obtener compras:', err);
      return res.status(500).json({ error: 'Error al obtener compras' });
    }
    res.json(results);
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
