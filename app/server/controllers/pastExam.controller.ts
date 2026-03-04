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
  newPdf.setTitle("Ataccothèque " + oldTitle); 
  newPdf.setAuthor(oldAuthor);
  newPdf.setProducer('Générateur Sécurisé ataccothèque');
  
  return await newPdf.save();
}

export const uploadAllPastExam = async (req: Request, res: Response) => {
  try {
    const { courseId, examTypeId, year, annexes_metadata } = req.body;
    const files = (req as MulterRequest).files;

    if (!files || !files['file'] || files['file'].length === 0) {
      return res.status(400).json({ message: "Le fichier principal est manquant." });
    }

    const mainFile = files['file'][0];      

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (mainFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: "Le fichier principal doit être un PDF." });
    }
    const magic = mainFile.buffer.slice(0, 4).toString('ascii');
    if (!magic.startsWith('%PDF')) {
        return res.status(400).json({ message: "Le fichier n'est pas un PDF valide." });
      }

    const safeMainPdfBytes = await recreatepdf(mainFile.buffer);
    const mainFilename = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const mainFilePath = path.join(uploadDir, mainFilename);
    fs.writeFileSync(mainFilePath, safeMainPdfBytes);

    let annexesList: any[] = [];
    if (annexes_metadata) {
      try {
        annexesList = JSON.parse(annexes_metadata);
      } catch (e) {
        return res.status(400).json({ message: "Format des annexes invalide." });
      }
    }
    const newPastExam = await prisma.pastExam.create({
      data: {
        path: mainFilePath,
        year: parseInt(year),        
        courseId: parseInt(courseId),
        examTypeId: parseInt(examTypeId),
        isVerified: false
      },
    });

    // 5. Boucle sur la liste dynamique des annexes
    for (const annexe of annexesList) {
      
      if (annexe.type === 'url' && annexe.url) {
        // Enregistrement d'une annexe de type URL
        await prisma.annexe.create({
          data: {
            name: annexe.comment || "Lien externe", 
            type: "URL",
            url: annexe.url,
            pastExamId: newPastExam.id ,
            
          }
        });
      } 
      else if (annexe.type === 'fichier' && annexe.fileKey) {
        const annexeFileArray = files[annexe.fileKey];
        
        if (annexeFileArray && annexeFileArray.length > 0) {
          const annexeFile = annexeFileArray[0];
          
          if (annexeFile.mimetype === 'application/pdf') {
            const safeOptPdfBytes = await recreatepdf(annexeFile.buffer);
            const optFilename = `annexe-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
            const optionalFilePath = path.join(uploadDir, optFilename);
            fs.writeFileSync(optionalFilePath, safeOptPdfBytes);

            await prisma.annexe.create({
              data: {
                name: annexe.comment || "Document annexe",
                type: "FILE",
                path: optionalFilePath,
                pastExamId: newPastExam.id,
              }
            });
          }
        }
      }
    }

    return res.status(201).json({ message: "Annale uploadée avec succès", data: newPastExam });

  } catch (error) {
    console.error("Erreur lors de l'upload ou du nettoyage :", error);
    return res.status(500).json({ message: "Erreur lors du traitement du fichier. Veuillez vérifier qu'il s'agit d'un PDF valide." });
  }
};