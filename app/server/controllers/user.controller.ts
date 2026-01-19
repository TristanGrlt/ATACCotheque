import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model.js'
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../app.js';
import { cookieOptions } from '../utils/cookieOptions.js';

export const signupUser = async (req: Request<{}, {}, IUser>, res: Response) => {
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

export const loginUser = async (req: Request<{}, {}, IUser>, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect` });
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    const jsToken = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.cookie('jwt', jsToken, cookieOptions);

    const { password: _pw, ...userData } = user.toObject();
    return res.status(200).json(userData)
  } else {
    return res.status(401).json({ error: `Nom d'utilisateur ou mot de passe incorrect` });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: "Déconnexion réussie" })
};

export const verifyUser = (req: Request, res: Response) => {
  const token = req.cookies?.jwt;
  
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({ valid: true })
  } catch (error) {
    res.clearCookie('jwt');
    res.status(401).json({ error: 'Session invalide' });
  }
}