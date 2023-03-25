import jwt from 'jsonwebtoken';

import * as config from '../../config.js';
import User from '../../models/user.js';
import { emailTemplate } from '../../helpers/email.js';

// 이메일 유효성 검사 정규식(RFC 5322 형식)
const emailPattern =
  "([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|[[\t -Z^-~]*])";
const regexEmail = new RegExp(emailPattern);

export default class AuthController {
  welcome = (req, res) => {
    res.json({
      data: 'Welcome to Muroom.',
    });
  };

  preRegister = async (req, res) => {
    try {
      const { email, password } = req.body;

      //
      if (!regexEmail.test(email)) {
        return res.json({
          error: '이메일 형식이 맞지 않습니다. 다시 입력해주세요.',
        });
      }

      // 비밀번호 유효성 검사
      if (!password) {
        return res.json({ error: '비밀번호를 입력해주세요.' });
      } else if (password?.length < 8) {
        return res.json({
          error: '비밀번호가 너무 짧습니다. 8자 이상으로 다시 입력해주세요.',
        });
      }

      // 해당 이메일의 사용자가 존재하는가?
      const user = await User.findOne({ email });

      // 존재한다면 회원가입 거절
      if (user) {
        return res.json({ error: '이미 사용 중인 이메일입니다.' });
      }

      // 존재하지 않는다면 계속 진행
      const token = jwt.sign({ email, password }, config.JWT_SECRET, {
        expiresIn: '1h',
      });
      config.AWSSES.sendEmail(
        emailTemplate(
          email,
          `
            <p>회원가입을 끝내기 위해 아래 링크로 접속해주세요.</p>
            <a href="${config.CLIENT_URL}/auth/account-activate/${token}">회원가입 끝내기!</a>
          `,
          config.REPLY_TO,
          '회원가입',
        ),
        (err, data) => {
          if (err) {
            console.log(err);
            return res.json({ ok: false });
          }
          console.log(data);
          return res.json({ ok: true });
        },
      );
    } catch (err) {
      console.log(err);
      return res.json({
        error: '뭔가 잘못 되었습니다. 서버 콘솔을 확인해주세요.',
      });
    }
  };
}
