import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getVisiblePages } from "@/lib/helpers/pagesCalculationHelper";
import { JSX } from "react";

export type PaginationSectionProps = {
    totalPages: number,
    currentPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
    maxVisiblePages?: number,
    handlePageChange: (page: number) => void

}


export default function PaginationSection({ totalPages = 1, currentPage = 1, hasNextPage = false, hasPrevPage = false, maxVisiblePages = 5, handlePageChange }: PaginationSectionProps): JSX.Element {
    return <div className="py-4">
        {totalPages > 1 && (
            <Pagination className=''>
                <PaginationContent className=''>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            isActive={hasPrevPage}
                            className={
                                !hasPrevPage ? "opacity-50 cursor-not-allowed" : ""
                            }
                        />
                    </PaginationItem>

                    {getVisiblePages({ currentPage, totalPages, maxVisiblePages }).map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink className=''
                                onClick={() => handlePageChange(page)}
                                isActive={page === currentPage}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationEllipsis className='' />
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            isActive={hasNextPage}
                            className={
                                !hasNextPage ? "opacity-50 cursor-not-allowed" : ""
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}
    </div>;
}