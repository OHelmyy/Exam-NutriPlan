// Reusable UI components

// Loading Spinner
export function getLoadingSpinner() {
  return `
    <div class="flex items-center justify-center py-12 col-span-full">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  `;
}

// Empty State (when no recipes or products are found)
export function getEmptyState(title = 'No recipes found', subtitle = 'Try searching for something else') {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center col-span-full">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${title}</p>
      <p class="text-gray-400 text-sm mt-2">${subtitle}</p>
    </div>
`;
}

// Error State
export function getErrorMessage(message = 'Failed to load data') {
  return `
  < div class="flex flex-col items-center justify-center py-12 text-center col-span-full" >
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
      </div>
      <p class="text-gray-700 text-lg font-semibold">Oops! Something went wrong</p>
      <p class="text-gray-500 text-sm mt-2">${message}</p>
    </div >
  `;
}
