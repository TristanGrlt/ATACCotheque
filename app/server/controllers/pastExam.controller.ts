import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

interface MulterRequest extends Request {
  files: {
    [key: string]: Express.Multer.File[];
  };
}

const uploadDir = 'files'; 


async function recreatepdf(pdfBuffer: Buffer): Promise<Uint8Array> {
  const oldPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const pageIndices = oldPdf.getPageIndices();
  const copiedPages = await newPdf.copyPages(oldPdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  let oldTitle = oldPdf.getTitle();
  if(oldTitle == undefined){
    oldTitle = "";
  } 

  let oldAuthor = oldPdf.getAuthor();
  if(oldAuthor == undefined){
    oldAuthor = ""
  }
  newPdf.setTitle("Ataccothèque" + oldTitle  ); 
  newPdf.setAuthor(oldAuthor );
  newPdf.setProducer('Générateur Sécurisé ataccothèque');
  
  return await newPdf.save();
}

export const uploadAllPastExam = async (req: Request, res: Response) => {
  try {
    const { courseId, examTypeId, year, comment, url } = req.body;
    const files = (req as MulterRequest).files;

    if (!files || !files['file'] || files['file'].length === 0) {
      return res.status(400).json({ message: "Le fichier principal est manquant." });
    }

    const mainFile = files['file'][0];      
    const optionalFile = files['optionalFile'] ? files['optionalFile'][0] : null; 


    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (mainFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: "Le fichier principal doit être un PDF." });
    }

    const safeMainPdfBytes = await recreatepdf(mainFile.buffer);

    const mainFilename = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const mainFilePath = path.join(uploadDir, mainFilename);

    fs.writeFileSync(mainFilePath, safeMainPdfBytes);
    let optionalFilePath = null;
    if (optionalFile) {
      if (optionalFile.mimetype === 'application/pdf') {
        const safeOptPdfBytes = await recreatepdf(optionalFile.buffer);
        const optFilename = `optionalFile-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
        optionalFilePath = path.join(uploadDir, optFilename);
        fs.writeFileSync(optionalFilePath, safeOptPdfBytes);
      } else {
        return res.status(400).json({ message: "Le fichier optionnel doit également être un PDF." });
      }
    }

    const newPastExam = await prisma.pastExam.create({
      data: {
        path: mainFilePath,
        year: parseInt(year),         
        courseId: parseInt(courseId),
        examTypeId: parseInt(examTypeId)

      },
    });

    return res.status(201).json({ message: "Annale uploadée avec succès", data: newPastExam });

  } catch (error) {
    console.error("Erreur lors de l'upload ou du nettoyage :", error);
    return res.status(500).json({ message: "Erreur lors du traitement du fichier. Veuillez vérifier qu'il s'agit d'un PDF valide." });
  }
};