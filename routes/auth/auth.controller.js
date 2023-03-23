export default class AuthController {
  welcome = (req, res) => {
    res.json({
      data: 'Hello from Node.js api from routes.',
    });
  };
}
