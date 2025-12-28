/**
 * API 客户端单元测试
 * 测试 lib/api.ts 中的核心功能
 */

import {
  apiClient,
  ApiError,
  novelsApi,
  authApi,
  chaptersApi,
  aiApi,
  charactersApi,
  worldSettingsApi,
  readingProgressApi,
  adventureApi
} from '@/lib/api';

// Mock fetch 全局函数
global.fetch = jest.fn();

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError(404, 'Not Found');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.detail).toBe('Not Found');
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Not Found');
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    // 清除所有 mock 调用记录
    (global.fetch as jest.Mock).mockClear();
    // 清除 localStorage
    localStorage.clear();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, title: 'Test Novel' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient.get('/novels/1');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/novels/1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw ApiError on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Novel not found' }),
      });

      await expect(apiClient.get('/novels/999')).rejects.toThrow(ApiError);

      // Reset mock for second assertion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Novel not found' }),
      });

      await expect(apiClient.get('/novels/999')).rejects.toThrow('Novel not found');
    });

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/novels');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const postData = { title: 'New Novel', description: 'Test' };
      const mockResponse = { id: 1, ...postData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await apiClient.post('/novels', postData);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { title: 'Updated Novel' };
      const mockResponse = { id: 1, ...updateData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiClient.put('/novels/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const result = await apiClient.delete('/novels/1');
      expect(result).toBeUndefined();
    });
  });
});

describe('authApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should register user successfully', async () => {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const mockResponse = {
      access_token: 'test-token',
      token_type: 'bearer',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await authApi.register(registerData);
    expect(result).toEqual(mockResponse);
  });

  it('should login user successfully', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
      remember_me: false,
    };
    const mockResponse = {
      access_token: 'test-token',
      token_type: 'bearer',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await authApi.login(loginData);
    expect(result).toEqual(mockResponse);
  });

  it('should get current user info', async () => {
    localStorage.setItem('token', 'test-token');
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    const result = await authApi.me();
    expect(result).toEqual(mockUser);
  });
});

describe('novelsApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should list novels with filters', async () => {
    const mockResponse = {
      novels: [
        { id: 1, title: 'Novel 1' },
        { id: 2, title: 'Novel 2' },
      ],
      total: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await novelsApi.list({ page: 1, page_size: 10 });
    expect(result).toEqual(mockResponse);
  });

  it('should get novel by id', async () => {
    const mockNovel = {
      id: 1,
      title: 'Test Novel',
      description: 'Test description',
      author: { id: 1, username: 'testuser' },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockNovel,
    });

    const result = await novelsApi.get(1);
    expect(result).toEqual(mockNovel);
  });

  it('should create novel', async () => {
    const novelData = {
      title: 'New Novel',
      description: 'Test',
      category: '玄幻' as const,
      is_interactive: false,
    };
    const mockResponse = { id: 1, ...novelData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const result = await novelsApi.create(novelData);
    expect(result).toEqual(mockResponse);
  });

  it('should update novel', async () => {
    const updateData = {
      title: 'Updated Novel',
      description: 'Updated description',
    };
    const mockResponse = { id: 1, ...updateData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await novelsApi.update(1, updateData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete novel', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
    });

    await expect(novelsApi.delete(1)).resolves.toBeUndefined();
  });

  it('should publish novel', async () => {
    const mockResponse = {
      id: 1,
      title: 'Test Novel',
      status: 'published' as const,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await novelsApi.publish(1, true);
    expect(result).toEqual(mockResponse);
    expect(result.status).toBe('published');
  });
});

// ============================================
// 章节 API 测试
// ============================================

