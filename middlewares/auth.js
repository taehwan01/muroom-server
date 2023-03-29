import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

const requireLogin = (req, res, next) => {
  try {
    const decoded = jwt.verify(req.headers.authorization, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: '유효하지 않은 token입니다.' });
  }
};

export default requireLogin;
