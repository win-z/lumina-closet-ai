/**
 * ==================== 认证路由 ====================
 * 处理用户注册、登录、Token刷新等认证相关请求
 *
 * API端点:
 * - POST   /api/auth/register   - 用户注册
 * - POST   /api/auth/login      - 用户登录
 * - POST   /api/auth/refresh    - 刷新Token
 * - POST   /api/auth/logout     - 退出登录
 */

import { Router, Request, Response } from 'express';
import { UserModel } from '../models';
import { generateToken, refreshToken } from '../middleware/auth';
import { asyncHandler, Errors } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { isValidEmail, validatePasswordStrength } from '../utils/helper';
import { LoginRequest, RegisterRequest, ApiResponse } from '../types';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(8, '密码至少8位'),
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符'),
});

const loginSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * POST /api/auth/register
 * 用户注册
 */
const register = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { email, password, username } = req.body as RegisterRequest;

  if (!isValidEmail(email)) {
    throw Errors.badRequest('无效的邮箱格式');
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    throw Errors.badRequest(passwordCheck.message);
  }

  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw Errors.conflict('该邮箱已被注册');
  }

  const passwordHash = UserModel.hashPassword(password);
  const user = await UserModel.create(email, passwordHash, username);

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    },
  });
});

/**
 * POST /api/auth/login
 * 用户登录
 */
const login = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { email, password } = req.body as LoginRequest;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw Errors.unauthorized('邮箱或密码错误');
  }

  if (!UserModel.verifyPassword(password, user.passwordHash)) {
    throw Errors.unauthorized('邮箱或密码错误');
  }

  await UserModel.updateLastLogin(user.id);

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    },
  });
});

/**
 * POST /api/auth/refresh
 * 刷新访问Token
 */
const refresh = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Errors.unauthorized('缺少认证令牌');
  }

  const token = authHeader.split(' ')[1];
  const newToken = refreshToken(token);

  if (!newToken) {
    throw Errors.unauthorized('Token已过期，请重新登录');
  }

  res.json({
    success: true,
    message: 'Token刷新成功',
    data: { token: newToken },
  });
});

/**
 * POST /api/auth/logout
 * 退出登录
 */
const logout = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: '退出成功',
  });
});

router.post('/register', validate(registerSchema, 'body'), register);
router.post('/login', validate(loginSchema, 'body'), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
