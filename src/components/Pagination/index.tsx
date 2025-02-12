import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  paginate: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, paginate }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex flex-wrap justify-center gap-2 my-5">
      <button
        className={`px-4 py-2 border border-[#A14996] text-[#A14996] rounded-md transition-all duration-300 ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A14996] hover:text-white'
        }`}
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          onClick={() => paginate(index + 1)}
          className={`px-4 py-2 border border-[#A14996] rounded-md transition-all duration-300 ${
            currentPage === index + 1
              ? 'bg-[#A14996] text-white font-bold'
              : 'text-[#A14996] hover:bg-[#A14996] hover:text-white'
          }`}
        >
          {index + 1}
        </button>
      ))}

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
