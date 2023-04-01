import express from 'express';

import AuthController from './auth.controller.js';
import requireLogin from '../../middlewares/auth.js';

const authRouter = express.Router();
const authController = new AuthController();

authRouter.get('/welcome', authController.welcome);
authRouter.post('/pre-register', authController.preRegister);
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/access-account', authController.accessAccount);
authRouter.get('/refresh-token', authController.refreshToken);
authRouter.get('/current-user', requireLogin, authController.currentUser);
authRouter.get('/profile/:username', authController.publicProfile);
authRouter.put('/update-password', requireLogin, authController.updatePassword);
authRouter.put('/update-profile', requireLogin, authController.updateProfile);

export default authRouter;
