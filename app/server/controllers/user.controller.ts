import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model.js'
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

export const addUser = async (req: Request<{}, {}, IUser>, res: Response) => {
  try {
    const { username, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();

    const { password: _pw, ...userData } = user.toObject();
    return res.status(201).json(userData);
  } catch (error : any) {
    if (error?.code === 11000) {
      return res.status(400).json({
        error: `Le nom d'utilisateur "${error.keyValue.username}" existe déjà`
      });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    } 
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const connectUser = async (req: Request<{}, {}, IUser>, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect` });
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }
    const jsToken = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('jwt', jsToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const { password: _pw, ...userData } = user.toObject();
    return res.status(200).json(userData)
  } else {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect` });
  }
};

export const logoutUser = (req: Request<{}, {}, IUser>, res: Response) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: "Déconnexion réussie" })
};