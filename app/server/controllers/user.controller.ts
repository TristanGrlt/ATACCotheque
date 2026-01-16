import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model.js'
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
    res.status(201).json(userData);
  } catch (error : any) {
    if (error?.code === 11000) {
      return res.status(400).json({
        error: `Le nom d'utilisateur "${error.keyValue.username}" existe déjà`
      });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: error.message });
    } 
    res.status(500).json({ error: 'Internal server error' });
  }
};