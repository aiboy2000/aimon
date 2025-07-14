import { PinyinProcessor } from '../processors/PinyinProcessor';

describe('PinyinProcessor', () => {
  let processor: PinyinProcessor;

  beforeEach(() => {
    processor = new PinyinProcessor();
  });

  describe('Pinyin detection', () => {
    it('should detect valid pinyin sequences', () => {
      expect(processor.isPinyinSequence('ni')).toBe(true);
      expect(processor.isPinyinSequence('hao')).toBe(true);
      expect(processor.isPinyinSequence('zhong')).toBe(true);
      expect(processor.isPinyinSequence('xue')).toBe(true);
    });

    it('should reject invalid pinyin sequences', () => {
      expect(processor.isPinyinSequence('xyz')).toBe(false);
      expect(processor.isPinyinSequence('qqqq')).toBe(false);
      expect(processor.isPinyinSequence('hello')).toBe(false);
    });

    it('should handle mixed case', () => {
      expect(processor.isPinyinSequence('Ni')).toBe(true);
      expect(processor.isPinyinSequence('HAO')).toBe(true);
    });
  });

  describe('Pinyin segmentation', () => {
    it('should segment simple pinyin correctly', () => {
      expect(processor.segmentPinyin('nihao')).toEqual(['ni', 'hao']);
      expect(processor.segmentPinyin('beijing')).toEqual(['bei', 'jing']);
      expect(processor.segmentPinyin('shanghai')).toEqual(['shang', 'hai']);
    });

    it('should handle ambiguous segmentation', () => {
      // "xian" can be "xi'an" or "xian"
      expect(processor.segmentPinyin('xian')).toEqual(['xian']);
      expect(processor.segmentPinyin('xian')).not.toEqual(['xi', 'an']);
    });

    it('should handle tone marks in segmentation', () => {
      expect(processor.segmentPinyin('ni3hao3')).toEqual(['ni3', 'hao3']);
      expect(processor.segmentPinyin('zhong1guo2')).toEqual(['zhong1', 'guo2']);
    });
  });

  describe('Character conversion', () => {
    it('should convert simple pinyin to characters', async () => {
      const result = await processor.convertToCharacters(['ni', 'hao']);
      expect(result).toEqual([
        { character: '你好', probability: expect.any(Number) }
      ]);
      expect(result[0].probability).toBeGreaterThan(0.8);
    });

    it('should provide multiple alternatives', async () => {
      const result = await processor.convertToCharacters(['shi']);
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].probability).toBeGreaterThan(result[1].probability);
      
      // Common characters for "shi"
      const characters = result.map(r => r.character);
      expect(characters).toContain('是');
      expect(characters).toContain('时');
    });

    it('should handle tone marks for disambiguation', async () => {
      const result = await processor.convertToCharacters(['ma1']);
      expect(result[0].character).toBe('妈'); // First tone

      const result2 = await processor.convertToCharacters(['ma3']);
      expect(result2[0].character).toBe('马'); // Third tone
    });

    it('should handle unknown pinyin gracefully', async () => {
      const result = await processor.convertToCharacters(['xyz']);
      expect(result).toEqual([]);
    });
  });

  describe('Full text processing', () => {
    it('should process simple pinyin text', async () => {
      const text = 'nihao';
      const result = await processor.processPinyin(text);
      
      expect(result.text).toBe('你好');
      expect(result.alternatives).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should process mixed pinyin and punctuation', async () => {
      const text = 'ni hao, shi jie!';
      const result = await processor.processPinyin(text);
      
      expect(result.text).toContain('你好');
      expect(result.text).toContain('世界');
      expect(result.text).toContain(',');
      expect(result.text).toContain('!');
    });

    it('should handle numbers in pinyin', async () => {
      const text = 'yi1 er4 san1';
      const result = await processor.processPinyin(text);
      
      expect(result.text).toBe('一二三');
    });

    it('should preserve spaces between words', async () => {
      const text = 'wo ai beijing';
      const result = await processor.processPinyin(text);
      
      expect(result.text).toBe('我爱北京');
    });

    it('should provide alternatives for ambiguous text', async () => {
      const text = 'shi';
      const result = await processor.processPinyin(text);
      
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives!.length).toBeGreaterThan(0);
      expect(result.alternatives![0]).not.toBe(result.text);
    });
  });
});