import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import './PageNavigation.scss';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  isNarrativePage: boolean;
}

export default function PageNavigation({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onDelete,
  isNarrativePage,
}: PageNavigationProps) {
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className='page-navigation'>
      <button
        className='page-nav-btn prev'
        onClick={onPrev}
        disabled={currentPage === 0}
        title='Previous page'
      >
        <ChevronLeft size={18} />
      </button>

      <div className='page-indicator'>
        Page {currentPage + 1} of {totalPages}
      </div>

      {!isNarrativePage && (
        <button
          className='page-delete-btn'
          onClick={onDelete}
          title='Delete this page'
        >
          <Trash2 size={13} />
        </button>
      )}

      <button
        className='page-nav-btn next'
        onClick={onNext}
        title={isLastPage ? 'Add new page' : 'Next page'}
      >
        {isLastPage ? <Plus size={18} /> : <ChevronRight size={18} />}
      </button>
    </div>
  );
}
