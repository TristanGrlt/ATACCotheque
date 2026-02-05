import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';

export const getCourse = async (req: Request, res: Response) => {

const result = await prisma.major.findMany({
 
 
  select: {
    name: true, 
    level: {
      select: {
        name: true, 
        course: {
          select: {
            id : true,
            name: true 
           
          }
        }
      }
    }
  }
});

    return res.json(result);
  }




    
  





 



   
