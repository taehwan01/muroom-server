import express from 'express';
import mongoose from 'mongoose';

import authRouter from './routes/auth/index.js';

import { DATABASE } from './config.js';

const app = express();

mongoose.set('strictQuery', false);
mongoose
  .connect(DATABASE)
  .then(() => {
    console.log('***** MongoDB connected. *****');
  })
  .catch((err) => {
    console.log(err);
  });

app.use('/api', authRouter);

app.listen(8000, () => {
  console.log('*********** Server running on port 8000 ***********');
});
