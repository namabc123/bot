// CustomPagination.jsx
import React from "react";

/**
 * Props:
 *  - totalPages (number)
 *  - currentPage (number)
 *  - onPageChange (function)
 *
 * Uses Tailwind-style utility classes (same classes you used earlier).
 */
const CustomPagination = ({ totalPages = 25, currentPage = 1, onPageChange = () => {} }) => {
  // build set of pages to show (first block, neighborhood, last block)
  const pageSet = new Set();

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageSet.add(i);
  } else {
    pageSet.add(1);
    pageSet.add(2);
    pageSet.add(3);
    pageSet.add(4);
    pageSet.add(totalPages - 1);
    pageSet.add(totalPages);

    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= totalPages) pageSet.add(i);
    }
  }

  const pages = Array.from(pageSet).filter(p => p >= 1 && p <= totalPages).sort((a,b) => a-b);

  // render list with single ellipses for gaps
  const items = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && pages[idx] !== pages[idx - 1] + 1) {
      items.push(
        <li key={`ell-${p}`} className="select-none">
          <span className="text-[#9499AA] px-2">…</span>
        </li>
      );
    }

    const isActive = p === currentPage;

    items.push(
      <li key={p}>
        <button
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={isActive ? "page" : undefined}
          className={`w-[36px] h-[36px] flex items-center justify-center text-[14px] rounded-[12px] transition-colors
            ${isActive
              ? "bg-[#1967FF] border-[#151B2D] text-[#E4EEFE] border-none"
              : "bg-transparent text-[#9499AA] border-none hover:bg-[#1e253b] hover:text-white"
            }`}
        >
          {p}
        </button>
      </li>
    );
  });

  return (
    <nav aria-label="Pagination">
      <ul className="flex justify-center items-center gap-[8px]">
        <li>
          <button
            type="button"
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-[80px] h-[36px] rounded-[6px] flex items-center justify-center text-[14px] transition-colors
              ${currentPage === 1
                ? "text-[#6b7280] bg-transparent cursor-not-allowed border-none"
                : "text-[#9499AA] bg-transparent hover:bg-[#1e253b] hover:text-white border-none"
              }`}
          >
            Previous
          </button>
        </li>

        {items}

        <li>
          <button
            type="button"
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`w-[80px] h-[36px] rounded-[6px] flex items-center justify-center text-[14px] transition-colors
              ${currentPage === totalPages
                ? "text-[#6b7280] bg-transparent cursor-not-allowed border-none"
                : "text-[#9499AA] bg-transparent hover:bg-[#1e253b] hover:text-white border-none"
              }`}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default CustomPagination;