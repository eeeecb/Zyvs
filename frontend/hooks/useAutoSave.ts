import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  delay?: number;
}

/**
 * Auto-save hook with debounced saves and batched toast notifications
 *
 * @param data - The data to auto-save
 * @param saveFn - Async function that saves the data
 * @param options - Configuration options (delay in ms)
 *
 * @example
 * ```tsx
 * const [profileData, setProfileData] = useState({ name: '', email: '' });
 *
 * const { mutateAsync: updateProfile } = useMutation({
 *   mutationFn: (data) => api.patch('/auth/profile', data),
 * });
 *
 * const { isSaving } = useAutoSave(profileData, updateProfile, { delay: 3000 });
 * ```
 */
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<any>,
  options: UseAutoSaveOptions = {}
) {
  const { delay = 3000 } = options;

  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousDataRef = useRef<T>(data);
  const saveQueueRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip on first render (initial mount)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousDataRef.current = data;
      return;
    }

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Increment save queue counter
    saveQueueRef.current++;

    // Set new debounced timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);

      try {
        await saveFn(data);

        // Show success toast only once for batched changes
        if (saveQueueRef.current > 0) {
          toast.success('✓ Configurações salvas', {
            className: 'bg-[#00ff88] text-black border-2 border-black font-bold',
            duration: 3000,
          });
          saveQueueRef.current = 0;
        }
      } catch (error: any) {
        console.error('Auto-save error:', error);
        toast.error('✗ Erro ao salvar', {
          description: error.message || 'Tente novamente',
          className: 'bg-[#ff3366] text-white border-2 border-black font-bold',
          duration: 4000,
        });
      } finally {
        setIsSaving(false);
        previousDataRef.current = data;
      }
    }, delay);

    // Cleanup timeout on unmount or data change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, delay]);

  return { isSaving };
}
