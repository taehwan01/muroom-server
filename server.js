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

// 미들웨어
app.use(express.json());

// 라우터 호출
app.use('/api', authRouter);

app.listen(8000, () => {
  console.log('*********** Server running on port 8000 ***********');
});