describe('chaptersApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should list chapters for a novel', async () => {
    const mockResponse = {
      novel_id: 1,
      novel_title: 'Test Novel',
      chapters: [
        { id: 1, title: 'Chapter 1', order_num: 1, word_count: 1000 },
        { id: 2, title: 'Chapter 2', order_num: 2, word_count: 1500 },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await chaptersApi.list(1);
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/novels/1/chapters'),
      expect.any(Object)
    );
  });

  it('should get a specific chapter', async () => {
    const mockChapter = {
      id: 1,
      novel_id: 1,
      title: 'Chapter 1',
      content: 'Chapter content...',
      order_num: 1,
      word_count: 1000,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockChapter,
    });

    const result = await chaptersApi.get(1, 1);
    expect(result).toEqual(mockChapter);
  });

  it('should create a chapter', async () => {
    const chapterData = { title: 'New Chapter', content: 'Content...' };
    const mockResponse = { id: 3, novel_id: 1, ...chapterData, order_num: 3 };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const result = await chaptersApi.create(1, chapterData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a chapter', async () => {
    const updateData = { title: 'Updated Chapter', content: 'Updated content' };
    const mockResponse = { id: 1, novel_id: 1, ...updateData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await chaptersApi.update(1, 1, updateData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a chapter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
    });

    await expect(chaptersApi.delete(1, 1)).resolves.toBeUndefined();
  });

  it('should reorder chapters', async () => {
    const chapterIds = [3, 1, 2];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await chaptersApi.reorder(1, chapterIds);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/novels/1/chapters/reorder'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ chapter_ids: chapterIds }),
      })
    );
  });
});

// ============================================
// AI API 测试
// ============================================

