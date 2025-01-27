// Add this to your auth routes file
router.post('/login', async (req, res) => {
 const { email, password } = req.body;

 try {
   const client = await Clients.findOne({ email });
   
   if (!client) {
     return res.status(401).json({ error: 'Invalid credentials' });
   }

   // Check if user is active
   if (client.status !== 'Active') {
     return res.status(403).json({ error: 'Account is not active' });
   }

   // Verify password
   const isValid = await bcrypt.compare(password, client.password);
   if (!isValid) {
     return res.status(401).json({ error: 'Invalid credentials' });
   }

   // Here you would typically generate and return a JWT token
   res.json({ message: 'Login successful' });
 } catch (error) {
   console.error('Login error:', error);
   res.status(500).json({ error: 'Internal server error' });
 }
});
