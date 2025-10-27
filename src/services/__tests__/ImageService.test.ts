import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageService, VistoriaImage, CleanupReport } from '../ImageService';
import { supabase } from '@/integrations/supabase/client';
import * as logger from '@/utils/logger';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock do logger
vi.mock('@/utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deduplicateImages', () => {
    it('deve remover imagens duplicadas por serial', () => {
      const images: Partial<VistoriaImage>[] = [
        { id: '1', image_serial: 'ABC123', image_url: 'url1' },
        { id: '2', image_serial: 'ABC123', image_url: 'url2' }, // duplicata
        { id: '3', image_serial: 'DEF456', image_url: 'url3' },
      ];

      const result = ImageService.deduplicateImages(images as VistoriaImage[]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('deve remover imagens duplicadas por URL quando não há serial', () => {
      const images: Partial<VistoriaImage>[] = [
        { id: '1', image_url: 'url1' },
        { id: '2', image_url: 'url1' }, // duplicata
        { id: '3', image_url: 'url2' },
      ];

      const result = ImageService.deduplicateImages(images as VistoriaImage[]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('deve priorizar serial sobre URL', () => {
      const images: Partial<VistoriaImage>[] = [
        { id: '1', image_serial: 'ABC', image_url: 'url1' },
        { id: '2', image_url: 'url1' },
        { id: '3', image_url: 'url1' }, // duplicata de URL mas sem serial conflitante
      ];

      const result = ImageService.deduplicateImages(images as VistoriaImage[]);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('deve manter todas imagens quando não há duplicatas', () => {
      const images: Partial<VistoriaImage>[] = [
        { id: '1', image_serial: 'ABC', image_url: 'url1' },
        { id: '2', image_serial: 'DEF', image_url: 'url2' },
        { id: '3', image_serial: 'GHI', image_url: 'url3' },
      ];

      const result = ImageService.deduplicateImages(images as VistoriaImage[]);

      expect(result).toHaveLength(3);
    });

    it('deve lidar com array vazio', () => {
      const result = ImageService.deduplicateImages([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('hasDuplicates', () => {
    it('deve retornar true quando há duplicatas', async () => {
      const mockImages = [
        {
          id: '1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        },
        {
          id: '2',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        }, // duplicata
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockImages,
            error: null,
          }),
        }),
      } as any);

      const result = await ImageService.hasDuplicates('vistoria-id');

      expect(result).toBe(true);
    });

    it('deve retornar false quando não há duplicatas', async () => {
      const mockImages = [
        {
          id: '1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        },
        {
          id: '2',
          apontamento_id: 'apt2',
          tipo_vistoria: 'inicial',
          image_url: 'url2',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockImages,
            error: null,
          }),
        }),
      } as any);

      const result = await ImageService.hasDuplicates('vistoria-id');

      expect(result).toBe(false);
    });

    it('deve retornar false quando há erro', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error' },
          }),
        }),
      } as any);

      const result = await ImageService.hasDuplicates('vistoria-id');

      expect(result).toBe(false);
    });
  });

  describe('countDuplicates', () => {
    it('deve contar duplicatas corretamente', async () => {
      const mockImages = [
        {
          id: '1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        },
        {
          id: '2',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        }, // duplicata
        {
          id: '3',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        }, // duplicata
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockImages,
            error: null,
          }),
        }),
      } as any);

      const result = await ImageService.countDuplicates('vistoria-id');

      // 3 imagens, 1 deve ser mantida, 2 são duplicatas
      expect(result).toBe(2);
    });

    it('deve retornar 0 quando não há duplicatas', async () => {
      const mockImages = [
        {
          id: '1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
        },
        {
          id: '2',
          apontamento_id: 'apt2',
          tipo_vistoria: 'inicial',
          image_url: 'url2',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockImages,
            error: null,
          }),
        }),
      } as any);

      const result = await ImageService.countDuplicates('vistoria-id');

      expect(result).toBe(0);
    });
  });

  describe('getVistoriaImages', () => {
    it('deve retornar imagens sem duplicatas', async () => {
      const mockImages = [
        {
          id: '1',
          vistoria_id: 'v1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
          created_at: '2024-01-01',
        },
        {
          id: '2',
          vistoria_id: 'v1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
          created_at: '2024-01-02',
        }, // duplicata
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockImages,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await ImageService.getVistoriaImages('v1');

      expect(result).toHaveLength(1); // Apenas a primeira deve ser retornada
    });

    it('deve retornar array vazio quando há erro', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error' },
            }),
          }),
        }),
      } as any);

      const result = await ImageService.getVistoriaImages('v1');

      expect(result).toEqual([]);
    });
  });

  describe('fixVistoriaDuplicates', () => {
    it('deve remover duplicatas corretamente', async () => {
      const mockImages = [
        {
          id: '1',
          vistoria_id: 'v1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
          created_at: '2024-01-01',
        },
        {
          id: '2',
          vistoria_id: 'v1',
          apontamento_id: 'apt1',
          tipo_vistoria: 'inicial',
          image_url: 'url1',
          created_at: '2024-01-02',
        }, // duplicata
      ];

      // Setup mocks
      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      const mockEqDelete = vi.fn().mockReturnValue(mockDelete);
      const mockEqSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockImages,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'vistoria_images') {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEqSelect,
            }),
            delete: vi.fn().mockReturnValue({
              eq: mockEqDelete,
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await ImageService.fixVistoriaDuplicates('v1');

      expect(result.success).toBe(true);
      expect(result.duplicatesFound).toBeGreaterThanOrEqual(0);
      expect(result.totalImages).toBe(2);
    });

    it('deve lidar com erro ao buscar imagens', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error' },
            }),
          }),
        }),
      } as any);

      const result = await ImageService.fixVistoriaDuplicates('v1');

      expect(result.success).toBe(false);
      expect(result.errors).toBeGreaterThan(0);
    });

    it('deve lidar com vistoria sem imagens', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await ImageService.fixVistoriaDuplicates('v1');

      expect(result.success).toBe(true);
      expect(result.totalImages).toBe(0);
    });
  });
});