describe('aiApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  describe('generateOutline', () => {
    it('should call POST /ai/outline with correct data', async () => {
      const requestData = {
        category: '玄幻',
        keywords: '修仙,逆袭',
        chapter_count: 10,
      };
      const mockResponse = {
        title: '逆天修仙录',
        description: '一个少年的修仙之路...',
        outline: '# 第一章\n...',
        usage: { prompt_tokens: 100, completion_tokens: 500, total_tokens: 600 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.generateOutline(requestData);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/outline'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('continueChapter', () => {
    it('should call POST /ai/continue with correct data', async () => {
      const requestData = {
        novel_id: 1,
        chapter_id: 1,
        chapter_outline: '主角发现了一个神秘洞穴...',
        word_count: 2000,
      };
      const mockResponse = {
        content: '生成的章节内容...',
        word_count: 2000,
        usage: { prompt_tokens: 200, completion_tokens: 1000, total_tokens: 1200 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.continueChapter(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rewrite', () => {
    it('should call POST /ai/rewrite with correct data', async () => {
      const requestData = {
        novel_id: 1,
        original_text: '原始文本...',
        rewrite_style: '更加生动',
      };
      const mockResponse = {
        rewritten_text: '重写后的文本...',
        original_word_count: 100,
        rewritten_word_count: 150,
        usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.rewrite(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('expandText', () => {
    it('should call POST /ai/expand with correct data', async () => {
      const requestData = {
        text: '他走进了房间。',
        style: '详细描写' as const,
        word_count: 500,
      };
      const mockResponse = {
        expanded_text: '他缓缓推开那扇古老的木门，走进了昏暗的房间...',
        word_count: 500,
        usage: { prompt_tokens: 30, completion_tokens: 200, total_tokens: 230 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.expandText(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateCharacter', () => {
    it('should call POST /ai/character with correct data', async () => {
      const requestData = {
        novel_id: 1,
        role_type: '主角' as const,
        design_direction: '冷酷无情的剑客',
      };
      const mockResponse = {
        character: {
          name: '叶无痕',
          gender: '男',
          age: 25,
          identity: '流浪剑客',
          appearance: '黑发黑眸...',
          personality: ['冷酷', '正义'],
          background: '曾是名门之后...',
          abilities: '剑道天才',
          role_type: '主角',
        },
        usage: { prompt_tokens: 100, completion_tokens: 300, total_tokens: 400 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.generateCharacter(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateBranch', () => {
    it('should call POST /ai/branch with correct data', async () => {
      const requestData = {
        current_scene: '主角站在悬崖边，面前是深不见底的峡谷...',
        protagonist_status: '受伤',
      };
      const mockResponse = {
        choices: [
          {
            choice_text: '纵身跳下',
            inner_monologue: '或许下面有出路...',
            possible_outcome: '发现隐藏洞穴',
            short_term_effects: ['受伤'],
            long_term_effects: ['获得宝物'],
            risk_level: '高' as const,
            emotion_tags: ['紧张', '冒险'],
            next_chapters_direction: ['探索洞穴'],
          },
        ],
        branch_type: '短期' as const,
        usage: { prompt_tokens: 150, completion_tokens: 400, total_tokens: 550 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.generateBranch(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('optimizeFormat', () => {
    it('should call POST /ai/format-optimize with correct data', async () => {
      const requestData = {
        chapter_id: 1,
        optimization_focus: '对话格式',
      };
      const mockResponse = {
        optimized_content: '优化后的内容...',
        original_word_count: 1000,
        optimized_word_count: 1050,
        usage: { prompt_tokens: 500, completion_tokens: 600, total_tokens: 1100 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.optimizeFormat(requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('optimizeFormatBatch', () => {
    it('should call POST /ai/format-optimize-batch with correct data', async () => {
      const requestData = {
        novel_id: 1,
        chapter_ids: [1, 2, 3],
        optimization_focus: '段落分隔',
      };
      const mockResponse = {
        results: [
          { chapter_id: 1, chapter_title: 'Ch1', success: true, optimized_content: '...' },
          { chapter_id: 2, chapter_title: 'Ch2', success: true, optimized_content: '...' },
        ],
        success_count: 2,
        failed_count: 0,
        total_usage: { prompt_tokens: 1000, completion_tokens: 1200, total_tokens: 2200 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await aiApi.optimizeFormatBatch(requestData);
      expect(result).toEqual(mockResponse);
    });
  });
});

// ============================================
// 角色 API 测试
// ============================================

describe('charactersApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should list characters for a novel', async () => {
    const mockResponse = {
      novel_id: 1,
      characters: [
        { id: 1, name: '主角', role_type: '主角' },
        { id: 2, name: '反派', role_type: '反派' },
      ],
      total: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await charactersApi.list(1);
    expect(result).toEqual(mockResponse);
  });

  it('should get a specific character', async () => {
    const mockCharacter = {
      id: 1,
      novel_id: 1,
      name: '叶无痕',
      role_type: '主角',
      description: '冷酷的剑客',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockCharacter,
    });

    const result = await charactersApi.get(1, 1);
    expect(result).toEqual(mockCharacter);
  });

  it('should create a character', async () => {
    const characterData = {
      name: '新角色',
      role_type: '配角' as const,
      description: '神秘的旅人',
    };
    const mockResponse = { id: 3, novel_id: 1, ...characterData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const result = await charactersApi.create(1, characterData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a character', async () => {
    const updateData = { name: '更新后的名字', description: '更新后的描述' };
    const mockResponse = { id: 1, novel_id: 1, ...updateData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await charactersApi.update(1, 1, updateData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a character', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
    });

    await expect(charactersApi.delete(1, 1)).resolves.toBeUndefined();
  });
});

// ============================================
// 世界观设定 API 测试
// ============================================

describe('worldSettingsApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should list world settings', async () => {
    const mockResponse = {
      novel_id: 1,
      world_settings: [
        { id: 1, setting_type: '地理', name: '九州大陆' },
        { id: 2, setting_type: '力量体系', name: '修仙体系' },
      ],
      total: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await worldSettingsApi.list(1);
    expect(result).toEqual(mockResponse);
  });

  it('should create a world setting', async () => {
    const settingData = {
      setting_type: '地理' as const,
      name: '东海',
      description: '广阔的海域...',
    };
    const mockResponse = { id: 3, novel_id: 1, ...settingData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const result = await worldSettingsApi.create(1, settingData);
    expect(result).toEqual(mockResponse);
  });

  it('should update a world setting', async () => {
    const updateData = { name: '更新后的名称', description: '更新后的描述' };
    const mockResponse = { id: 1, novel_id: 1, ...updateData };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await worldSettingsApi.update(1, 1, updateData);
    expect(result).toEqual(mockResponse);
  });

  it('should delete a world setting', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
    });

    await expect(worldSettingsApi.delete(1, 1)).resolves.toBeUndefined();
  });
});

// ============================================
// 阅读进度 API 测试
// ============================================

describe('readingProgressApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should get reading progress', async () => {
    const mockResponse = {
      novel_id: 1,
      chapter_id: 5,
      chapter_title: '第五章',
      choices_made: [],
      endings_unlocked: [],
      progress_percentage: 50,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await readingProgressApi.get(1);
    expect(result).toEqual(mockResponse);
  });

  it('should save reading progress', async () => {
    const progressData = { chapter_id: 6, choice_index: 1, choice_text: '选择A' };
    const mockResponse = {
      novel_id: 1,
      chapter_id: 6,
      chapter_title: '第六章',
      choices_made: [{ ...progressData, timestamp: new Date().toISOString() }],
      endings_unlocked: [],
      progress_percentage: 60,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await readingProgressApi.save(1, progressData);
    expect(result).toEqual(mockResponse);
  });

  it('should clear reading progress', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => '',
    });

    await expect(readingProgressApi.clear(1)).resolves.toBeUndefined();
  });

  it('should get choice history', async () => {
    const mockResponse = {
      choices: [
        { chapter_id: 1, chapter_title: 'Ch1', choice_index: 0, choice_text: 'A', timestamp: '2025-01-01' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await readingProgressApi.getChoiceHistory(1);
    expect(result).toEqual(mockResponse);
  });

  it('should get endings', async () => {
    const mockResponse = {
      endings: [
        { chapter_id: 10, chapter_title: '结局A', ending_description: '好结局', unlocked_at: '2025-01-01' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await readingProgressApi.getEndings(1);
    expect(result).toEqual(mockResponse);
  });
});

// ============================================
// 冒险模式 API 测试
// ============================================

describe('adventureApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('should create an adventure', async () => {
    const adventureData = {
      title: '新冒险',
      genre: '玄幻',
      protagonist_name: '主角',
    };
    const mockResponse = {
      id: 1,
      ...adventureData,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const result = await adventureApi.create(adventureData as any);
    expect(result).toEqual(mockResponse);
  });

  it('should get an adventure', async () => {
    const mockAdventure = {
      id: 1,
      title: '测试冒险',
      status: 'active',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockAdventure,
    });

    const result = await adventureApi.get(1);
    expect(result).toEqual(mockAdventure);
  });

  it('should list adventures', async () => {
    const mockResponse = {
      adventures: [
        { id: 1, title: 'Adventure 1' },
        { id: 2, title: 'Adventure 2' },
      ],
      total: 2,
      page: 1,
      page_size: 10,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await adventureApi.list({ page: 1, page_size: 10 });
    expect(result).toEqual(mockResponse);
  });

  it('should make a choice', async () => {
    const choiceData = { choice_index: 0, choice_text: '选择A' };
    const mockResponse = {
      success: true,
      new_node: { id: 2, content: '新的故事节点...' },
      state_after: { 生命值: 90 },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await adventureApi.choose(1, choiceData);
    expect(result).toEqual(mockResponse);
  });

  it('should get nodes', async () => {
    const mockNodes = [
      { id: 1, content: '开始...' },
      { id: 2, content: '继续...' },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockNodes,
    });

    const result = await adventureApi.getNodes(1);
    expect(result).toEqual(mockNodes);
  });
});
