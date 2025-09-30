
import jsPDF from "jspdf";
import { NextResponse } from "next/server";
import Course from "@/models/course/courseModel";
import User from "@/models/userModel";
import { connectDB } from "@/config/db";
import { getDataFromToken } from "@/utils/getDataFromToken";

export async function GET(request, context) {
  try {
    await connectDB();
    const user = await getDataFromToken(request);
    const { courseId } = await context.params;
    const userId = user._id || user.id;

    const userInDB = await User.findById(userId);
    const course = await Course.findById(courseId).populate("instructor").lean();

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Optional: check if user completed course
    const isCompleted = userInDB.completedCourses.includes(courseId);
    if (!isCompleted) {
      return NextResponse.json({ message: "Course not completed" }, { status: 403 });
    }

    const existingCertificate = userInDB?.certificates?.find(cert =>
      cert.courseId.toString() === courseId
    );

    if (existingCertificate) {
      // Return existing certificate
      const pdfBuffer = Buffer.from(existingCertificate.pdfData, 'base64');
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=certificate-${courseId}.pdf`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    }
    // Generate PDF with jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Set up the certificate design
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add border
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
    doc.text(`Awarded to: ${userInDB?.name}`, pageWidth / 2, 90, { align: 'center' });

    // Course completion text
    doc.setFontSize(16);
    doc.text("For successfully completing the course:", pageWidth / 2, 110, { align: 'center' });

    // Course title
    doc.setFontSize(24);
    doc.text(course.title, pageWidth / 2, 130, { align: 'center' });

    // Instructor and date
    doc.setFontSize(14);
    doc.text(`Instructor: ${course?.instructor?.name || "John Doe"}`, pageWidth / 2, 160, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 175, { align: 'center' });


    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfBase64 = pdfBuffer.toString('base64');

    const completionDate = new Date().toLocaleDateString();
    const certificateData = {
      courseId: courseId,
      courseName: course?.title,
      instructorName: course?.instructor?.name || "John Doe",
      completionDate: completionDate,
      pdfData: pdfBase64,
      generatedAt: new Date()
    };

    // Add certificate to user's certificates array
    await User.findByIdAndUpdate(userId, {
      $push: { certificates: certificateData }
    });
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=certificate-${courseId}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}