import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';

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
app.use(cors());
app.use(morgan('dev'));

// 라우터 호출
app.use('/api', authRouter);

app.listen(8000, () => {
  console.log('*********** Server running on port 8000 ***********');
});
