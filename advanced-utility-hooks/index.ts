// Re-exportar todos os hooks
export { useFormValidation, type FormValidationState, type FormValidationActions } from './useFormValidation';
export { useAsyncValidation, type AsyncValidationState, type AsyncValidationActions } from './useAsyncValidation';

export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';

export { useLocalStorage } from './useLocalStorage';
export { useSessionStorage } from './useSessionStorage';

export { 
  useIntersectionObserver, 
  type IntersectionObserverEntry, 
  type UseIntersectionObserverReturn 
} from './useIntersectionObserver';

export { 
  useResizeObserver, 
  type ResizeObserverEntry, 
  type UseResizeObserverReturn 
} from './useResizeObserver';

export { 
  useVirtualScrolling, 
  type VirtualScrollingOptions, 
  type VirtualScrollingReturn 
} from './useVirtualScrolling';

export { 
  useInfiniteScroll, 
  type InfiniteScrollState, 
  type InfiniteScrollActions 
} from './useInfiniteScroll';