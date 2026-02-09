# Lumina Closet AI 功能改进实施计划

## 概述

本次实施包含三项核心改进：
1. 已保存搭配页面重构（网格布局+标签分类）
2. 日记功能替换为穿着记录/穿搭日历
3. 分析页面优化（持久化+多维度统计）

---

## 任务1: 已保存搭配页面改进

### 目标
将Stylist组件中的"已保存搭配"标签页改为类似WardrobeGallery的展示方式：
- 只显示试穿效果图小图（3:4比例）
- 按标签分类展示
- 网格布局（4列）

### 文件修改
- `components/Stylist.tsx` (第619-812行)

### 实施步骤

#### 步骤1.1: 添加标签分组逻辑
```typescript
// 在savedOutfits状态后添加分组逻辑
const groupedOutfits = useMemo(() => {
  const groups: Record<string, typeof savedOutfits> = {};
  
  savedOutfits.forEach(outfit => {
    if (outfit.tags && outfit.tags.length > 0) {
      outfit.tags.forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(outfit);
      });
    } else {
      if (!groups['未分类']) groups['未分类'] = [];
      groups['未分类'].push(outfit);
    }
  });
  
  return groups;
}, [savedOutfits]);
```

#### 步骤1.2: 修改已保存搭配展示UI
替换现有的列表布局为网格布局：
```typescript
// 改为类似WardrobeGallery的网格展示
{Object.entries(groupedOutfits).map(([tag, outfits]) => (
  <div key={tag} className="space-y-3">
    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
      {tag} · {outfits.length}套
    </h3>
    <div className="grid grid-cols-4 gap-3">
      {outfits.map(outfit => (
        <div
          key={outfit.id}
          onClick={() => handleEditOutfit(outfit)}
          className="aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden cursor-pointer relative group shadow-sm"
        >
          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOutfit(outfit.id);
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Trash2 size={12} />
          </button>
          
          {/* 试穿效果图 */}
          {outfit.tryonImage ? (
            <ImageRenderer
              src={outfit.tryonImage}
              alt={outfit.name || '搭配'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-xs">无预览</span>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
))}
```

---

## 任务2: 替换日记功能为穿着记录

### 目标
创建穿着记录/穿搭日历功能：
- 日历视图展示
- 点击日期记录当天穿着
- 从衣橱选择单品
- 统计穿着频率

### 文件变更
- 删除/重命名: `components/Diary.tsx`
- 创建: `components/ClothingCalendar.tsx`
- 修改: `types.ts` - 添加新类型
- 修改: `backend/src/models/` - 添加穿着记录模型
- 修改: `backend/src/routes/` - 添加穿着记录路由
- 修改: `services/api.ts` - 添加穿着记录API
- 修改: `src/hooks/` - 添加useClothingCalendar hook

### 实施步骤

#### 步骤2.1: 添加类型定义
```typescript
// types.ts
export interface ClothingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  clothingIds: string[];
  notes?: string;
  createdAt: string;
}

export interface ClothingWearStats {
  clothingId: string;
  wearCount: number;
  lastWorn?: string;
}
```

#### 步骤2.2: 创建穿着记录模型
```typescript
// backend/src/models/ClothingRecordModel.ts
export class ClothingRecordModel {
  static async create(userId: string, data: { date: string; clothingIds: string[]; notes?: string }) {
    // 实现创建记录
  }
  
  static async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string) {
    // 查询日期范围内的记录
  }
  
  static async getWearStats(userId: string) {
    // 统计每件衣服的穿着次数
  }
}
```

#### 步骤2.3: 创建穿着记录组件
实现日历视图和记录功能（详细代码见实际实现）

---

## 任务3: 分析页面优化

### 目标
1. 保存分析结果到数据库
2. 显示"上次分析时间"
3. 添加"重新分析"按钮
4. 多维度统计展示

### 文件变更
- 修改: `backend/src/models/` - 添加分析结果表
- 修改: `backend/src/routes/analytics.ts` - 添加保存/获取分析结果接口
- 修改: `services/api.ts` - 添加分析结果API
- 修改: `components/Analytics.tsx` - 重构展示逻辑

### 数据库表设计
```sql
CREATE TABLE analysis_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_stats TEXT, -- JSON
  color_stats TEXT, -- JSON
  brand_stats TEXT, -- JSON
  price_stats TEXT, -- JSON
  wear_stats TEXT, -- JSON
  ai_analysis TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 实施步骤

#### 步骤3.1: 创建分析结果模型
```typescript
// backend/src/models/AnalysisResultModel.ts
export class AnalysisResultModel {
  static async save(userId: string, data: AnalysisData) {
    // 保存分析结果
  }
  
  static async findLatestByUserId(userId: string) {
    // 获取最新分析结果
  }
}
```

#### 步骤3.2: 扩展analytics路由
```typescript
// backend/src/routes/analytics.ts
// 添加保存分析结果接口
router.post('/save', asyncHandler(async (req, res) => {
  // 保存分析结果
}));

// 添加获取分析结果接口
router.get('/latest', asyncHandler(async (req, res) => {
  // 返回最新分析结果
}));
```

#### 步骤3.3: 重构Analytics组件
- 添加"上次分析时间"显示
- 添加"重新分析"按钮
- 多维度统计图表（价格、品牌、穿着频率等）

---

## 执行顺序

1. **任务1** - 已保存搭配页面改进（前端修改，风险低）
2. **任务2** - 穿着记录功能（前后端修改，中等复杂度）
3. **任务3** - 分析页面优化（前后端修改，中等复杂度）
4. **测试验证** - 确保所有功能正常工作

---

## 注意事项

1. **向后兼容**: 确保现有数据不受影响
2. **错误处理**: 所有API调用需要适当的错误处理
3. **性能**: 大量数据时需要分页或虚拟滚动
4. **用户体验**: 添加适当的加载状态和空状态提示

---

**计划创建时间**: 2026-02-08
**预计实施时间**: 2-3小时
