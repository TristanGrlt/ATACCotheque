import { Router } from "express";
import { createCourse, deleteCourse, getCourse, updateCourse } from "../controllers/course.controller.js";

const router = Router();

router.get('/', getCourse);
router.post('/', createCourse);
router.put('/:courseId', updateCourse);
router.delete('/:courseId', deleteCourse);


export default router;