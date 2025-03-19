app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error('Error en el login:', err);
        return res.status(500).json({ error: 'Error en el login' });
      }
  
      if (results.length > 0) {
        const user = results[0];
        
        // Comparar la contraseña cifrada
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          res.json({ message: 'Login exitoso', user: results[0] });
        } else {
          res.status(401).json({ error: 'Credenciales incorrectas' });
        }
      } else {
        res.status(401).json({ error: 'Usuario no encontrado' });
      }
    });
  });
  