import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  paginate: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  paginate 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Function to get page numbers to display
  const getPageNumbers = () => {
    const maxPagesToShow = 5; // Number of page buttons to show
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    let pages = [];
    
    // Add first page with ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis1');
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add last page with ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis2');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 my-5">
      <button
        className={`px-4 py-2 border border-[#A14996] text-[#A14996] rounded-md transition-all duration-300 ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A14996] hover:text-white'
        }`}
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis1' || page === 'ellipsis2') {
          return (
            <span key={page} className="px-3 py-2 text-[#A14996]">
              ...
            </span>
          );
        }
        
        return (
          <button
            key={index}
            onClick={() => paginate(Number(page))}
            className={`w-10 h-10 flex items-center justify-center border border-[#A14996] rounded-md transition-all duration-300 ${
              currentPage === page
                ? 'bg-[#A14996] text-white font-bold'
                : 'text-[#A14996] hover:bg-[#A14996] hover:text-white'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        className={`px-4 py-2 border border-[#A14996] text-[#A14996] rounded-md transition-all duration-300 ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A14996] hover:text-white'
        }`}
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;