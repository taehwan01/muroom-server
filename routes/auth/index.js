import express from 'express';

import AuthController from './auth.controller.js';

const authRouter = express.Router();
const authController = new AuthController();

authRouter.get('/welcome', authController.welcome);
authRouter.post('/pre-register', authController.preRegister);

export default authRouter;
