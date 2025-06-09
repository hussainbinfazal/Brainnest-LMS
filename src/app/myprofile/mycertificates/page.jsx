"use client";

import React, { useEffect, useState } from "react";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCourseStore } from "@/lib/store/useCourseStore";
import { useRouter } from "next/navigation";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const MyCertificatesPage = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.authUser);
  const isAuthChecked = useAuthRedirect({
    redirectIfUnauthenticated: true,
    redirectIfAuthenticated: false,
    redirectIfNotInstructor: true,
    interval: 3000,
  });
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const { fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    if (authUser) {
      setCertificates(authUser?.certificates || []);
    }
  }, [authUser]);

  if (!certificates.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        No certificates found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex  justify-start items-start pl-4">
      <div className=" w-full h-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 justify-items-start ">
        {certificates?.length === 0 ? (
          <div>No courses found</div>
        ) : (
          <>
            {(certificates || []).map((cert) => {
              return (
                <div key={cert?._id} className="inline-block">
                  <div className="inline-block">
                    <Card className=" h-[440px] w-[300px]">
                      <CardContent className="">
                        <div className="grid w-full items-center gap-2">
                          <Document
                            file={`data:application/pdf;base64,${cert.pdfData}`} // this is your base64 string like "data:application/pdf;base64,..."
                            loading={<div>Loading thumbnail...</div>}
                          >
                            <Page
                              pageNumber={1}
                              width={250} // Thumbnail width
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                          </Document>
                          <div className="flex flex-col space-y-1.5">
                            <h2 className="text-xl font-semibold  break-words leading-snug">
                              {cert?.courseName}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Issued on: {new Date(cert.generatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-1.5 justify-start items-start gap-1">
                            <h2 className="text-sm font-semibold text-muted-foreground">
                              {cert?.instructorName}
                            </h2>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4  w-full">
                        <Button
                          variant="outline"
                          className="!w-full px-2 py-4"
                          onClick={() => {
                            const pdfWindow = window.open();
                            pdfWindow.document.write(
                              `<iframe width='100%' height='100%' src='data:application/pdf;base64,${cert.pdfData}'></iframe>`
                            );
                          }}
                        >
                          View Certificate
                        </Button>
                        <a
                          href={`data:application/pdf;base64,${cert?.pdfData}`}
                          download={`certificate-${cert?.courseName}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            className="!w-full px-2 py-4"
                          >
                            Download Certificate
                          </Button>
                        </a>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCertificatesPage;
