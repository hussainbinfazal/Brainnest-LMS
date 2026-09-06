export const getVisiblePages = ({ currentPage = 0, totalPages = 0, maxVisiblePages = 5 }: { currentPage: number, totalPages: number, maxVisiblePages: number },): number[] => {
    const pages: number[] = [];
    let startPage: number = Number(Math.max(1, currentPage - Math.floor(maxVisiblePages / 2)));
    let endPage: number = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return pages;
};