import { useState, useCallback } from "react";

export function usePageState(totalPages: number, initialPage = 1) {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);
    return { currentPage, setCurrentPage, handlePageChange };
}
