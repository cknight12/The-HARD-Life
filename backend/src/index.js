const express = require('express');
const cors = require('cors');

require('./database'); // initialize DB

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits').router);
app.use('/api/goals', require('./routes/goals'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/groups', require('./routes/groups'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'The HARD Life' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`The HARD Life API running on http://localhost:${PORT}`);
});
