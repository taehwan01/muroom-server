import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import * as config from '../../config.js';
import User from '../../models/user.js';
import { emailTemplate } from '../../helpers/email.js';
import { hashPassword, comparePassword } from '../../models/auth.js';

// 이메일 유효성 검사 정규식(RFC 5322 형식)
const emailPattern =
  "([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|[[\t -Z^-~]*])";
const regexEmail = new RegExp(emailPattern);

const tokenAndUserResponse = (req, res, user) => {
  // JWT 토큰 생성
  const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: '1h',
  });
  const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: '7d',
  });

  // 비밀번호 및 신규 비밀번호 생성 코드는 전달하지 않는다.
  user.password = undefined;
  user.resetCode = undefined;

  // 로그인 응답
  return res.json({
    token,
    refreshToken,
    user,
  });
};

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

      // 회원가입 인증 이메일 전송
      config.AWSSES.sendEmail(
        emailTemplate(
          email,
          `
            <p>회원가입을 끝내기 위해 아래 링크로 접속해주세요.</p>
            <a href="${config.CLIENT_URL}/auth/account-activate/${token}">회원가입 끝내기!</a>
          `,
          config.REPLY_TO,
          'Muroom 회원가입',
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

  register = async (req, res) => {
    try {
      const { email, password } = jwt.verify(req.body.token, config.JWT_SECRET);

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.json({ error: '이미 사용 중인 이메일입니다.' });
      }

      // 사용자 비밀번호 암호화
      const hashedPassword = await hashPassword(password);

      // 사용자 데이터 저장
      const user = await new User({
        username: nanoid(6),
        email,
        password: hashedPassword,
      }).save();

      tokenAndUserResponse(req, res, user);
    } catch (err) {
      console.log(err);
      return res.json({
        error: '뭔가 잘못 되었습니다. 서버 콘솔을 확인해주세요.',
      });
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      // 사용자 데이터 여부 확인
      const user = await User.findOne({ email });

      // 비밀번호 대조
      const matchPassword = await comparePassword(password, user.password);
      if (!matchPassword) {
        return res.json({
          error: '비밀번호가 일치하지 않습니다. 다시 입력해주세요',
        });
      }

      // 로그인 처리
      tokenAndUserResponse(req, res, user);
    } catch (err) {
      console.log(err);
      return res.json({
        error: '뭔가 잘못 되었습니다. 서버 콘솔을 확인해주세요.',
      });
    }
  };

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.json({
          error: '사용자 정보를 찾지 못했습니다. 이메일을 다시 확인해주세요.',
        });
      } else {
        const resetCode = nanoid();
        user.resetCode = resetCode;
        user.save();

        const token = jwt.sign({ resetCode }, config.JWT_SECRET, {
          expiresIn: '1h',
        });

        config.AWSSES.sendEmail(
          emailTemplate(
            email,
            `
            <p>본인 확인을 위해 아래 링크로 접속해주세요.</p>
            <a href="${config.CLIENT_URL}/auth/access-account/${token}">본인 확인 완료하기!</a>
          `,
            config.REPLY_TO,
            'Muroom 비밀번호 찾기 본인 확인',
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
      }
    } catch (err) {
      console.log(err);
      return res.json({
        error: '뭔가 잘못 되었습니다. 서버 콘솔을 확인해주세요.',
      });
    }
  };

  accessAccount = async (req, res) => {
    try {
      const { resetCode } = jwt.verify(req.body.resetCode, config.JWT_SECRET);

      const user = await User.findOneAndUpdate(
        { resetCode },
        { resetCode: '' },
      );

      tokenAndUserResponse(req, res, user);
    } catch (err) {
      console.log(err);
      return res.json({
        error: '뭔가 잘못 되었습니다. 서버 콘솔을 확인해주세요.',
      });
    }
  };
}
