import jsPDF from "jspdf";
import Course from "@/models/Course/courseModel";
import Certificate from "@/models/Course/certificateModel";
import { uploadToCloudinary } from "./uploadToCloudinary";
import { logger } from "@/utils/logger/logger";


export async function generateCertificate(userName: string, courseId: string, userId: string, instructorName: string, courseTitle: string) {
    try {

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });
        // Set up the certificate design
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setLineWidth(2);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Title
        doc.setFontSize(16);
        doc.text("Brainnest", 20, 25);

        // Certificate title
        doc.setFontSize(32);
        doc.text("Certificate of Completion", pageWidth / 2, 60, { align: 'center' });

        // Awarded to
        doc.setFontSize(20);
        doc.text(`Awarded to: ${userName}`, pageWidth / 2, 90, { align: 'center' });

        // Course completion text
        doc.setFontSize(16);
        doc.text("For successfully completing the course:", pageWidth / 2, 110, { align: 'center' });

        // Course title
        doc.setFontSize(24);
        doc.text(courseTitle, pageWidth / 2, 130, { align: 'center' });

        // Instructor and date
        doc.setFontSize(14);
        doc.text(`Instructor: ${instructorName}`, pageWidth / 2, 160, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 175, { align: 'center' });


        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        const url = await uploadToCloudinary(pdfBuffer, "certificate.pdf");
        const previewUrl = url.replace(".pdf", ".jpg");
        await Certificate.updateOne({
            userId, courseId
        }, {
            $setOnInsert: {
                userId: userId,
                courseId: courseId,
                courseName: courseTitle,
                instructorName: instructorName,
                pdfUrl: url,
                certificatePreview: previewUrl
            }
        }, {
            upsert: true
        })
    }
    catch (error: any) {
        logger.error("Error in generating certificate", error);
        throw error

    }
}
