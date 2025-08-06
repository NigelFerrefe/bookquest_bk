function buildPagination({ totalItems, currentPage, perPage }) {
    const totalPages = Math.ceil(totalItems / perPage);
  
    const from = (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, totalItems);
  
    return {
      from,
      to,
      per_page: perPage,
      current_page: currentPage,
      has_more_pages: currentPage < totalPages,
      next_page: currentPage < totalPages ? currentPage + 1 : null,
      prev_page: currentPage > 1 ? currentPage - 1 : null,
    };
  }
  
  module.exports = {
    buildPagination,
  };
  