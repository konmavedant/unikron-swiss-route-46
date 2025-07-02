import express from 'express';
import cors from 'cors';
import { getQuote } from '../src/services/jupiterService';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/quote', async (req, res) => {
  const { fromMint, toMint, amount } = req.body;

  try {
    const quote = await getQuote(fromMint, toMint, amount);
    res.json(quote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Quote API server running on port ${PORT}`));
